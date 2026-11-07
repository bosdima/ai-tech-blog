const { checkUpdateNeeded, autoUpdate } = require('./auto-update.js');

console.log('🔍 Проверка необходимости обновления AI Tech Blog...');

if (checkUpdateNeeded()) {
    console.log('✅ Обновление требуется, запускаю процедуру...');
    autoUpdate().then(success => {
        console.log(success ? '✅ Обновление успешно завершено' : '❌ Обновление завершилось с ошибками');
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    });
} else {
    console.log('ℹ️  Обновление не требуется, контент свежий');
    process.exit(0);
}