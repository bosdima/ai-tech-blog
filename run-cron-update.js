const { checkUpdateNeeded, autoUpdate } = require('./auto-update.js');

console.log('🔄 Проверка необходимости обновления AI Tech Blog...');

if (checkUpdateNeeded()) {
    console.log('📋 Обновление требуется, запуск процедуры...');
    autoUpdate().then(success => {
        console.log(success ? '✅ Обновление успешно завершено' : '❌ Обновление завершено с ошибками');
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    });
} else {
    console.log('✅ Обновление не требуется, сайт актуален');
    process.exit(0);
}