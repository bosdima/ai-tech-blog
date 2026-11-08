const { checkUpdateNeeded, autoUpdate } = require('./auto-update.js');

async function runUpdate() {
    console.log('🔍 Проверка необходимости обновления AI Tech Blog...');
    
    if (checkUpdateNeeded()) {
        console.log('📋 Обновление необходимо, запускаю процедуру...');
        const result = await autoUpdate();
        return result;
    } else {
        console.log('✅ Обновление не требуется, сайт актуален');
        return false;
    }
}

runUpdate().then(result => {
    console.log(result ? '✅ Обновление выполнено успешно' : 'ℹ️ Обновление не требовалось');
    process.exit(0);
}).catch(error => {
    console.error('❌ Ошибка при выполнении обновления:', error);
    process.exit(1);
});