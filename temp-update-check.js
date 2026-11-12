const fs = require('fs');
const path = require('path');
const articlesPath = path.join(__dirname, 'articles.json');

// Функция для проверки необходимости обновления
function checkUpdateNeeded() {
    if (!fs.existsSync(articlesPath)) {
        return true; // Нужно создавать статьи
    }
    
    const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    const lastUpdate = new Date(articles[articles.length - 1]?.date || '2020-01-01');
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    
    console.log(`Последнее обновление: ${lastUpdate}`);
    console.log(`Прошло часов: ${hoursSinceUpdate}`);
    console.log(`Количество статей: ${articles.length}`);
    
    // Обновляем, если прошло более 2 часов или статей мало
    return hoursSinceUpdate > 2 || articles.length < 5;
}

// Проверяем нужно ли обновление
const needUpdate = checkUpdateNeeded();
console.log(`Нужно обновление: ${needUpdate}`);

if (needUpdate) {
    console.log('Запуск автоматического обновления...');
    // Импортируем и запускаем автообновление
    const { autoUpdate } = require('./auto-update.js');
    autoUpdate().then(success => {
        console.log(`Обновление завершено: ${success ? 'успешно' : 'с ошибками'}`);
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Ошибка при обновлении:', error);
        process.exit(1);
    });
} else {
    console.log('Обновление не требуется');
    process.exit(0);
}