const fs = require('fs');
const path = require('path');

// Read articles data
const articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));

// Generate HTML for articles
function generateArticleHTML(article) {
    return `
        <div class="article" data-id="${article.id}">
            <div class="article-header">
                <h3 class="article-title">${article.title}</h3>
                <span class="article-date">${article.date}</span>
            </div>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-tags">
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <button class="read-more" onclick="showArticle(${article.id})">Читать далее</button>
        </div>
    `;
}

// Generate modal HTML for full article
function generateModalHTML(article) {
    return `
        <div id="article-modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 class="modal-title">${article.title}</h2>
                <p class="modal-date">${article.date}</p>
                <div class="modal-content-text">${article.content}</div>
                <div class="modal-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// Generate complete HTML
function generateHTML() {
    const articlesHTML = articles.map(article => generateArticleHTML(article)).join('');
    const modalsHTML = articles.map(article => generateModalHTML(article)).join('');
    
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Tech Blog - Блог о искусственном интеллекте</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 40px 0;
            color: white;
        }
        
        h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .stats {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            color: white;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-item {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .articles-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        
        .article {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .article:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .article-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .article-title {
            font-size: 1.3rem;
            color: #2c3e50;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        
        .article-date {
            background: #3498db;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            white-space: nowrap;
        }
        
        .article-excerpt {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .article-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
        }
        
        .read-more {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            width: 100%;
        }
        
        .read-more:hover {
            background: linear-gradient(45deg, #2980b9, #1f618d);
            transform: translateY(-2px);
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
        }
        
        .modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 30px;
            border-radius: 15px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
            from {
                transform: translateY(-50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .close {
            position: absolute;
            right: 20px;
            top: 15px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            color: #aaa;
        }
        
        .close:hover {
            color: #333;
        }
        
        .modal-title {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.8rem;
        }
        
        .modal-date {
            color: #7f8c8d;
            margin-bottom: 20px;
            font-size: 0.9rem;
        }
        
        .modal-content-text {
            line-height: 1.6;
            color: #333;
            margin-bottom: 20px;
        }
        
        .modal-content-text h2 {
            color: #2c3e50;
            margin: 20px 0 10px 0;
            font-size: 1.4rem;
        }
        
        .modal-content-text h3 {
            color: #2c3e50;
            margin: 15px 0 8px 0;
            font-size: 1.2rem;
        }
        
        .modal-content-text p {
            margin-bottom: 15px;
        }
        
        .update-info {
            text-align: center;
            color: white;
            margin-top: 40px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }
            
            .articles-grid {
                grid-template-columns: 1fr;
            }
            
            .modal-content {
                margin: 10% auto;
                width: 95%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>AI Tech Blog</h1>
            <p class="subtitle">Блог о искусственном интеллекте и технологиях 2026</p>
        </header>
        
        <div class="stats">
            <h2>Статистика блога</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${articles.length}</span>
                    <span class="stat-label">Статей</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${new Set(articles.flatMap(a => a.tags)).size}</span>
                    <span class="stat-label">Тегов</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${articles.filter(a => a.monetization && a.monetization.length > 0).length}</span>
                    <span class="stat-label">Монетизировано</span>
                </div>
            </div>
        </div>
        
        <div class="articles-grid">
            ${articlesHTML}
        </div>
        
        <div class="update-info">
            <p>🤍 Последнее обновление: <span id="update-date">${new Date().toLocaleDateString('ru-RU')}</span></p>
            <p>🔄 Автоматическое обновление каждые 2 часа</p>
        </div>
    </div>
    
    ${modalsHTML}
    
    <script>
        // Display articles
        function displayArticles() {
            const articlesContainer = document.querySelector('.articles-grid');
            if (articlesContainer) {
                articlesContainer.innerHTML = document.querySelectorAll('.article').forEach(article => {
                    articlesContainer.appendChild(article);
                });
            }
        }
        
        // Show article modal
        function showArticle(id) {
            const modal = document.getElementById('article-modal');
            const article = document.querySelector(\`.article[data-id="\${id}"]\`);
            if (modal && article) {
                modal.style.display = 'block';
            }
        }
        
        // Close modal
        document.querySelector('.close').onclick = function() {
            document.getElementById('article-modal').style.display = 'none';
        }
        
        // Close modal on click outside
        window.onclick = function(event) {
            const modal = document.getElementById('article-modal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            displayArticles();
            document.getElementById('update-date').textContent = new Date().toLocaleDateString('ru-RU');
        });
    </script>
</body>
</html>`;
}

// Generate and save static HTML
function main() {
    try {
        console.log('🏗️ Building static HTML...');
        
        const html = generateHTML();
        fs.writeFileSync('index-static.html', html, 'utf8');
        
        console.log('✅ Static HTML generated successfully');
        console.log('📁 File: index-static.html');
        
    } catch (error) {
        console.error('❌ Error generating static HTML:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { generateHTML };