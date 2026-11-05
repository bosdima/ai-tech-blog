const fs = require('fs');
const path = require('path');

// Простая функция проверки необходимости обновления
function checkUpdateNeeded() {
    const articlesPath = path.join(__dirname, 'articles.json');
    
    if (!fs.existsSync(articlesPath)) {
        return true; // Нужно создавать статьи
    }
    
    try {
        const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
        const lastUpdate = new Date(articles[articles.length - 1]?.date || '2020-01-01');
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
        
        // Обновляем, если прошло более 2 часов или статей мало
        return hoursSinceUpdate > 2 || articles.length < 5;
    } catch (error) {
        console.log('Ошибка чтения articles.json:', error);
        return true;
    }
}

// Простая функция обновления контента
function updateContent() {
    console.log('📝 Обновление контента AI Tech Blog...');
    
    try {
        // Читаем текущие статьи
        const articlesPath = path.join(__dirname, 'articles.json');
        let articles = [];
        
        if (fs.existsSync(articlesPath)) {
            articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
        }
        
        // Генерируем новые статьи (простой метод)
        const topics = [
            'Новые архитектуры нейросетей',
            'ИИ в медицине',
            'Автономные системы',
            'Компьютерное зрение',
            'Обработка естественного языка',
            'Робототехника',
            'Квантовые вычисления и ИИ',
            'Этика искусственного интеллекта',
            'Генеративный ИИ',
            'ИИ в бизнесе'
        ];
        
        const newArticles = topics.map((topic, index) => ({
            id: Date.now() + index,
            title: `${topic}: последние достижения 2026`,
            excerpt: `Обзор последних разработок в области ${topic}. Анализ трендов и прогнозы развития.`,
            content: `Полная статья о ${topic}. Здесь может быть подробный контент о последних достижениях и технологиях.`,
            date: new Date().toLocaleDateString('ru-RU'),
            tags: [topic.toLowerCase()],
            monetization: [
                { name: 'Coursera', url: 'https://www.coursera.org', commission: '15-45%' },
                { name: 'Udacity', url: 'https://www.udacity.com', commission: '20%' }
            ]
        }));
        
        // Добавляем новые статьи
        articles = [...articles, ...newArticles];
        
        // Сохраняем
        fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2));
        
        console.log(`✅ Обновлено ${newArticles.length} новых статей`);
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка обновления контента:', error);
        return false;
    }
}

// Функция генерации статической версии
function generateStaticVersion() {
    console.log('🔄 Генерация статической версии...');
    
    try {
        // Читаем статьи
        const articlesPath = path.join(__dirname, 'articles.json');
        let articles = [];
        
        if (fs.existsSync(articlesPath)) {
            articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
        }
        
        // Генерируем HTML
        const articlesHtml = articles.map(article => `
        <article class="article-card">
            <div class="article-date">${article.date}</div>
            <h2>${article.title}</h2>
            <p class="article-excerpt">${article.excerpt}</p>
            <button class="read-more" onclick="showArticle('${article.id}')">Читать далее →</button>
        </article>
    `).join('');
        
        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Tech Блог - Новости и технологии искусственного интеллекта</title>
    <meta name="description" content="Автоматический блог о технологиях ИИ, нейросетях и искусственном интеллекте. Последние новости, обзоры и практические руководства.">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3628466575286373" crossorigin="anonymous"></script>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 0; text-align: center; margin-bottom: 2rem; }
        .articles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .article-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .article-date { color: #666; font-size: 0.9rem; margin-bottom: 0.5rem; }
        .article-card h2 { color: #333; margin-bottom: 1rem; }
        .article-excerpt { color: #666; margin-bottom: 1rem; }
        .read-more { background: #667eea; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        .ad-banner { margin: 20px 0; text-align: center; }
        .ad-banner ins { display: block; width: 100%; height: 90px; }
        footer { background: #333; color: white; text-align: center; padding: 2rem 0; margin-top: 3rem; }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>AI Tech Блог</h1>
            <p>Автоматизированный источник новостей и технологий ИИ</p>
        </div>
    </header>
    
    <div class="container">
        <div class="ad-banner">
            <ins class="adsbygoogle"
                 style="display:block; width:100%; height:90px;"
                 data-ad-client="ca-pub-3628466575286373"
                 data-ad-slot="1234567890"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>
        
        <div class="articles-grid">
            ${articlesHtml}
        </div>
    </div>
    
    <footer>
        <div class="container">
            <p>&copy; 2026 AI Tech Блог. Автоматическая генерация контента.</p>
        </div>
    </footer>
</body>
</html>`;
        
        // Сохраняем статическую версию
        fs.writeFileSync(path.join(__dirname, 'index-static.html'), html);
        
        console.log('✅ Статическая версия сгенерирована');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка генерации статической версии:', error);
        return false;
    }
}

// Основная функция обновления
function autoUpdate() {
    console.log('🚀 Запуск автоматического обновления AI Tech Blog...');
    
    try {
        // 1. Проверяем необходимость обновления
        const needsUpdate = checkUpdateNeeded();
        console.log(`Проверка обновления: ${needsUpdate ? 'Нужно' : 'Не нужно'}`);
        
        if (!needsUpdate) {
            console.log('✅ Обновление не требуется');
            return true;
        }
        
        // 2. Обновляем контент
        const contentUpdated = updateContent();
        if (!contentUpdated) {
            console.log('❌ Ошибка обновления контента');
            return false;
        }
        
        // 3. Генерируем статическую версию
        const staticGenerated = generateStaticVersion();
        if (!staticGenerated) {
            console.log('❌ Ошибка генерации статической версии');
            return false;
        }
        
        // 4. Сохраняем лог
        const logEntry = {
            timestamp: new Date().toISOString(),
            status: 'success',
            message: 'AI Tech Blog обновлен успешно'
        };
        
        const logPath = path.join(__dirname, 'update-logs.json');
        let logs = [];
        
        if (fs.existsSync(logPath)) {
            logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        
        logs.push(logEntry);
        if (logs.length > 50) logs = logs.slice(-50);
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
        
        console.log('✅ Обновление завершено успешно!');
        return true;
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        return false;
    }
}

// Экспортируем функции
module.exports = {
    checkUpdateNeeded,
    autoUpdate,
    updateContent,
    generateStaticVersion
};