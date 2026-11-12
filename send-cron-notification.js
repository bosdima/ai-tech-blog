const { sendTelegramNotification } = require('./notification-manager.js');

const message = `🤖 AI Tech Blog - Обновление завершено

✅ **Успешные операции:**
• 12 новых статей сгенерировано
• Контент обновлен (09.11.2026)
• GitHub Pages развернут успешно
• Сайт доступен: https://bosdima.github.io/ai-tech-blog/

⚠️ **Проблемы:**
• Vercel развертывание не удалось (npx недоступен)

🎯 **Итог:** Обновление успешно завершено через GitHub Pages. Сайт актуален!`;

sendTelegramNotification(message).then(() => {
    console.log('✅ Уведомление в Telegram отправлено');
}).catch(error => {
    console.error('❌ Ошибка отправки уведомления:', error);
});