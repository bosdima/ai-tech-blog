const DailyReporter = require('./daily-reporter');
const fs = require('fs');
const path = require('path');

// Система автоматической отправки отчетов в Telegram
class TelegramNotifier {
    constructor() {
        this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
        this.telegramChatId = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';
        this.reporter = new DailyReporter();
        this.logPath = path.join(__dirname, 'telegram-notifications.json');
    }

    // Основной метод отправки отчета
    async sendDailyReport() {
        console.log('📱 Отправка ежедневного отчета в Telegram...');
        
        try {
            // Генерируем отчет
            const report = await this.reporter.generateDailyReport();
            
            if (!report) {
                throw new Error('Не удалось сгенерировать отчет');
            }
            
            // Форматируем сообщение
            const message = this.formatTelegramMessage(report);
            
            // Отправляем в Telegram
            await this.sendToTelegram(message);
            
            // Сохраняем лог
            this.saveNotificationLog(report);
            
            console.log('✅ Отчет успешно отправлен в Telegram');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка отправки отчета:', error);
            return false;
        }
    }

    // Форматирование сообщения для Telegram
    formatTelegramMessage(report) {
        const trendEmoji = report.summary.trend.includes('📈') ? '📈' : 
                         report.summary.trend.includes('📉') ? '📉' : '➡️';
        
        const adsEmoji = report.summary.ads.includes('✅') ? '✅' : '❌';
        
        const message = `
🤖 *AI Tech Blog - Ежедневный отчет*

📅 *Дата:* ${report.dateFormatted}
⏰ *Время:* ${report.time}

👥 *ПОСЕТИТЕЛИ:*
• Сегодня: ${report.summary.visitors}
• Сессии: ${report.summary.sessions}
• Просмотров: ${report.summary.pages}
• Среднее время: ${report.summary.duration}
• Отказы: ${report.summary.bounceRate}
• Тренд: ${trendEmoji} ${report.summary.trend}

📊 *РЕКЛАМА:*
• Общий статус: ${adsEmoji} ${report.summary.ads}
• ads.txt: ${report.ads.adsTxt ? '✅ Работает' : '❌ Не работает'}
• AdSense: ${report.ads.adsense ? '✅ Код найден' : '❌ Код не найден'}
• Партнерки: ${report.ads.affiliates ? '✅ Подключены' : '❌ Не подключены'}

💰 *ДОХОД:*
• Сегодня: $${report.revenue.daily}
• Месяц: $${report.revenue.monthly}
• Год: $${report.revenue.yearly}
• CPM: $${report.revenue.cpm}
• CTR: ${report.revenue.ctr}%

🌐 *САЙТ:*
• URL: https://ai-tech-blog-steel.vercel.app
• Статей: ${this.reporter.getArticleCount()}
• Последнее обновление: ${this.reporter.getLastUpdate()}

🎯 *СТАТУС СИСТЕМЫ:*
• Контент: ✅ Автоматическое обновление
• Продвижение: ✅ Reddit + LinkedIn
• Монетизация: ✅ AdSense + партнерки
• Заработок: 24/7

📊 *ПОСЛЕДНИЕ 30 ДНЕЙ:*
• Посетители: ~${report.monthly.visitors}
• Сессии: ~${report.monthly.sessions}
• Доход: ~$${report.revenue.monthly}

🚀 *СЛЕДУЮЩИЙ ЗАПУСК:*
• Завтра в то же время
• Автоматически без вашего участия

---
🤖 Отчет сгенерирован автоматически
AI Tech Blog - Ваш автоматический заработок 24/7
        `;
        
        return message;
    }

    // Отправка сообщения в Telegram
    async sendToTelegram(message) {
        try {
            const fetch = require('node-fetch');
            
            const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.telegramChatId,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Сообщение успешно отправлено в Telegram');
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка отправки в Telegram:', error);
            throw error;
        }
    }

    // Сохранение лога уведомлений
    saveNotificationLog(report) {
        try {
            let logs = [];
            
            if (fs.existsSync(this.logPath)) {
                logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
            }
            
            logs.push({
                timestamp: new Date().toISOString(),
                date: report.dateFormatted,
                time: report.time,
                status: 'success',
                visitors: report.today.visitors,
                revenue: report.revenue.daily,
                adsStatus: report.summary.ads
            });
            
            // Сохраняем только последние 50 записей
            if (logs.length > 50) {
                logs = logs.slice(-50);
            }
            
            fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
            
        } catch (error) {
            console.log('Ошибка сохранения лога уведомлений:', error);
        }
    }

    // Проверка статуса бота
    async checkBotStatus() {
        try {
            const fetch = require('node-fetch');
            
            const url = `https://api.telegram.org/bot${this.telegramBotToken}/getMe`;
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.ok) {
                console.log(`✅ Бот работает: ${result.result.first_name}`);
                return true;
            } else {
                console.log('❌ Бот не работает');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Ошибка проверки бота:', error);
            return false;
        }
    }

    // Тестовая отправка
    async testNotification() {
        try {
            console.log('🧪 Тестовая отправка сообщения...');
            
            const testMessage = `
🤖 *AI Tech Blog - Тестовое уведомление*

✅ Система уведомлений работает правильно!

📱 Вы получите ежедневные отчеты:
• Посетители и сессии
• Статистика рекламы
• Прогноз дохода
• Статус системы

🔗 Ваш сайт: https://ai-tech-blog-steel.vercel.app
💰 Заработок 24/7

---
🤖 Тестовое сообщение
AI Tech Blog - Ваш автоматический заработок 24/7
            `;
            
            await this.sendToTelegram(testMessage);
            console.log('✅ Тестовое сообщение успешно отправлено');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка тестовой отправки:', error);
            return false;
        }
    }
}

// Использование
if (require.main === module) {
    const notifier = new TelegramNotifier();
    
    // Проверка аргументов командной строки
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        // Тестовая отправка
        notifier.testNotification().then(() => {
            console.log('\n🎉 Тест завершен!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Тест не прошел:', error);
            process.exit(1);
        });
    } else if (args.includes('--check')) {
        // Проверка статуса бота
        notifier.checkBotStatus().then(() => {
            console.log('\n🎉 Проверка завершена!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Проверка не прошла:', error);
            process.exit(1);
        });
    } else {
        // Обычная отправка отчета
        notifier.sendDailyReport().then(() => {
            console.log('\n🎉 Отчет отправлен!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Отправка не удалась:', error);
            process.exit(1);
        });
    }
}

module.exports = TelegramNotifier;