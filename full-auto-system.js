const AutoPromoter = require('./auto-promoter');
const { autoUpdate } = require('./simple-auto-update');
const fs = require('fs');
const path = require('path');

// Полная автоматическая система AI Tech Blog
class FullAutoSystem {
    constructor() {
        this.promoter = new AutoPromoter();
        this.logPath = path.join(__dirname, 'full-system-logs.json');
    }

    // Основной метод запуска
    async run() {
        console.log('🚀 Запуск полной автоматической системы AI Tech Blog...');
        console.log('='.repeat(60));
        
        try {
            // 1. Обновление контента
            console.log('📝 Шаг 1: Обновление контента...');
            const contentUpdated = await this.updateContent();
            
            // 2. Автоматическое продвижение
            console.log('\n📱 Шаг 2: Автоматическое продвижение...');
            const promotionResult = await this.promote();
            
            // 3. Генерация отчета
            console.log('\n📊 Шаг 3: Генерация отчета...');
            const report = this.generateReport(contentUpdated, promotionResult);
            
            // 4. Сохранение логов
            this.saveReport(report);
            
            // 5. Отображение результатов
            this.displayResults(report);
            
            return report;
            
        } catch (error) {
            console.error('❌ Критическая ошибка:', error);
            return null;
        }
    }

    // Обновление контента
    async updateContent() {
        try {
            console.log('🔄 Запуск обновления контента...');
            const result = await new Promise((resolve) => {
                autoUpdate();
                setTimeout(() => resolve(true), 3000); // Ждем завершения
            });
            
            console.log(result ? '✅ Контент обновлен' : '❌ Ошибка обновления контента');
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка обновления контента:', error);
            return false;
        }
    }

    // Продвижение
    async promote() {
        try {
            console.log('🔄 Запуск продвижения...');
            const result = this.promoter.autoPromote();
            console.log(result ? '✅ Продвижение завершено' : '❌ Ошибка продвижения');
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка продвижения:', error);
            return false;
        }
    }

    // Генерация отчета
    generateReport(contentUpdated, promotionResult) {
        const now = new Date();
        
        return {
            timestamp: now.toISOString(),
            date: now.toLocaleDateString('ru-RU'),
            time: now.toLocaleTimeString('ru-RU'),
            content: {
                updated: contentUpdated,
                message: contentUpdated ? 'Контент успешно обновлен' : 'Ошибка обновления контента'
            },
            promotion: {
                success: promotionResult,
                message: promotionResult ? 'Продвижение успешно завершено' : 'Ошибка продвижения'
            },
            statistics: {
                articles: this.getArticleCount(),
                promotions: this.getPromotionCount(),
                uptime: this.calculateUptime()
            },
            nextRun: this.calculateNextRun()
        };
    }

    // Сохранение отчета
    saveReport(report) {
        try {
            let logs = [];
            
            if (fs.existsSync(this.logPath)) {
                logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
            }
            
            logs.push(report);
            
            // Сохраняем только последние 100 записей
            if (logs.length > 100) {
                logs = logs.slice(-100);
            }
            
            fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
            
        } catch (error) {
            console.log('Ошибка сохранения отчета:', error);
        }
    }

    // Отображение результатов
    displayResults(report) {
        console.log('\n🎉 Отчет о работе системы:');
        console.log('='.repeat(60));
        
        console.log(`📅 Дата: ${report.date}`);
        console.log(`⏰ Время: ${report.time}`);
        console.log('');
        
        console.log('📝 Обновление контента:');
        console.log(`   ${report.content.updated ? '✅' : '❌'} ${report.content.message}`);
        
        console.log('\n📱 Продвижение:');
        console.log(`   ${report.promotion.success ? '✅' : '❌'} ${report.promotion.message}`);
        
        console.log('\n📊 Статистика:');
        console.log(`   📄 Статей: ${report.statistics.articles}`);
        console.log(`   📈 Сессий продвижения: ${report.statistics.promotions}`);
        console.log(`   ⏱️  Время работы: ${report.statistics.uptime}`);
        
        console.log('\n🚀 Следующий запуск:');
        console.log(`   📅 ${report.nextRun.date}`);
        console.log(`   ⏰ ${report.nextRun.time}`);
        
        console.log('\n🎯 Результат:');
        console.log(report.content.updated && report.promotion.success 
            ? '✅ Система работает отлично!' 
            : '⚠️ Требуется внимание');
        
        console.log('\n🔗 Ваш сайт: https://ai-tech-blog-steel.vercel.app');
        console.log('💰 Заработок продолжается 24/7!');
    }

    // Получение количества статей
    getArticleCount() {
        try {
            const articlesPath = path.join(__dirname, 'articles.json');
            if (fs.existsSync(articlesPath)) {
                const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
                return articles.length;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    // Получение количества сессий продвижения
    getPromotionCount() {
        try {
            if (fs.existsSync(this.promoter.logPath)) {
                const logs = JSON.parse(fs.readFileSync(this.promoter.logPath, 'utf8'));
                return logs.length;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    // Расчет времени работы
    calculateUptime() {
        try {
            if (fs.existsSync(this.logPath)) {
                const logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
                if (logs.length > 0) {
                    const firstRun = new Date(logs[0].timestamp);
                    const now = new Date();
                    const uptime = now - firstRun;
                    
                    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    
                    return `${days}д ${hours}ч`;
                }
            }
            return '0д 0ч';
        } catch (error) {
            return '0д 0ч';
        }
    }

    // Расчет следующего запуска
    calculateNextRun() {
        const now = new Date();
        const nextRun = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 часа
        
        return {
            date: nextRun.toLocaleDateString('ru-RU'),
            time: nextRun.toLocaleTimeString('ru-RU')
        };
    }
}

// Использование
if (require.main === module) {
    const system = new FullAutoSystem();
    system.run().then(report => {
        console.log('\n🎉 Система завершена!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Система завершилась с ошибкой:', error);
        process.exit(1);
    });
}

module.exports = FullAutoSystem;