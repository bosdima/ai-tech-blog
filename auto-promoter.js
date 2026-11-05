const PromotionSystem = require('./promotion-system');
const fs = require('fs');
const path = require('path');

// Автоматическая система продвижения AI Tech Blog
class AutoPromoter {
    constructor() {
        this.promotionSystem = new PromotionSystem();
        this.logPath = path.join(__dirname, 'promotion-logs.json');
        this.configPath = path.join(__dirname, 'promotion-config.json');
    }

    // Инициализация системы
    init() {
        console.log('🚀 Запуск автоматической системы продвижения AI Tech Blog...');
        
        // Загрузка конфигурации
        this.loadConfig();
        
        // Генерация контента
        const report = this.promotionSystem.generatePromotionReport();
        
        // Сохранение отчета
        this.saveReport(report);
        
        // Вывод статистики
        this.displayStats(report);
        
        return report;
    }

    // Загрузка конфигурации
    loadConfig() {
        const defaultConfig = {
            platforms: {
                reddit: true,
                linkedin: true,
                seo: true,
                twitter: true,
                facebook: true
            },
            frequencies: {
                daily: '08:00',
                weekly: '10:00',
                monthly: '15:00'
            },
            content: {
                articlesPerPost: 1,
                maxPostsPerDay: 5,
                includeImages: true
            }
        };

        try {
            if (fs.existsSync(this.configPath)) {
                const savedConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.config = { ...defaultConfig, ...savedConfig };
            } else {
                this.config = defaultConfig;
                fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            }
        } catch (error) {
            console.log('Ошибка загрузки конфигурации:', error);
            this.config = defaultConfig;
        }
    }

    // Сохранение отчета
    saveReport(report) {
        try {
            let logs = [];
            
            if (fs.existsSync(this.logPath)) {
                logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
            }
            
            logs.push({
                timestamp: new Date().toISOString(),
                report,
                status: 'success'
            });
            
            // Сохраняем только последние 50 записей
            if (logs.length > 50) {
                logs = logs.slice(-50);
            }
            
            fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
            
        } catch (error) {
            console.log('Ошибка сохранения отчета:', error);
        }
    }

    // Отображение статистики
    displayStats(report) {
        console.log('\n📊 Статистика продвижения:');
        console.log('='.repeat(50));
        
        console.log(`📝 Всего контента сгенерировано: ${report.summary.totalContent}`);
        console.log(`🌐 Активных платформ: ${report.summary.platformsActive}`);
        console.log(`🔍 SEO оптимизировано: ${report.summary.seoOptimized}`);
        
        // Детализация по платформам
        Object.entries(report.platforms).forEach(([platform, content]) => {
            if (content.length > 0) {
                console.log(`\n📱 ${platform.toUpperCase()}:`);
                console.log(`   📄 Количество постов: ${content.length}`);
                
                if (Array.isArray(content)) {
                    content.slice(0, 3).forEach((item, index) => {
                        if (item.title) {
                            console.log(`   ${index + 1}. ${item.title}`);
                        } else if (item.type) {
                            console.log(`   ${index + 1}. ${item.type} пост`);
                        }
                    });
                }
            }
        });
        
        console.log('\n✅ Система продвижения готова к работе!');
        console.log('🔗 Ваш сайт: https://ai-tech-blog-steel.vercel.app');
        console.log('📊 Отчет сохранен в promotion-logs.json');
    }

    // Проверка необходимости продвижения
    checkPromotionNeeded() {
        try {
            const articlesPath = path.join(__dirname, 'articles.json');
            if (!fs.existsSync(articlesPath)) {
                return true;
            }
            
            const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
            const lastPromotion = this.getLastPromotionTime();
            
            // Проверяем, нужно ли обновлять продвижение
            const now = new Date();
            const hoursSinceLastPromotion = (now - lastPromotion) / (1000 * 60 * 60);
            
            return hoursSinceLastPromotion > 24; // Обновляем каждые 24 часа
            
        } catch (error) {
            console.log('Ошибка проверки продвижения:', error);
            return true;
        }
    }

    // Получение времени последнего продвижения
    getLastPromotionTime() {
        try {
            if (fs.existsSync(this.logPath)) {
                const logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
                if (logs.length > 0) {
                    return new Date(logs[logs.length - 1].timestamp);
                }
            }
            return new Date(0); // Если логов нет, возвращаем старую дату
        } catch (error) {
            return new Date(0);
        }
    }

    // Автоматическое продвижение
    autoPromote() {
        console.log('🔄 Запуск автоматического продвижения...');
        
        try {
            if (!this.checkPromotionNeeded()) {
                console.log('⏰ Продвижение не требуется (последний запуск менее 24 часов назад)');
                return true;
            }
            
            const report = this.init();
            console.log('✅ Автоматическое продвижение завершено');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка автоматического продвижения:', error);
            return false;
        }
    }
}

// Использование
if (require.main === module) {
    const promoter = new AutoPromoter();
    
    // Ручной запуск
    promoter.init();
    
    // Или автоматический запуск
    // promoter.autoPromote();
}

module.exports = AutoPromoter;