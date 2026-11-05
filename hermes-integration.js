const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Интеграция с реальным Hermes Agent
class HermesIntegration {
    constructor() {
        this.hermesPath = path.join(__dirname, '..', '..', 'hermes');
        this.sessionsPath = path.join(__dirname, '..', '..', '.hermes', 'sessions.json');
        this.tempDir = path.join(__dirname, 'temp');
        
        // Создаем временную директорию
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // Получение списка сессий через Hermes CLI
    async getSessions() {
        try {
            const command = 'hermes';
            const args = ['sessions', 'all'];
            
            const result = await this.executeCommand(command, args);
            
            if (!result.success) {
                throw new Error(`Ошибка выполнения команды: ${result.error}`);
            }
            
            // Парсинг вывода Hermes CLI
            const sessions = this.parseSessionsOutput(result.output);
            return sessions;
            
        } catch (error) {
            console.error('Ошибка получения сессий:', error);
            return [];
        }
    }

    // Парсинг вывода команды sessions
    parseSessionsOutput(output) {
        const sessions = [];
        const lines = output.split('\n');
        
        let currentSession = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Пропускаем пустые строки и заголовки
            if (!trimmedLine || trimmedLine.includes('SESSIONS') || trimmedLine.includes('ID')) {
                continue;
            }
            
            // Поиск сессии в формате: "1. session_name (current)"
            const sessionMatch = trimmedLine.match(/^(\d+)\.\s+(.+?)\s*(?:\((current)\))?$/);
            
            if (sessionMatch) {
                const number = parseInt(sessionMatch[1]);
                const name = sessionMatch[2];
                const isCurrent = !!sessionMatch[3];
                
                currentSession = {
                    number,
                    name,
                    isCurrent,
                    sessionId: `session_${Date.now()}_${number}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messageCount: 0
                };
                
                sessions.push(currentSession);
            } else if (currentSession && trimmedLine.includes('ID:')) {
                // Извлечение ID сессии
                const idMatch = trimmedLine.match(/ID:\s+(.+)/);
                if (idMatch) {
                    currentSession.sessionId = idMatch[1].trim();
                }
            } else if (currentSession && trimmedLine.includes('Created:')) {
                // Извлечение даты создания
                const createdMatch = trimmedLine.match(/Created:\s+(.+)/);
                if (createdMatch) {
                    currentSession.createdAt = new Date(createdMatch[1]).toISOString();
                }
            } else if (currentSession && trimmedLine.includes('Updated:')) {
                // Извлечение даты обновления
                const updatedMatch = trimmedLine.match(/Updated:\s+(.+)/);
                if (updatedMatch) {
                    currentSession.updatedAt = new Date(updatedMatch[1]).toISOString();
                }
            } else if (currentSession && trimmedLine.includes('Messages:')) {
                // Извлечение количества сообщений
                const messagesMatch = trimmedLine.match(/Messages:\s+(\d+)/);
                if (messagesMatch) {
                    currentSession.messageCount = parseInt(messagesMatch[1]);
                }
            }
        }
        
        return sessions;
    }

    // Переключение сессии через Hermes CLI
    async switchSession(sessionNumber) {
        try {
            const command = 'hermes';
            const args = ['session', 'switch', sessionNumber.toString()];
            
            const result = await this.executeCommand(command, args);
            
            if (!result.success) {
                throw new Error(`Ошибка переключения сессии: ${result.error}`);
            }
            
            return {
                success: true,
                message: `Сессия ${sessionNumber} успешно активирована`,
                output: result.output
            };
            
        } catch (error) {
            console.error('Ошибка переключения сессии:', error);
            return {
                success: false,
                message: error.message,
                output: null
            };
        }
    }

    // Создание новой сессии через Hermes CLI
    async createNewSession() {
        try {
            const command = 'hermes';
            const args = ['session', 'new'];
            
            const result = await this.executeCommand(command, args);
            
            if (!result.success) {
                throw new Error(`Ошибка создания сессии: ${result.error}`);
            }
            
            // Извлечение ID новой сессии из вывода
            const sessionIdMatch = result.output.match(/New session ID:\s+(.+)/);
            const sessionId = sessionIdMatch ? sessionIdMatch[1].trim() : `session_${Date.now()}`;
            
            return {
                success: true,
                message: 'Новая сессия успешно создана',
                sessionId,
                output: result.output
            };
            
        } catch (error) {
            console.error('Ошибка создания сессии:', error);
            return {
                success: false,
                message: error.message,
                output: null
            };
        }
    }

    // Получение информации о текущей сессии
    async getCurrentSession() {
        try {
            const sessions = await this.getSessions();
            return sessions.find(session => session.isCurrent) || sessions[0];
            
        } catch (error) {
            console.error('Ошибка получения текущей сессии:', error);
            return null;
        }
    }

    // Отправка сообщения в Hermes
    async sendMessage(message, sessionNumber = null) {
        try {
            const command = 'hermes';
            const args = ['chat'];
            
            if (sessionNumber) {
                args.push('--session', sessionNumber.toString());
            }
            
            // Создаем временный файл с сообщением
            const messageFile = path.join(this.tempDir, 'message.txt');
            fs.writeFileSync(messageFile, message);
            
            // Добавляем сообщение в аргументы
            args.push('--file', messageFile);
            
            const result = await this.executeCommand(command, args);
            
            // Удаляем временный файл
            if (fs.existsSync(messageFile)) {
                fs.unlinkSync(messageFile);
            }
            
            if (!result.success) {
                throw new Error(`Ошибка отправки сообщения: ${result.error}`);
            }
            
            return {
                success: true,
                message: 'Сообщение успешно отправлено',
                output: result.output
            };
            
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            return {
                success: false,
                message: error.message,
                output: null
            };
        }
    }

    // Получение истории сессии
    async getSessionHistory(sessionNumber) {
        try {
            const command = 'hermes';
            const args = ['session', 'history', sessionNumber.toString()];
            
            const result = await this.executeCommand(command, args);
            
            if (!result.success) {
                throw new Error(`Ошибка получения истории: ${result.error}`);
            }
            
            return {
                success: true,
                history: this.parseHistoryOutput(result.output),
                output: result.output
            };
            
        } catch (error) {
            console.error('Ошибка получения истории:', error);
            return {
                success: false,
                message: error.message,
                history: [],
                output: null
            };
        }
    }

    // Парсинг истории сессии
    parseHistoryOutput(output) {
        const history = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine && !trimmedLine.includes('===') && !trimmedLine.includes('HISTORY')) {
                history.push({
                    timestamp: new Date().toISOString(),
                    content: trimmedLine,
                    role: trimmedLine.includes('User:') ? 'user' : 'assistant'
                });
            }
        }
        
        return history;
    }

    // Выполнение системной команды
    executeCommand(command, args) {
        return new Promise((resolve) => {
            const child = spawn(command, args);
            let output = '';
            let error = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        output: output.trim(),
                        error: null
                    });
                } else {
                    resolve({
                        success: false,
                        output: output.trim(),
                        error: error.trim() || `Команда завершилась с кодом ${code}`
                    });
                }
            });
            
            child.on('error', (err) => {
                resolve({
                    success: false,
                    output: '',
                    error: err.message
                });
            });
        });
    }

    // Проверка доступности Hermes
    async checkHermesAvailability() {
        try {
            const result = await this.executeCommand('hermes', ['--version']);
            return {
                available: result.success,
                version: result.success ? result.output : null,
                error: result.error
            };
        } catch (error) {
            return {
                available: false,
                version: null,
                error: error.message
            };
        }
    }
}

// Экспорт класса
module.exports = HermesIntegration;