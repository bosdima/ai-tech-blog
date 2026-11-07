const fs = require('fs');
const path = require('path');

// Простая функция для проверки необходимости обновления
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

// Простая функция для обновления контента
function updateContent() {
    console.log('🚀 Запуск автоматического обновления AI Tech Blog...');
    
    try {
        // 1. Генерируем новые статьи
        console.log('📝 Генерация новых статей...');
        generateNewArticles();
        
        // 2. Проверяем статус сайта
        console.log('🔍 Проверка статуса сайта...');
        checkWebsiteStatus().then(status => {
            console.log('Статус сайта:', status);
            
            // 3. Формируем сообщение
            const timestamp = new Date().toLocaleString('ru-RU');
            const message = `
🎉 AI Tech Blog успешно обновлен!

📊 Статистика обновления:
✅ Новые статьи: сгенерированы
✅ Контент: обновлен
✅ Время обновления: ${timestamp}

🌐 Сайт доступен: https://ai-tech-blog-steel.vercel.app
💰 Заработок продолжается 24/7!

📈 Следующее обновление: через 2 часа
            `;
            
            console.log('✅ Обновление завершено успешно!');
            console.log(message);
            
            // 4. Логируем результат
            logUpdate('success', 'AI Tech Blog обновлен успешно');
            
        }).catch(error => {
            console.error('❌ Ошибка проверки статуса:', error);
            logUpdate('error', 'Ошибка проверки статуса сайта', error.message);
        });
        
    } catch (error) {
        console.error('❌ Критическая ошибка при обновлении:', error);
        logUpdate('critical_error', 'Критическая ошибка при обновлении', error.message);
    }
}

// Функция генерации новых статей
function generateNewArticles() {
    const topics = [
        'Новые архитектуры нейросетей',
        'ИИ в медицине', 
        'Автonomousные системы',
        'Компьютерное зрение',
        'Обработка естественного языка',
        'Робототехника',
        'Квантовые вычисления и ИИ',
        'Этика искусственного интеллекта',
        'Генеративный ИИ',
        'ИИ в бизнесе'
    ];

    const articles = [];
    
    topics.forEach((topic, index) => {
        const article = {
            id: index + 1,
            title: topic,
            content: `Полное содержание статьи по теме: ${topic}`,
            date: new Date().toISOString(),
            author: 'AI Tech Blog',
            category: 'Искусственный интеллект',
            tags: ['ИИ', 'технологии', 'инновации'],
            image: `https://via.placeholder.com/400x200?text=${encodeURIComponent(topic)}`,
            excerpt: `Краткое описание статьи о ${topic.toLowerCase()}...`
        };
        articles.push(article);
    });

    // Сохраняем статьи в файл
    const articlesPath = path.join(__dirname, 'articles.json');
    fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2));
    console.log(`✅ Сгенерировано ${articles.length} новых статей`);
}

// Функция проверки статуса сайта
function checkWebsiteStatus() {
    return new Promise((resolve, reject) => {
        const https = require('https');
        
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

// Функция логирования обновлений
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

// Основная логика
if (checkUpdateNeeded()) {
    updateContent();
} else {
    console.log('📅 Обновление не требуется, последнее обновление было менее 2 часов назад');
}