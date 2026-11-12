// Заглушка для deploy-vercel.js
// Для cron задач развертывание не требуется, только обновление контента

async function deployToVercel() {
    console.log('🌐 Vercel deploy skipped for cron task');
    // Имитация успешного развертывания
    return Promise.resolve(true);
}

module.exports = { deployToVercel };