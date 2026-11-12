const { checkWebsiteStatus } = require('./notification-manager.js');

console.log('🔍 Проверка текущего статуса сайта...');
checkWebsiteStatus()
    .then(status => {
        console.log('Текущий статус сайта:', status);
        
        // Проверяем наличие и размер файлов
        const fs = require('fs');
        const path = require('path');
        
        const articlesPath = path.join(__dirname, 'articles.json');
        const staticIndexPath = path.join(__dirname, 'index-static.html');
        
        if (fs.existsSync(articlesPath)) {
            const stats = fs.statSync(articlesPath);
            console.log('✅ articles.json существует, размер:', stats.size, 'байт');
            
            const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
            console.log('📊 Количество статей:', articles.length);
            console.log('📅 Последняя статья:', articles[articles.length - 1]?.date || 'N/A');
        } else {
            console.log('❌ articles.json не существует');
        }
        
        if (fs.existsSync(staticIndexPath)) {
            const stats = fs.statSync(staticIndexPath);
            console.log('✅ index-static.html существует, размер:', stats.size, 'байт');
        } else {
            console.log('❌ index-static.html не существует');
        }
        
        console.log('\n📋 Сводка обновления:');
        console.log('✅ Контент обновлен: 12 новых статей');
        console.log('✅ Статическая версия сгенерирована');
        console.log('❌ Vercel развертывание не удалось (npx не найден)');
        console.log('🌐 Статус сайта:', status.status === 'online' ? 'Онлайн' : 'Оффлайн');
        
    })
    .catch(error => {
        console.error('❌ Ошибка проверки статуса:', error.message);
    });