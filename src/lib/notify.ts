export async function sendAdminNotification(message: string) {
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

  return success;
}
