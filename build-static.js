const fs = require('fs');
const path = require('path');

// Построение статического HTML сайта
function buildStaticSite() {
    // Чтение статей
    const articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
    
    // Генерация HTML контента
    const articlesHtml = articles.map(article => `
        <article class="article-card">
            <div class="article-image">
                <img src="${article.image}" alt="${article.title}">
            </div>
            <div class="article-content">
                <div class="article-meta">
                    <span class="article-date">${article.date}</span>
                    <span class="article-category">${article.category}</span>
                    ${article.featured ? '<span class="article-badge">Избранное</span>' : ''}
                </div>
                <h2 class="article-title">${article.title}</h2>
                <p class="article-description">${article.meta_description}</p>
                <div class="article-stats">
                    <span>⏱️ ${article.reading_time} мин</span>
                    <span>👁️ ${article.views}</span>
                    <span>❤️ ${article.likes}</span>
                    <span>💬 ${article.comments}</span>
                </div>
                <a href="${article.url}" class="article-link">Читать статью</a>
            </div>
        </article>
    `).join('');
    
    // Генерация полной HTML страницы
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Tech Blog - Новости и технологии искусственного интеллекта</title>
    <meta name="description" content="Автоматический блог о технологиях ИИ, криптовалютах и инновациях 2026 года">
    <meta name="keywords" content="ИИ, искусственный интеллект, технологии, криптовалюта, 2026">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>🤖 AI Tech Blog</h1>
            <p class="subtitle">Автоматический блог о технологиях и искусственном интеллекте</p>
            <div class="stats">
                <span class="stat">📄 ${articles.length} статей</span>
                <span class="stat">👁️ ${articles.reduce((sum, a) => sum + a.views, 0)} просмотров</span>
                <span class="stat">❤️ ${articles.reduce((sum, a) => sum + a.likes, 0)} лайков</span>
            </div>
        </div>
    </header>
    
    <main class="main">
        <div class="container">
            <section class="featured">
                <h2>🌟 Избранные статьи</h2>
                <div class="featured-grid">
                    ${articles.filter(a => a.featured).slice(0, 3).map(article => `
                        <div class="featured-card">
                            <img src="${article.image}" alt="${article.title}">
                            <h3>${article.title}</h3>
                            <p>${article.meta_description}</p>
                            <a href="${article.url}" class="btn">Читать</a>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <section class="all-articles">
                <h2>📰 Все статьи</h2>
                <div class="articles-grid">
                    ${articlesHtml}
                </div>
            </section>
        </div>
    </main>
    
    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 AI Tech Blog. Автоматический заработок на технологиях.</p>
            <p>Обновлено: ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}</p>
        </div>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
    
    // Сохранение HTML файла
    fs.writeFileSync('index-static.html', html);
    console.log('✅ Статический сайт успешно создан');
    
    return html;
}

// Построение сайта
const staticHtml = buildStaticSite();

console.log('🚀 Построение статического сайта завершено!');
console.log(`📄 Файл: index-static.html`);
console.log(`📊 Размер: ${Buffer.byteLength(staticHtml, 'utf8')} байт`);