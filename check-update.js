const { checkUpdateNeeded } = require('./auto-update.js');

console.log('🔍 Проверка необходимости обновления AI Tech Blog...');

if (checkUpdateNeeded()) {
    console.log('🚀 Обновление необходимо, контент будет обновлен автоматически');
} else {
    console.log('✅ Обновление не требуется, контент актуален');
}