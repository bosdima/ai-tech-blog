const { autoUpdate, checkUpdateNeeded } = require('./auto-update.js');

console.log('🔍 Проверка необходимости обновления AI Tech Blog...');

if (checkUpdateNeeded()) {
    console.log('✅ Обновление необходимо, запускаю процедуру...');
    autoUpdate().then(success => {
        console.log(success ? '✅ Обновление завершено успешно!' : '❌ Обновление завершено с ошибками');
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Критическая ошибка:', error);
        process.exit(1);
    });
} else {
    console.log('📅 Обновление не требуется, сайт актуален');
    process.exit(0);
}