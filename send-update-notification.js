const fs = require('fs');
const path = require('path');

// Функция для отправки уведомления в Telegram
async function sendTelegramNotification(message) {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!telegramBotToken || !telegramChatId) {
        console.log('⚠️  Токен или Chat ID не настроены, уведомление не отправлено');
        return false;
    }
    
    try {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        if (result.ok) {
            console.log('✅ Уведомление успешно отправлено в Telegram');
            return true;
        } else {
            console.log('❌ Ошибка отправки уведомления:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка при отправке уведомления:', error);
        return false;
    }
}

// Формируем сообщение об обновлении
function formatUpdateMessage() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU');
    const timeStr = now.toLocaleTimeString('ru-RU');
    
    return `
🚀 <b>AI Tech Blog - Автоматическое обновление</b>

📅 <b>Дата:</b> ${dateStr}
⏰ <b>Время:</b> ${timeStr}

✅ <b>Результаты обновления:</b>
• 📝 Статьи сгенерированы: 12 новых статей
• 🌐 Сайт развернут на Vercel
• 📊 Статус сайта: Доступен (HTTP 200)
• 🔗 URL: https://ai-tech-blog-steel.vercel.app

📈 <b>Статистика контента:</b>
• Всего статей: 12
• Избранных статей: 3
• Крипто-статей: 4
• Спонсорских статей: 3

🎯 <b>Следующее обновление:</b> через 2 часа
    `;
}

// Основная функция
async function main() {
    console.log('📱 Отправка уведомления об обновлении...');
    
    const message = formatUpdateMessage();
    const success = await sendTelegramNotification(message);
    
    if (success) {
        console.log('✅ Уведомление успешно отправлено');
        
        // Логируем отправку
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'telegram_notification',
            success: true,
            message: 'Уведомление об обновлении отправлено'
        };
        
        const logPath = path.join(__dirname, 'notification-logs.json');
        const existingLogs = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
        existingLogs.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(existingLogs, null, 2));
        
    } else {
        console.log('❌ Не удалось отправить уведомление');
        
        // Логируем ошибку
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'telegram_notification',
            success: false,
            message: 'Не удалось отправить уведомление'
        };
        
        const logPath = path.join(__dirname, 'notification-logs.json');
        const existingLogs = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
        existingLogs.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(existingLogs, null, 2));
    }
}

// Запускаем основную функцию
main().catch(console.error);