const { updateContentAndStatic } = require('./server.js');
const { formatUpdateMessage, logUpdate, checkWebsiteStatus, sendTelegramNotification } = require('./notification-manager.js');
const { deployToVercel } = require('./deploy-vercel.js');

// Функция для автоматического обновления с уведомлением
async function autoUpdate() {
    console.log('🚀 Запуск автоматического обновления AI Tech Blog...');
    
    try {
        // 1. Проверяем текущий статус сайта
        console.log('🔍 Проверка текущего статуса сайта...');
        const statusBefore = await checkWebsiteStatus();
        console.log('Статус до обновления:', statusBefore);
        
        // 3. Обновляем контент и генерируем статическую версию
        console.log('📝 Обновление контента...');
        await updateContentAndStatic();
        
        // 4. Развертываем на Vercel
        console.log('🌐 Развертывание на Vercel...');
        await deployToVercel();
       // 5. Проверяем статус после обновления
       console.log('🔍 Проверка статуса после обновления...');
       const statusAfter = await checkWebsiteStatus();
       console.log('Статус после обновления:', statusAfter);
        
       // 6. Формируем сообщение для уведомления
       const success = statusAfter.status === 'online';
       const message = formatUpdateMessage(success, success ? null : statusAfter.message);
        
       // 7. Отправляем уведомление в Telegram
       console.log('📱 Отправка уведомления...');
       await sendTelegramNotification(message);
        
       // 8. Логируем результат
       logUpdate(
           success ? 'success' : 'error',
           success ? 'AI Tech Blog обновлен успешно' : 'Ошибка обновления AI Tech Blog',
           success ? null : statusAfter.message
       );
        
       console.log(success ? '✅ Обновление завершено успешно!' : '❌ Обновление завершено с ошибками');
       return success;
        
       } catch (error) {
       console.error('❌ Критическая ошибка при обновлении:', error);
        
       const errorMessage = formatUpdateMessage(false, error.message);
       await sendTelegramNotification(errorMessage);
        
       logUpdate('critical_error', 'Критическая ошибка при обновлении', error.message);
        
       return false;
       }
       }

// Функция для проверки необходимости обновления
function checkUpdateNeeded() {
    const fs = require('fs');
    const path = require('path');
    const articlesPath = path.join(__dirname, 'articles.json');
    
    if (!fs.existsSync(articlesPath)) {
        return true; // Нужно создавать статьи
    }
    
    const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    const lastUpdate = new Date(articles[articles.length - 1]?.date || '2020-01-01');
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    
    // Обновляем, если прошло более 2 часов или статей мало
    return hoursSinceUpdate > 2 || articles.length < 5;
}

// Экспортируем функции
module.exports = {
    autoUpdate,
    checkUpdateNeeded
};