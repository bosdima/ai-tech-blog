const { checkWebsiteStatus } = require('./notification-manager.js');

console.log('🔍 Проверка статуса сайта AI Tech Blog...');

checkWebsiteStatus().then(status => {
    console.log('📊 Результат проверки статуса:');
    console.log(JSON.stringify(status, null, 2));
    
    if (status.status === 'online') {
        console.log('✅ Сайт доступен и работает нормально');
    } else {
        console.log('❌ Сайт имеет проблемы:', status.message || status.error);
    }
    
    process.exit(0);
}).catch(error => {
    console.error('❌ Ошибка при проверке статуса:', error);
    process.exit(1);
});