const fs = require('fs');
const path = require('path');

// Функция для форматирования сообщения об обновлении
function formatUpdateMessage(success = true, error = null) {
    const timestamp = new Date().toLocaleString('ru-RU');
    
    if (success) {
        return `
🎉 AI Tech Blog успешно обновлен!

📊 Статистика обновления:
✅ Новые статьи: сгенерированы
✅ Статическая версия: создана  
✅ Развертывание на Vercel: запущено
✅ AdSense: активен
✅ Партнерские программы: подключены

🌐 Сайт доступен: https://ai-tech-blog-steel.vercel.app
⏰ Время обновления: ${timestamp}

💰 Заработок продолжается 24/7!

📈 Следующее обновление: через 2 часа
        `;
    } else {
        return `
❌ Ошибка обновления AI Tech Blog

📊 Детали ошибки:
• Ошибка: ${error}
• Время: ${timestamp}

🔧 Рекомендации:
1. Проверьте подключение к интернету
2. Убедитесь, что Vercel доступен
3. Проверьте права доступа к файлам

🔄 Попробуйте обновить вручную:
cd /c/Users/Admin/ai-tech-blog
node update-manager.js manualUpdate
        `;
    }
}

// Функция для логирования обновлений
function logUpdate(status, message, error = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        status: status,
        message: message,
        error: error
    };
    
    const logPath = path.join(__dirname, 'update-logs.json');
    let logs = [];
    
    if (fs.existsSync(logPath)) {
        try {
            logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {
            console.log('Ошибка чтения логов:', e);
        }
    }
    
    logs.push(logEntry);
    
    // Сохраняем только последние 50 записей
    if (logs.length > 50) {
        logs = logs.slice(-50);
    }
    
    try {
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
        console.log('✅ Лог обновления сохранен');
    } catch (e) {
        console.log('❌ Ошибка сохранения лога:', e);
    }
}

// Функция для проверки статуса сайта
async function checkWebsiteStatus() {
    const https = require('https');
    
    return new Promise((resolve) => {
        const req = https.get('https://ai-tech-blog-steel.vercel.app', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({
                        status: 'online',
                        title: data.match(/<title>(.*?)<\/title>/)?.[1] || 'Без названия',
                        size: data.length
                    });
                } else {
                    resolve({
                        status: 'error',
                        statusCode: res.statusCode,
                        message: 'Сайт не доступен'
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({
                status: 'offline',
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                status: 'timeout',
                message: 'Таймаут запроса'
            });
        });
    });
}

// Функция для отправки уведомлений (заглушка для Telegram)
async function sendTelegramNotification(message) {
    console.log('📱 Отправка уведомления в Telegram:');
    console.log(message);
    
    // Здесь можно добавить реальную интеграцию с Telegram Bot API
    // Например, через webhook или запрос к API
    
    return true;
}

// Экспортируем функции
module.exports = {
    formatUpdateMessage,
    logUpdate,
    checkWebsiteStatus,
    sendTelegramNotification
};