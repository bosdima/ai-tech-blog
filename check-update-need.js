const fs = require('fs');
const path = require('path');
const articlesPath = path.join(__dirname, 'articles.json');

if (!fs.existsSync(articlesPath)) {
    console.log('❌ articles.json не существует - нужно обновление');
    process.exit(1);
}

const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const lastUpdate = new Date(articles[articles.length - 1]?.date || '2020-01-01');
const now = new Date();
const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
const needsUpdate = hoursSinceUpdate > 2 || articles.length < 5;

console.log(`📊 Проверка необходимости обновления:`);
console.log(`- Количество статей: ${articles.length}`);
console.log(`- Часов с последнего обновления: ${hoursSinceUpdate.toFixed(2)}`);
console.log(`- Нужно обновление: ${needsUpdate ? 'Да' : 'Нет'}`);

if (needsUpdate) {
    console.log('🚀 Запуск обновления...');
    process.exit(1);
} else {
    console.log('✅ Обновление не требуется');
    process.exit(0);
}