const { checkUpdateNeeded } = require('./auto-update.js');

console.log('Проверка необходимости обновления AI Tech Blog...');

if (checkUpdateNeeded()) {
    console.log('🔄 Обновление необходимо, запускаю процедуру...');
    const { autoUpdate } = require('./auto-update.js');
    autoUpdate().then(success => {
        console.log(success ? '✅ Обновление успешно завершено' : '❌ Обновление завершено с ошибками');
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    });
} else {
    console.log('✅ Обновление не требуется, контент актуален');
    process.exit(0);
}