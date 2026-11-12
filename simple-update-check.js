const fs = require('fs');
const path = require('path');

// Функция для проверки необходимости обновления
function checkUpdateNeeded() {
    const articlesPath = path.join(__dirname, 'articles.json');
    
    if (!fs.existsSync(articlesPath)) {
        return true; // Нужно создавать статьи
    }
    
    const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    const lastUpdate = new Date(articles[articles.length - 1]?.date || '2020-01-01');
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    
    // Обновляем, если прошло более 2 часов или статей мало
    return hoursSinceUpdate > 2 || articles.length < 5;
}

// Функция для проверки статуса сайта
async function checkWebsiteStatus() {
    try {
        const https = require('https');
        const url = 'https://bosdima.github.io/ai-tech-blog/';
        
        return new Promise((resolve) => {
            const req = https.get(url, (res) => {
                resolve({ status: 'online', statusCode: res.statusCode, message: 'Сайт доступен' });
            });
            
            req.on('error', (error) => {
                resolve({ status: 'offline', message: error.message });
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                resolve({ status: 'timeout', message: 'Timeout при проверке сайта' });
            });
        });
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

async function runSimpleUpdate() {
    console.log('🔍 Проверка необходимости обновления AI Tech Blog...');
    
    const updateNeeded = checkUpdateNeeded();
    console.log('Нужно обновление:', updateNeeded);
    
    if (updateNeeded) {
        console.log('📋 Проверка статуса сайта...');
        const status = await checkWebsiteStatus();
        console.log('Статус сайта:', status);
        
        // Здесь можно добавить логику обновления контента
        // Но пока просто сообщим, что обновление нужно
        
        return {
            update_needed: true,
            status: status,
            message: 'Обновление необходимо, требуется ручное обновление контента'
        };
    } else {
        return {
            update_needed: false,
            message: 'Обновление не требуется, контент свежий'
        };
    }
}

// Запускаем проверку
runSimpleUpdate().then(result => {
    console.log('Результат:', result.message);
    
    if (result.update_needed) {
        console.log('⚠️  Требуется обновление контента');
        // Здесь можно добавить логику отправки уведомления в Telegram
    } else {
        console.log('✅ Всё в порядке, обновление не требуется');
    }
    
    process.exit(0);
}).catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
});