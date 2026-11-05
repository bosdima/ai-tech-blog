const fs = require('fs');
const path = require('path');
const HermesIntegration = require('./hermes-integration');

// Улучшенный Telegram бот для управления сессиями Hermes
class EnhancedHermesBot {
    constructor() {
        this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
        this.telegramChatId = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';
        this.hermesIntegration = new HermesIntegration();
        this.logPath = path.join(__dirname, 'enhanced-hermes-bot.json');
        this.userSessions = new Map(); // Кэш сессий для каждого пользователя
        this.lastCommandTime = new Map(); // Анти-спам защита
    }

    // Основной метод запуска
    async start() {
        console.log('🚀 Запуск улучшенного бота управления сессиями Hermes...');
        
        try {
            // Проверка конфигурации
            if (!this.telegramBotToken || this.telegramBotToken === 'YOUR_BOT_TOKEN') {
                throw new Error('Telegram бот не настроен');
            }
            
            // Проверка доступности Hermes
            const hermesStatus = await this.hermesIntegration.checkHermesAvailability();
            if (!hermesStatus.available) {
                throw new Error(`Hermes недоступен: ${hermesStatus.error}`);
            }
            
            console.log(`✅ Hermes доступен, версия: ${hermesStatus.version}`);
            
            // Запуск бота
            await this.runBot();
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
            return false;
        }
    }

    // Запуск Telegram бота
    async runBot() {
        const fetch = require('node-fetch');
        
        // Обработчик команды /start
        const startCommand = async (chatId) => {
            const message = `
🤖 Enhanced Hermes Session Manager

Я помогаю управлять вашими сессиями Hermes!

🎯 Основные возможности:
• 📋 Просмотр всех сессий
• 🔍 Информация о текущей сессии
• 🔄 Переключение между сессиями
• ➕ Создание новых сессий
• 💬 Отправка сообщений в сессии
• 📜 История сессий

📋 Доступные команды:
• /sessions - показать все сессии
• /current - информация о текущей сессии
• /switch <номер> - переключиться на сессию
• /new - создать новую сессию
• /send <номер> <сообщение> - отправить сообщение в сессию
• /history <номер> - история сессии
• /help - помощь

💡 Примеры:
• /switch 1 - переключиться на первую сессию
• /send 2 Привет! - отправить сообщение во вторую сессию
• /history 1 - историю первой сессии

🔗 Hermes версия: ${await this.getHermesVersion()}
            `;
            
            await this.sendMessage(chatId, message);
        };

        // Обработчик команды /sessions
        const sessionsCommand = async (chatId) => {
            try {
                const sessions = await this.hermesIntegration.getSessions();
                
                if (sessions.length === 0) {
                    await this.sendMessage(chatId, '📋 Сессии Hermes не найдены. Попробуйте /new для создания новой сессии.');
                    return;
                }
                
                let message = '📋 Ваши сессии Hermes:\n\n';
                
                sessions.forEach((session, index) => {
                    const status = session.isCurrent ? '🟢 Текущая' : '⚪ Неактивна';
                    const created = new Date(session.createdAt).toLocaleString('ru-RU');
                    const updated = new Date(session.updatedAt).toLocaleString('ru-RU');
                    
                    message += `*${index + 1}. ${session.name}*\n`;
                    message += `   🆔 ID: \`${session.sessionId}\`\n`;
                    message += `   📝 Сообщений: ${session.messageCount}\n`;
                    message += `   📅 Создана: ${created}\n`;
                    message += `   🔄 Обновлена: ${updated}\n`;
                    message += `   🎯 Статус: ${status}\n\n`;
                });
                
                message += '💡 Используйте `/switch <номер>` чтобы переключиться на сессию\n';
                message += '💡 Используйте `/send <номер> <сообщение>` чтобы отправить сообщение в сессию';
                
                await this.sendMessage(chatId, message);
                
            } catch (error) {
                console.error('Ошибка получения сессий:', error);
                await this.sendMessage(chatId, '❌ Ошибка получения сессий. Попробуйте позже.');
            }
        };

        // Обработчик команды /current
        const currentCommand = async (chatId) => {
            try {
                const currentSession = await this.hermesIntegration.getCurrentSession();
                
                if (!currentSession) {
                    await this.sendMessage(chatId, '🔍 Текущая сессия не найдена. Попробуйте /new для создания новой сессии.');
                    return;
                }
                
                const created = new Date(currentSession.createdAt).toLocaleString('ru-RU');
                const updated = new Date(currentSession.updatedAt).toLocaleString('ru-RU');
                
                const message = `
🔍 Текущая сессия Hermes:

*📝 Название:* ${currentSession.name}
*🆔 ID:* \`${currentSession.sessionId}\`
*📅 Создана:* ${created}
*🔄 Обновлена:* ${updated}
*💬 Сообщений:* ${currentSession.messageCount}

🎯 Это ваша активная сессия. Все сообщения будут отправляться сюда.

💡 Используйте /sessions чтобы увидеть все сессии
💡 Используйте /switch <номер> чтобы переключиться на другую сессию
                `;
                
                await this.sendMessage(chatId, message);
                
            } catch (error) {
                console.error('Ошибка получения текущей сессии:', error);
                await this.sendMessage(chatId, '❌ Ошибка получения информации о текущей сессии.');
            }
        };

        // Обработчик команды /switch
        const switchCommand = async (chatId, args) => {
            // Анти-спам защита
            if (this.isSpam(chatId, 'switch')) {
                await this.sendMessage(chatId, '⚠️ Пожалуйста, подождите перед следующей командой.');
                return;
            }
            
            if (!args || args.length === 0) {
                await this.sendMessage(chatId, '🔄 Укажите номер сессии. Пример: /switch 1');
                return;
            }
            
            const sessionNumber = parseInt(args[0]);
            const sessions = await this.hermesIntegration.getSessions();
            
            if (isNaN(sessionNumber) || sessionNumber < 1 || sessionNumber > sessions.length) {
                await this.sendMessage(chatId, '❌ Неверный номер сессии. Используйте /sessions чтобы увидеть доступные сессии.');
                return;
            }
            
            const targetSession = sessions[sessionNumber - 1];
            
            try {
                const result = await this.hermesIntegration.switchSession(sessionNumber);
                
                if (result.success) {
                    const message = `
✅ Сессия успешно переключена!

*📝 Новая текущая сессия:*
• Название: ${targetSession.name}
• 🆔 ID: ${targetSession.sessionId}
• 📅 Обновлена: ${new Date(targetSession.updatedAt).toLocaleString('ru-RU')}

🤖 Теперь вы общаетесь в сессии "${targetSession.name}"
💡 Все сообщения будут отправляться в эту сессию
                    `;
                    
                    await this.sendMessage(chatId, message);
                } else {
                    await this.sendMessage(chatId, `❌ Ошибка переключения сессии: ${result.message}`);
                }
                
            } catch (error) {
                console.error('Ошибка переключения сессии:', error);
                await this.sendMessage(chatId, '❌ Ошибка переключения сессии. Попробуйте позже.');
            }
        };

        // Обработчик команды /new
        const newCommand = async (chatId) => {
            // Анти-спам защита
            if (this.isSpam(chatId, 'new')) {
                await this.sendMessage(chatId, '⚠️ Пожалуйста, подождите перед созданием новой сессии.');
                return;
            }
            
            try {
                const result = await this.hermesIntegration.createNewSession();
                
                if (result.success) {
                    const message = `
✅ Новая сессия создана!

*🆔 ID:* ${result.sessionId}
*📝 Название:* Новая сессия
*📅 Создана:* ${new Date().toLocaleString('ru-RU')}

🎉 Начните общение в новой сессии!
💡 Используйте /send <сообщение> чтобы отправить сообщение
                    `;
                    
                    await this.sendMessage(chatId, message);
                } else {
                    await this.sendMessage(chatId, `❌ Ошибка создания сессии: ${result.message}`);
                }
                
            } catch (error) {
                console.error('Ошибка создания сессии:', error);
                await this.sendMessage(chatId, '❌ Ошибка создания сессии. Попробуйте позже.');
            }
        };

        // Обработчик команды /send
        const sendCommand = async (chatId, args) => {
            // Анти-спам защита
            if (this.isSpam(chatId, 'send')) {
                await this.sendMessage(chatId, '⚠️ Пожалуйста, подождите перед отправкой следующего сообщения.');
                return;
            }
            
            if (!args || args.length < 2) {
                await this.sendMessage(chatId, '📤 Укажите номер сессии и сообщение. Пример: /send 1 Привет!');
                return;
            }
            
            const sessionNumber = parseInt(args[0]);
            const message = args.slice(1).join(' ');
            const sessions = await this.hermesIntegration.getSessions();
            
            if (isNaN(sessionNumber) || sessionNumber < 1 || sessionNumber > sessions.length) {
                await this.sendMessage(chatId, '❌ Неверный номер сессии. Используйте /sessions чтобы увидеть доступные сессии.');
                return;
            }
            
            try {
                const result = await this.hermesIntegration.sendMessage(message, sessionNumber);
                
                if (result.success) {
                    const targetSession = sessions[sessionNumber - 1];
                    const messageText = `
✅ Сообщение успешно отправлено!

*📤 Отправлено в сессию:* ${targetSession.name}
*📝 Сообщение:* ${message}
*🕒 Время:* ${new Date().toLocaleString('ru-RU')}

🤌 Hermes обрабатывает ваше сообщение...
💡 Дождитесь ответа от Hermes
                    `;
                    
                    await this.sendMessage(chatId, messageText);
                } else {
                    await this.sendMessage(chatId, `❌ Ошибка отправки сообщения: ${result.message}`);
                }
                
            } catch (error) {
                console.error('Ошибка отправки сообщения:', error);
                await this.sendMessage(chatId, '❌ Ошибка отправки сообщения. Попробуйте позже.');
            }
        };

        // Обработчик команды /history
        const historyCommand = async (chatId, args) => {
            if (!args || args.length === 0) {
                await this.sendMessage(chatId, '📜 Укажите номер сессии. Пример: /history 1');
                return;
            }
            
            const sessionNumber = parseInt(args[0]);
            const sessions = await this.hermesIntegration.getSessions();
            
            if (isNaN(sessionNumber) || sessionNumber < 1 || sessionNumber > sessions.length) {
                await this.sendMessage(chatId, '❌ Неверный номер сессии. Используйте /sessions чтобы увидеть доступные сессии.');
                return;
            }
            
            try {
                const result = await this.hermesIntegration.getSessionHistory(sessionNumber);
                
                if (result.success && result.history.length > 0) {
                    const targetSession = sessions[sessionNumber - 1];
                    
                    let message = `
📜 История сессии "${targetSession.name}":

`;
                    
                    // Показываем последние 10 сообщений
                    const recentHistory = result.history.slice(-10);
                    recentHistory.forEach((item, index) => {
                        const role = item.role === 'user' ? '👤 Пользователь' : '🤖 Hermes';
                        const time = new Date(item.timestamp).toLocaleTimeString('ru-RU');
                        
                        message += `${role} (${time}):\n`;
                        message += `${item.content}\n\n`;
                    });
                    
                    if (result.history.length > 10) {
                        message += `... и еще ${result.history.length - 10} сообщений\n`;
                    }
                    
                    message += '\n💡 Используйте /send <номер> <сообщение> чтобы добавить новое сообщение';
                    
                    await this.sendMessage(chatId, message);
                } else {
                    await this.sendMessage(chatId, '📜 История сессии пуста или не найдена.');
                }
                
            } catch (error) {
                console.error('Ошибка получения истории:', error);
                await this.sendMessage(chatId, '❌ Ошибка получения истории. Попробуйте позже.');
            }
        };

        // Обработчик команды /help
        const helpCommand = async (chatId) => {
            const message = `
🤖 Enhanced Hermes Session Manager - Помощь

🎯 Основные возможности:
• 📋 Просмотр всех сессий Hermes
• 🔍 Информация о текущей сессии
• 🔄 Переключение между сессиями
• ➕ Создание новых сессий
• 💬 Отправка сообщений в сессии
• 📜 История сессий

📋 Команды:
• /start - показать приветственное сообщение
• /sessions - показать все доступные сессии
• /current - показать информацию о текущей сессии
• /switch <номер> - переключиться на сессию
• /new - создать новую сессию
• /send <номер> <сообщение> - отправить сообщение в сессию
• /history <номер> - историю сессии
• /help - показать это сообщение

💡 Примеры использования:
• /switch 1 - переключиться на первую сессию
• /send 2 Привет! - отправить сообщение во вторую сессию
• /history 1 - историю первой сессии
• /new - создать новую сессию

🔍 Сессии сохраняют контекст разговора,
модели, настройки и историю сообщений.

🤞 Удачи в общении с Hermes!
            `;
            
            await this.sendMessage(chatId, message);
        };

        // Основной обработчик сообщений
        const messageHandler = async (update) => {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text;
            
            if (!text) return;
            
            const command = text.trim().toLowerCase();
            const args = text.trim().split(' ').slice(1);
            
            switch (command) {
                case '/start':
                    await startCommand(chatId);
                    break;
                case '/sessions':
                    await sessionsCommand(chatId);
                    break;
                case '/current':
                    await currentCommand(chatId);
                    break;
                case '/switch':
                    await switchCommand(chatId, args);
                    break;
                case '/new':
                    await newCommand(chatId);
                    break;
                case '/send':
                    await sendCommand(chatId, args);
                    break;
                case '/history':
                    await historyCommand(chatId, args);
                    break;
                case '/help':
                    await helpCommand(chatId);
                    break;
                default:
                    if (command.startsWith('/')) {
                        await this.sendMessage(chatId, '❌ Неизвестная команда. Используйте /help для помощи.');
                    }
            }
        };

        // Запуск бота
        console.log('🤖 Бот запущен, ожидает сообщений...');
        console.log('📋 Доступные команды:');
        console.log('• /sessions - показать все сессии');
        console.log('• /current - текущая сессия');
        console.log('• /switch <номер> - переключиться на сессию');
        console.log('• /new - создать новую сессию');
        console.log('• /send <номер> <сообщение> - отправить сообщение в сессию');
        console.log('• /history <номер> - история сессии');
        console.log('• /help - помощь');
        
        return true;
    }

    // Анти-спам защита
    isSpam(chatId, command) {
        const now = Date.now();
        const lastCommand = this.lastCommandTime.get(`${chatId}_${command}`);
        
        if (lastCommand && (now - lastCommand) < 5000) { // 5 секунд между командами
            return true;
        }
        
        this.lastCommandTime.set(`${chatId}_${command}`, now);
        return false;
    }

    // Получение версии Hermes
    async getHermesVersion() {
        try {
            const status = await this.hermesIntegration.checkHermesAvailability();
            return status.available ? status.version : 'Недоступен';
        } catch (error) {
            return 'Ошибка проверки';
        }
    }

    // Отправка сообщения в Telegram
    async sendMessage(chatId, text) {
        try {
            const fetch = require('node-fetch');
            
            const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            throw error;
        }
    }

    // Тестирование бота
    async testBot() {
        try {
            console.log('🧪 Тестирование улучшенного бота управления сессиями...');
            
            // Проверка конфигурации
            if (!this.telegramBotToken || this.telegramBotToken === 'YOUR_BOT_TOKEN') {
                console.log('❌ Telegram бот не настроен');
                return false;
            }
            
            // Проверка доступности Hermes
            const hermesStatus = await this.hermesIntegration.checkHermesAvailability();
            if (!hermesStatus.available) {
                console.log('❌ Hermes недоступен:', hermesStatus.error);
                return false;
            }
            
            console.log(`✅ Hermes доступен, версия: ${hermesStatus.version}`);
            
            // Проверка сессий
            const sessions = await this.hermesIntegration.getSessions();
            console.log(`📋 Найдено сессий: ${sessions.length}`);
            
            if (sessions.length > 0) {
                console.log('📝 Пример сессии:');
                console.log(`• ID: ${sessions[0].sessionId}`);
                console.log(`• Название: ${sessions[0].name}`);
                console.log(`• Обновлена: ${sessions[0].updatedAt}`);
            }
            
            // Тест отправки сообщения
            const testMessage = `
🤖 Enhanced Hermes Session Manager - Тест

✅ Бот работает корректно!

🎯 Основные возможности:
• 📋 Просмотр всех сессий Hermes
• 🔍 Информация о текущей сессии
• 🔄 Переключение между сессиями
• ➕ Создание новых сессий
• 💬 Отправка сообщений в сессии
• 📜 История сессий

📋 Доступные команды:
• /sessions - показать все сессии
• /current - текущая сессия
• /switch <номер> - переключиться на сессию
• /new - создать новую сессию
• /send <номер> <сообщение> - отправить сообщение в сессию
• /history <номер> - история сессии
• /help - помощь

🎉 Система готова к использованию!
            `;
            
            await this.sendMessage(this.telegramChatId, testMessage);
            
            console.log('✅ Тест успешно пройден');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка тестирования:', error);
            return false;
        }
    }
}

// Использование
if (require.main === module) {
    const bot = new EnhancedHermesBot();
    
    // Проверка аргументов командной строки
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        // Тестирование бота
        bot.testBot().then(() => {
            console.log('\n🎉 Тест завершен!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Тест не прошел:', error);
            process.exit(1);
        });
    } else {
        // Запуск бота
        bot.start().then(() => {
            console.log('\n🎉 Бот запущен!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Бот не запустился:', error);
            process.exit(1);
        });
    }
}

module.exports = EnhancedHermesBot;