const { checkUpdateNeeded } = require('./auto-update.js');

console.log('🔍 Проверка необходимости обновления AI Tech Blog...');

if (checkUpdateNeeded()) {
    console.log('🚀 Обновление необходимо, контент будет обновлен автоматически');
    const { autoUpdate } = require('./auto-update.js');
    autoUpdate().then(success => {
        console.log('Обновление завершено:', success ? '✅ Успешно' : '❌ Ошибка');
    }).catch(error => {
        console.error('Ошибка при обновлении:', error);
    });
} else {
    console.log('✅ Обновление не требуется, контент актуален');
}