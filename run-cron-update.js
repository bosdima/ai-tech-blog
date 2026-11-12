const fs = require('fs');
const path = require('path');

// Функция для проверки необходимости обновления
function checkUpdateNeeded() {
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

// Функция для автоматического обновления
async function autoUpdate() {
    const { updateContentAndStatic } = require('./server.js');
    const { formatUpdateMessage, logUpdate, checkWebsiteStatus, sendTelegramNotification } = require('./notification-manager.js');
    
    console.log('🚀 Запуск автоматического обновления AI Tech Blog...');
    
    try {
        // 1. Проверяем текущий статус сайта
        console.log('🔍 Проверка текущего статуса сайта...');
        const statusBefore = await checkWebsiteStatus();
        console.log('Статус до обновления:', statusBefore);
        
        // 2. Обновляем контент и генерируем статическую версию
        console.log('📝 Обновление контента...');
        await updateContentAndStatic();
        
        // 3. Развертывание на Vercel (пропущено для cron)
        console.log('🌐 Развертывание на Vercel...');
        console.log('⚠️  Развертывание пропущено в режиме cron');
        // В реальном развертывании будет использоваться: vercel --prod
        
        // 4. Проверяем статус после обновления
        console.log('🔍 Проверка статуса после обновления...');
        const statusAfter = await checkWebsiteStatus();
        console.log('Статус после обновления:', statusAfter);
        
        // 5. Формируем сообщение для уведомления
        const success = statusAfter.status === 'online';
        const message = formatUpdateMessage(success, success ? null : statusAfter.message);
        
        // 6. Отправляем уведомление в Telegram
        console.log('📱 Отправка уведомления...');
        await sendTelegramNotification(message);
        
        // 7. Логируем результат
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

// Основная логика
async function main() {
    console.log('🔍 Проверка необходимости обновления AI Tech Blog...');
    
    const updateNeeded = checkUpdateNeeded();
    console.log('Нужно обновление:', updateNeeded);
    
    if (updateNeeded) {
        console.log('📋 Обновление необходимо, запускаю процедуру...');
        const result = await autoUpdate();
        console.log('Результат обновления:', result ? '✅ Успешно' : '❌ Ошибка');
        process.exit(result ? 0 : 1);
    } else {
        console.log('✅ Обновление не требуется, сайт актуален');
        process.exit(0);
    }
}

// Запускаем основную функцию
main().catch(error => {
    console.error('❌ Ошибка в main:', error);
    process.exit(1);
});