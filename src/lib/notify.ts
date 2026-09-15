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

export async function sendAdminNotification(message: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineUserId = process.env.LINE_ADMIN_USER_ID;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  let success = false;

  // 1. Send via LINE Official Account (Messaging API)
  if (lineToken && lineUserId) {
    try {
      const userIds = lineUserId.split(',').map(id => id.trim()).filter(id => id.length > 0);
      
      const endpoint = userIds.length > 1 
        ? 'https://api.line.me/v2/bot/message/multicast' 
        : 'https://api.line.me/v2/bot/message/push';
        
      const bodyPayload: any = {
        messages: [
          {
            type: 'text',
            text: message
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
      if (response.ok) success = true;
    } catch (err) {
      console.error("Failed to send LINE notification", err);
    }
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
          content: message
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
          text: message
        })
      });
      if (response.ok) success = true;
    } catch (err) {
      console.error("Failed to send Telegram notification", err);
    }
  }

  await recordNotification('ADMIN', success ? 'SENT' : 'FAILED', undefined, undefined, 'MULTI');
  return success;
}

export async function sendCustomerNotification(profileId: string, message: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) {
    await recordNotification('CUSTOMER', 'SKIPPED', profileId, 'LINE_NOT_CONFIGURED');
    return false;
  }

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
        messages: [{ type: 'text', text: message }]
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
