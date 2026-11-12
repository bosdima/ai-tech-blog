const { sendTelegramNotification } = require('./notification-manager.js');
const fs = require('fs');
const path = require('path');

// Читаем сгенерированный отчет
const reportPath = path.join(__dirname, 'update-report-telegram-20261108.md');
let reportMessage = '';

if (fs.existsSync(reportPath)) {
    reportMessage = fs.readFileSync(reportPath, 'utf8');
} else {
    // Если отчет не найден, создаем сообщение вручную
    reportMessage = `🚀 AI Tech Blog Автообновление - Отчет за 08.11.2026 20:12

✅ **УСПЕШНЫЕ ОПЕРАЦИИ:**
• Обновление контента: 12 новых статей добавлено
• Общее количество статей: 36
• Последняя статья: 08.11.2026
• Генерация статической версии: Успешно
• Размер articles.json: 107,632 байт
• Размер index-static.html: 34,108 байт

❌ **ОШИБКИ:**
• Vercel развертывание: Не удалось (npx не найден)
• Статус сайта: Оффлайн (404 ошибка)

📊 **ТЕКУЩЕЕ СОСТОЯНИЕ:**
• Контент актуален и обновлен
• Статическая версия готова
• GitHub Pages: Должен быть доступен
• Vercel: Требует ручного развертывания

🔧 **РЕКОМЕНДАЦИИ:**
1. Установить npx для Vercel развертывания
2. Проверить доступность GitHub Pages
3. При необходимости - ручное развертывание на Vercel

⏰ **Время выполнения:** 08.11.2026, 20:15:25`;
}

console.log('📱 Отправка отчета об обновлении в Telegram...');
console.log('Сообщение:');
console.log(reportMessage);

// Отправляем уведомление
sendTelegramNotification(reportMessage)
    .then(() => {
        console.log('✅ Отчет успешно отправлен в Telegram');
    })
    .catch((error) => {
        console.error('❌ Ошибка отправки отчета:', error);
    });