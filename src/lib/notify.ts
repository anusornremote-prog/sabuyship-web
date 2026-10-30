'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function recordNotification(recipientType: 'ADMIN' | 'CUSTOMER', status: 'SENT' | 'FAILED' | 'SKIPPED', recipientProfileId?: string, errorCode?: string, channel = 'LINE') {
  try {
    await createAdminClient().from('notification_logs').insert({
      recipient_type: recipientType,
      recipient_profile_id: recipientProfileId || null,
      channel,
      status,
      error_code: errorCode || null,
    })
  } catch {
    // Notifications must remain best-effort even if the logging table is unavailable.
  }
}

export async function getAdminLineUserIds(): Promise<string[]> {
  const ids = new Set<string>();

  // 1. From environment variable LINE_ADMIN_USER_ID
  const envLineUserId = process.env.LINE_ADMIN_USER_ID;
  if (envLineUserId) {
    envLineUserId.split(',').forEach(id => {
      const clean = id.trim();
      if (clean && clean.startsWith('U')) ids.add(clean);
    });
  }

  // 2. From site_settings table (key: 'line_admin_user_ids')
  try {
    const adminClient = createAdminClient();
    const { data: setting } = await adminClient
      .from('site_settings')
      .select('value')
      .eq('key', 'line_admin_user_ids')
      .maybeSingle();

    if (setting && setting.value) {
      const raw = typeof setting.value === 'string' ? setting.value : String(setting.value);
      raw.split(',').forEach(id => {
        const clean = id.trim().replace(/[\[\]"']/g, '');
        if (clean && clean.startsWith('U')) ids.add(clean);
      });
    }
  } catch (err) {
    console.error('Failed to fetch admin LINE IDs from site_settings:', err);
  }

  // 3. From profiles table where role = 'ADMIN' and line_uid is not null
  try {
    const adminClient = createAdminClient();
    const { data: adminProfiles } = await adminClient
      .from('profiles')
      .select('line_uid')
      .eq('role', 'ADMIN')
      .eq('is_active', true)
      .not('line_uid', 'is', null);

    if (adminProfiles) {
      adminProfiles.forEach(p => {
        if (p.line_uid && typeof p.line_uid === 'string') {
          const clean = p.line_uid.trim();
          if (clean && clean.startsWith('U')) ids.add(clean);
        }
      });
    }
  } catch (err) {
    console.error('Failed to fetch admin LINE UIDs from profiles:', err);
  }

  return Array.from(ids);
}

export async function sendAdminNotification(message: string) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const finalMessage = isDemo ? `[DEMO] ${message}` : message;

  let success = false;
  let lastErrorCode: string | undefined = undefined;

  // 1. Send via LINE Official Account (Messaging API) to all admins
  const userIds = await getAdminLineUserIds();

  if (lineToken && userIds.length > 0) {
    try {
      const endpoint = userIds.length > 1 
        ? 'https://api.line.me/v2/bot/message/multicast' 
        : 'https://api.line.me/v2/bot/message/push';
        
      const bodyPayload: any = {
        messages: [
          {
            type: 'text',
            text: finalMessage
          }
        ]
      };
      
      if (userIds.length > 1) {
        bodyPayload.to = userIds;
      } else {
        bodyPayload.to = userIds[0];
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineToken}`
        },
        body: JSON.stringify(bodyPayload)
      });
      if (response.ok) {
        success = true;
      } else {
        const errorText = await response.text();
        console.error(`LINE notification returned HTTP ${response.status}:`, errorText);
        lastErrorCode = `LINE_HTTP_${response.status}`;
      }
    } catch (err) {
      console.error("Failed to send LINE notification", err);
      lastErrorCode = "LINE_NETWORK_ERROR";
    }
  } else {
    lastErrorCode = !lineToken ? "LINE_TOKEN_MISSING" : "LINE_USER_ID_MISSING";
  }

  // 2. Send via Discord Webhook
  if (discordWebhookUrl) {
    try {
      const response = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: finalMessage
        })
      });
      if (response.ok) success = true;
    } catch (err) {
      console.error("Failed to send Discord notification", err);
    }
  }

  // 3. Send via Telegram Bot
  if (telegramBotToken && telegramChatId) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: finalMessage
        })
      });
      if (response.ok) success = true;
    } catch (err) {
      console.error("Failed to send Telegram notification", err);
    }
  }

  await recordNotification('ADMIN', success ? 'SENT' : 'FAILED', undefined, success ? undefined : lastErrorCode, 'MULTI');
  return success;
}

export async function sendCustomerNotification(profileId: string, message: string) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) {
    await recordNotification('CUSTOMER', 'SKIPPED', profileId, 'LINE_NOT_CONFIGURED');
    return false;
  }

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const finalMessage = isDemo ? `[DEMO] ${message}` : message;

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('line_uid').eq('id', profileId).single();

    if (!profile || !profile.line_uid) {
      await recordNotification('CUSTOMER', 'SKIPPED', profileId, 'LINE_UID_MISSING');
      return false;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`
      },
      body: JSON.stringify({
        to: profile.line_uid,
        messages: [{ type: 'text', text: finalMessage }]
      })
    });
    await recordNotification('CUSTOMER', response.ok ? 'SENT' : 'FAILED', profileId, response.ok ? undefined : `HTTP_${response.status}`);
    return response.ok;
  } catch (err) {
    console.error("Failed to send customer LINE notification", err);
    await recordNotification('CUSTOMER', 'FAILED', profileId, 'REQUEST_FAILED');
    return false;
  }
}
