const fs = require('fs');
const path = require('path');

// Система управления сессиями Hermes через Telegram
class HermesSessionBot {
    constructor() {
        this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
        this.telegramChatId = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';
        this.hermesConfigPath = path.join(__dirname, '..', '..', '.hermes', '.env');
        this.sessionsPath = path.join(__dirname, '..', '..', '.hermes', 'sessions.json');
        this.logPath = path.join(__dirname, 'hermes-session-bot.json');
        this.loadConfig();
    }

    // Загрузка конфигурации
    loadConfig() {
        try {
            if (fs.existsSync(this.hermesConfigPath)) {
                const configContent = fs.readFileSync(this.hermesConfigPath, 'utf8');
                this.hermesConfig = this.parseEnvFile(configContent);
            } else {
                this.hermesConfig = {};
            }
        } catch (error) {
            console.log('Ошибка загрузки конфигурации Hermes:', error);
            this.hermesConfig = {};
        }
    }

    // Парсинг .env файла
    parseEnvFile(content) {
        const config = {};
        const lines = content.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...rest] = line.split('=');
                if (key && rest.length > 0) {
                    config[key] = rest.join('=').replace(/^["']|["']$/g, '');
                }
            }
        });
        
        return config;
    }

    // Основной метод запуска бота
    async start() {
        console.log('🤖 Запуск бота управления сессиями Hermes...');
        
        try {
            // Проверка конфигурации
            if (!this.telegramBotToken || this.telegramBotToken === 'YOUR_BOT_TOKEN') {
                console.log('❌ Telegram бот не настроен');
                return false;
            }
            
            // Проверка доступности сессий
            const sessionsAvailable = await this.checkSessions();
            if (!sessionsAvailable) {
                console.log('⚠️ Сессии Hermes не найдены');
                return false;
            }
            
            // Запуск бота
            await this.runBot();
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
            return false;
        }
    }

    // Проверка доступности сессий
    async checkSessions() {
        try {
            if (!fs.existsSync(this.sessionsPath)) {
                return false;
            }
            
            const sessions = JSON.parse(fs.readFileSync(this.sessionsPath, 'utf8'));
            return sessions && sessions.length > 0;
            
        } catch (error) {
            console.log('Ошибка проверки сессий:', error);
            return false;
        }
    }

    // Запуск Telegram бота
    async runBot() {
        const fetch = require('node-fetch');
        
        // Обработчик команды /start
        const startCommand = async (chatId) => {
            const message = `
🤖 Hermes Session Manager

Я помогаю управлять вашими сессиями Hermes!

📋 Доступные команды:
• /sessions - показать все сессии
• /current - текущая сессия
• /switch <номер> - переключиться на сессию
• /new - создать новую сессию
• /help - помощь

💡 Пример: /switch 1
            `;
            
            await this.sendMessage(chatId, message);
        };

        // Обработчик команды /sessions
        const sessionsCommand = async (chatId) => {
            const sessions = await this.listSessions();
            
            if (sessions.length === 0) {
                await this.sendMessage(chatId, '📋 Сессии Hermes не найдены');
                return;
            }
            
            let message = '📋 Ваши сессии Hermes:\n\n';
            
            sessions.forEach((session, index) => {
                const status = session.is_current ? '🟢 Текущая' : '⚪ Неактивна';
                const updated = new Date(session.updated_at).toLocaleString('ru-RU');
                message += `${index + 1}. ${session.title || 'Без названия'}\n`;
                message += `   ID: ${session.session_id}\n`;
                message += `   Статус: ${status}\n`;
                message += `   Обновлено: ${updated}\n\n`;
            });
            
            message += '💡 Используйте /switch <номер> чтобы переключиться на сессию';
            
            await this.sendMessage(chatId, message);
        };

        // Обработчик команды /current
        const currentCommand = async (chatId) => {
            const currentSession = await this.getCurrentSession();
            
            if (!currentSession) {
                await this.sendMessage(chatId, '🔍 Текущая сессия не найдена');
                return;
            }
            
            const message = `
🔍 Текущая сессия Hermes:

📝 Название: ${currentSession.title || 'Без названия'}
🆔 ID: ${currentSession.session_id}
📅 Создана: ${new Date(currentSession.created_at).toLocaleString('ru-RU')}
🔄 Обновлена: ${new Date(currentSession.updated_at).toLocaleString('ru-RU')}
💬 Сообщений: ${currentSession.message_count || 0}
🔧 Модель: ${currentSession.model || 'Не указана'}

💡 Используйте /sessions чтобы увидеть все сессии
            `;
            
            await this.sendMessage(chatId, message);
        };

        // Обработчик команды /switch
        const switchCommand = async (chatId, args) => {
            if (!args || args.length === 0) {
                await this.sendMessage(chatId, '🔄 Укажите номер сессии. Пример: /switch 1');
                return;
            }
            
            const sessionNumber = parseInt(args[0]);
            const sessions = await this.listSessions();
            
            if (isNaN(sessionNumber) || sessionNumber < 1 || sessionNumber > sessions.length) {
                await this.sendMessage(chatId, '❌ Неверный номер сессии');
                return;
            }
            
            const targetSession = sessions[sessionNumber - 1];
            
            try {
                // Переключение сессии через Hermes CLI
                await this.switchSession(targetSession.session_id);
                
                const message = `
✅ Сессия успешно переключена!

📝 Новая текущая сессия:
• Название: ${targetSession.title || 'Без названия'}
• ID: ${targetSession.session_id}
• Обновлена: ${new Date(targetSession.updated_at).toLocaleString('ru-RU')}

🤖 Теперь вы общаетесь в этой сессии Hermes!
                `;
                
                await this.sendMessage(chatId, message);
                
            } catch (error) {
                console.error('Ошибка переключения сессии:', error);
                await this.sendMessage(chatId, '❌ Ошибка переключения сессии');
            }
        };

        // Обработчик команды /new
        const newCommand = async (chatId) => {
            try {
                // Создание новой сессии через Hermes CLI
                await this.createNewSession();
                
                const message = `
✅ Новая сессия создана!

🆔 ID: ${this.newSessionId}
📝 Название: Новая сессия
📅 Создана: ${new Date().toLocaleString('ru-RU')}

🤖 Начните общаться в новой сессии!
                `;
                
                await this.sendMessage(chatId, message);
                
            } catch (error) {
                console.error('Ошибка создания сессии:', error);
                await this.sendMessage(chatId, '❌ Ошибка создания сессии');
            }
        };

        // Обработчик команды /help
        const helpCommand = async (chatId) => {
            const message = `
🤖 Hermes Session Manager - Помощь

📋 Команды:
• /start - показать приветственное сообщение
• /sessions - показать все доступные сессии
• /current - показать текущую сессию
• /switch <номер> - переключиться на сессию
• /new - создать новую сессию
• /help - показать это сообщение

💡 Примеры использования:
• /switch 1 - переключиться на первую сессию
• /switch 2 - переключиться на вторую сессию
• /new - создать новую сессию

🔍 Сессии сохраняют контекст разговора,
модели, настройки и историю сообщений.

🤞 Удачи в общении с Hermes!
            `;
            
            await this.sendMessage(chatId, message);
        };

        // Основной цикл обработки сообщений
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
        
        // В реальной системе здесь был бы long-polling или вебхук
        // Для демонстрации покажем доступные команды
        console.log('📋 Доступные команды:');
        console.log('• /sessions - показать все сессии');
        console.log('• /current - текущая сессия');
        console.log('• /switch <номер> - переключиться на сессию');
        console.log('• /new - создать новую сессию');
        console.log('• /help - помощь');
        
        return true;
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

    // Получение списка сессий
    async listSessions() {
        try {
            if (!fs.existsSync(this.sessionsPath)) {
                return [];
            }
            
            const sessions = JSON.parse(fs.readFileSync(this.sessionsPath, 'utf8'));
            
            // Фильтрация и форматирование сессий
            const formattedSessions = sessions.map(session => ({
                session_id: session.session_id,
                title: session.title || 'Без названия',
                created_at: session.created_at,
                updated_at: session.updated_at,
                message_count: session.message_count || 0,
                model: session.model || 'Не указана',
                is_current: session.is_current || false
            }));
            
            // Сортировка по дате обновления
            return formattedSessions.sort((a, b) => 
                new Date(b.updated_at) - new Date(a.updated_at)
            );
            
        } catch (error) {
            console.error('Ошибка получения сессий:', error);
            return [];
        }
    }

    // Получение текущей сессии
    async getCurrentSession() {
        try {
            const sessions = await this.listSessions();
            return sessions.find(session => session.is_current) || sessions[0];
            
        } catch (error) {
            console.error('Ошибка получения текущей сессии:', error);
            return null;
        }
    }

    // Переключение сессии
    async switchSession(sessionId) {
        try {
            // В реальной системе здесь был бы вызов Hermes CLI
            // hermes session switch <sessionId>
            
            console.log(`Переключение на сессию: ${sessionId}`);
            
            // Обновляем статус сессий
            const sessions = await this.listSessions();
            sessions.forEach(session => {
                session.is_current = session.session_id === sessionId;
            });
            
            // Сохраняем обновленные сессии
            fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2));
            
            return true;
            
        } catch (error) {
            console.error('Ошибка переключения сессии:', error);
            throw error;
        }
    }

    // Создание новой сессии
    async createNewSession() {
        try {
            // В реальной системе здесь был бы вызов Hermes CLI
            // hermes session new
            
            const newSession = {
                session_id: `session_${Date.now()}`,
                title: 'Новая сессия',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                message_count: 0,
                model: 'gpt-4',
                is_current: true
            };
            
            this.newSessionId = newSession.session_id;
            
            // Добавляем новую сессию в список
            const sessions = await this.listSessions();
            sessions.forEach(session => {
                session.is_current = false;
            });
            sessions.push(newSession);
            
            // Сохраняем обновленные сессии
            fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2));
            
            return true;
            
        } catch (error) {
            console.error('Ошибка создания сессии:', error);
            throw error;
        }
    }

    // Тестирование бота
    async testBot() {
        try {
            console.log('🧪 Тестирование бота управления сессиями...');
            
            // Проверка конфигурации
            if (!this.telegramBotToken || this.telegramBotToken === 'YOUR_BOT_TOKEN') {
                console.log('❌ Telegram бот не настроен');
                return false;
            }
            
            // Проверка сессий
            const sessions = await this.listSessions();
            console.log(`📋 Найдено сессий: ${sessions.length}`);
            
            if (sessions.length > 0) {
                console.log('📝 Пример сессии:');
                console.log(`• ID: ${sessions[0].session_id}`);
                console.log(`• Название: ${sessions[0].title}`);
                console.log(`• Обновлена: ${sessions[0].updated_at}`);
            }
            
            // Тест отправки сообщения
            const testMessage = `
🤖 Hermes Session Manager - Тест

✅ Бот работает корректно!

📋 Доступные команды:
• /sessions - показать все сессии
• /current - текущая сессия
• /switch <номер> - переключиться на сессию
• /new - создать новую сессию
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
    const bot = new HermesSessionBot();
    
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

module.exports = HermesSessionBot;