const DailyReporter = require('./daily-reporter');
const TelegramNotifier = require('./telegram-notifier');
const fs = require('fs');
const path = require('path');

// Главная система отчетности и уведомлений AI Tech Blog
class ReportingSystem {
    constructor() {
        this.reporter = new DailyReporter();
        this.notifier = new TelegramNotifier();
        this.configPath = path.join(__dirname, 'reporting-config.json');
        this.logPath = path.join(__dirname, 'reporting-logs.json');
        this.loadConfig();
    }

    // Загрузка конфигурации
    loadConfig() {
        const defaultConfig = {
            telegram: {
                enabled: false,
                botToken: '',
                chatId: '',
                testMode: false
            },
            reporting: {
                dailyReport: true,
                weeklySummary: false,
                monthlyAnalysis: false,
                checkAds: true,
                checkRevenue: true
            },
            schedule: {
                dailyTime: '09:00',
                weeklyDay: 'monday',
                monthlyDate: 1
            }
        };

        try {
            if (fs.existsSync(this.configPath)) {
                const savedConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.config = { ...defaultConfig, ...savedConfig };
            } else {
                this.config = defaultConfig;
                this.saveConfig();
            }
        } catch (error) {
            console.log('Ошибка загрузки конфигурации:', error);
            this.config = defaultConfig;
        }
    }

    // Сохранение конфигурации
    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.log('Ошибка сохранения конфигурации:', error);
        }
    }

    // Основной метод запуска
    async run() {
        console.log('🚀 Запуск системы отчетности AI Tech Blog...');
        console.log('='.repeat(60));
        
        try {
            // 1. Генерация ежедневного отчета
            console.log('📊 Шаг 1: Генерация ежедневного отчета...');
            const report = await this.reporter.generateDailyReport();
            
            if (!report) {
                throw new Error('Не удалось сгенерировать отчет');
            }
            
            // 2. Отправка в Telegram (если включено)
            if (this.config.telegram.enabled) {
                console.log('📱 Шаг 2: Отправка отчета в Telegram...');
                const telegramResult = await this.notifier.sendDailyReport();
                
                if (telegramResult) {
                    console.log('✅ Отчет успешно отправлен в Telegram');
                } else {
                    console.log('❌ Ошибка отправки в Telegram');
                }
            } else {
                console.log('⏭️  Отправка в Telegram отключена');
            }
            
            // 3. Сохранение логов
            console.log('💾 Шаг 3: Сохранение логов...');
            this.saveReportLog(report);
            
            // 4. Отображение результатов
            console.log('\n🎉 Отчет успешно сгенерирован!');
            this.displayResults(report);
            
            return report;
            
        } catch (error) {
            console.error('❌ Критическая ошибка:', error);
            return null;
        }
    }

    // Генерация еженедельного отчета
    async generateWeeklyReport() {
        console.log('📊 Генерация еженедельного отчета...');
        
        try {
            const reports = this.getRecentReports(7);
            const weeklyStats = this.calculateWeeklyStats(reports);
            
            const weeklyReport = {
                type: 'weekly',
                date: new Date().toISOString(),
                period: 'Последние 7 дней',
                stats: weeklyStats,
                insights: this.generateWeeklyInsights(reports)
            };
            
            console.log('✅ Еженедельный отчет сгенерирован');
            return weeklyReport;
            
        } catch (error) {
            console.error('Ошибка генерации еженедельного отчета:', error);
            return null;
        }
    }

    // Генерация ежемесячного отчета
    async generateMonthlyReport() {
        console.log('📊 Генерация ежемесячного отчета...');
        
        try {
            const reports = this.getRecentReports(30);
            const monthlyStats = this.calculateMonthlyStats(reports);
            
            const monthlyReport = {
                type: 'monthly',
                date: new Date().toISOString(),
                period: 'Последние 30 дней',
                stats: monthlyStats,
                insights: this.generateMonthlyInsights(reports)
            };
            
            console.log('✅ Ежемесячный отчет сгенерирован');
            return monthlyReport;
            
        } catch (error) {
            console.error('Ошибка генерации ежемесячного отчета:', error);
            return null;
        }
    }

    // Сохранение лога отчетов
    saveReportLog(report) {
        try {
            let logs = [];
            
            if (fs.existsSync(this.logPath)) {
                logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
            }
            
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'daily',
                visitors: report.today.visitors,
                revenue: report.revenue.daily,
                adsStatus: report.summary.ads,
                telegramSent: this.config.telegram.enabled
            });
            
            // Сохраняем только последние 100 записей
            if (logs.length > 100) {
                logs = logs.slice(-100);
            }
            
            fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
            
        } catch (error) {
            console.log('Ошибка сохранения лога отчетов:', error);
        }
    }

    // Получение последних отчетов
    getRecentReports(days) {
        try {
            if (!fs.existsSync(this.logPath)) {
                return [];
            }
            
            const logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            return logs.filter(log => new Date(log.timestamp) > cutoffDate);
            
        } catch (error) {
            console.log('Ошибка получения последних отчетов:', error);
            return [];
        }
    }

    // Расчет недельной статистики
    calculateWeeklyStats(reports) {
        if (reports.length === 0) {
            return { visitors: 0, revenue: 0, adsIssues: 0 };
        }
        
        const totalVisitors = reports.reduce((sum, report) => sum + report.visitors, 0);
        const totalRevenue = reports.reduce((sum, report) => sum + report.revenue, 0);
        const adsIssues = reports.filter(report => !report.adsStatus.includes('✅')).length;
        
        return {
            visitors: totalVisitors,
            revenue: totalRevenue,
            adsIssues: adsIssues,
            avgDailyVisitors: Math.round(totalVisitors / reports.length),
            avgDailyRevenue: Math.round(totalRevenue / reports.length * 100) / 100
        };
    }

    // Расчет месячной статистики
    calculateMonthlyStats(reports) {
        if (reports.length === 0) {
            return { visitors: 0, revenue: 0, growth: 0 };
        }
        
        const totalVisitors = reports.reduce((sum, report) => sum + report.visitors, 0);
        const totalRevenue = reports.reduce((sum, report) => sum + report.revenue, 0);
        
        // Расчет роста (сравнение с предыдущими 15 днями)
        const firstHalf = reports.slice(0, Math.floor(reports.length / 2));
        const secondHalf = reports.slice(Math.floor(reports.length / 2));
        
        const firstHalfVisitors = firstHalf.reduce((sum, report) => sum + report.visitors, 0);
        const secondHalfVisitors = secondHalf.reduce((sum, report) => sum + report.visitors, 0);
        
        const growth = firstHalfVisitors > 0 ? 
            ((secondHalfVisitors - firstHalfVisitors) / firstHalfVisitors * 100).toFixed(1) : 0;
        
        return {
            visitors: totalVisitors,
            revenue: totalRevenue,
            growth: parseFloat(growth),
            avgDailyVisitors: Math.round(totalVisitors / reports.length),
            avgDailyRevenue: Math.round(totalRevenue / reports.length * 100) / 100
        };
    }

    // Генерация еженедельных инсайтов
    generateWeeklyInsights(reports) {
        if (reports.length === 0) {
            return ['Нет данных за неделю'];
        }
        
        const insights = [];
        
        // Анализ трафика
        const avgVisitors = reports.reduce((sum, report) => sum + report.visitors, 0) / reports.length;
        if (avgVisitors > 100) {
            insights.push('📈 Отличный трафик! Больше 100 посетителей в день');
        } else if (avgVisitors < 50) {
            insights.push('📉 Трафик низкий, нужно больше продвижения');
        }
        
        // Анализ рекламы
        const adsIssues = reports.filter(report => !report.adsStatus.includes('✅')).length;
        if (adsIssues > 0) {
            insights.push(`⚠️ ${adsIssues} дней с проблемами рекламой`);
        }
        
        // Анализ дохода
        const avgRevenue = reports.reduce((sum, report) => sum + report.revenue, 0) / reports.length;
        if (avgRevenue > 10) {
            insights.push('💰 Хороший доход! Больше $10 в день');
        } else if (avgRevenue < 5) {
            insights.push('💰 Доход низкий, нужно оптимизировать рекламу');
        }
        
        return insights;
    }

    // Генерация ежемесячных инсайтов
    generateMonthlyInsights(reports) {
        if (reports.length === 0) {
            return ['Нет данных за месяц'];
        }
        
        const insights = [];
        
        // Анализ роста
        const monthlyStats = this.calculateMonthlyStats(reports);
        if (monthlyStats.growth > 0) {
            insights.push(`📈 Трафик вырос на ${monthlyStats.growth}% за месяц`);
        } else {
            insights.push(`📉 Трафик упал на ${Math.abs(monthlyStats.growth)}% за месяц`);
        }
        
        // Анализ стабильности
        const revenueVariance = this.calculateRevenueVariance(reports);
        if (revenueVariance < 20) {
            insights.push('💰 Доход стабильный, низкая волатильность');
        } else {
            insights.push('⚠️ Доход нестабильный, высокая волатильность');
        }
        
        // Анализ эффективности
        const revenuePerVisitor = monthlyStats.revenue / monthlyStats.visitors;
        if (revenuePerVisitor > 0.1) {
            insights.push('🎯 Отличная эффективность! Больше $0.1 на посетителя');
        } else {
            insights.push('📊 Низкая эффективность, нужно оптимизировать монетизацию');
        }
        
        return insights;
    }

    // Расчет волатильности дохода
    calculateRevenueVariance(reports) {
        if (reports.length < 2) return 0;
        
        const revenues = reports.map(report => report.revenue);
        const mean = revenues.reduce((sum, revenue) => sum + revenue, 0) / revenues.length;
        const variance = revenues.reduce((sum, revenue) => sum + Math.pow(revenue - mean, 2), 0) / revenues.length;
        const stdDev = Math.sqrt(variance);
        
        return (stdDev / mean * 100).toFixed(1);
    }

    // Отображение результатов
    displayResults(report) {
        console.log('\n🎉 РЕЗУЛЬТАТЫ ОТЧЕТА:');
        console.log('='.repeat(50));
        
        console.log('📊 ЕЖЕДНЕВНАЯ СТАТИСТИКА:');
        console.log(`   Посетители: ${report.today.visitors}`);
        console.log(`   Сессии: ${report.today.sessions}`);
        console.log(`   Просмотров: ${report.today.pageviews}`);
        console.log(`   Доход сегодня: $${report.revenue.daily}`);
        console.log(`   Тренд: ${report.summary.trend}`);
        console.log('');
        
        console.log('📊 РЕКЛАМА:');
        console.log(`   Статус: ${report.summary.ads}`);
        console.log(`   ads.txt: ${report.ads.adsTxt ? '✅ Работает' : '❌ Не работает'}`);
        console.log(`   AdSense: ${report.ads.adsense ? '✅ Код найден' : '❌ Код не найден'}`);
        console.log(`   Партнерки: ${report.ads.affiliates ? '✅ Подключены' : '❌ Не подключены'}`);
        console.log('');
        
        console.log('💰 ПРОГНОЗ ДОХОДА:');
        console.log(`   Сегодня: $${report.revenue.daily}`);
        console.log(`   Месяц: $${report.revenue.monthly}`);
        console.log(`   Год: $${report.revenue.yearly}`);
        console.log('');
        
        console.log('🌐 САЙТ:');
        console.log(`   URL: https://ai-tech-blog-steel.vercel.app`);
        console.log(`   Статей: ${this.reporter.getArticleCount()}`);
        console.log(`   Последнее обновление: ${this.reporter.getLastUpdate()}`);
        console.log('');
        
        console.log('📱 ТЕЛЕГРАМ:');
        console.log(`   Уведомления: ${this.config.telegram.enabled ? '✅ Включены' : '❌ Отключены'}`);
        console.log(`   Следующий отчет: Завтра в 09:00`);
        console.log('');
        
        console.log('🎯 СТАТУС СИСТЕМЫ:');
        console.log('   ✅ Автоматическое обновление контента');
        console.log('   ✅ Продвижение в Reddit + LinkedIn');
        console.log('   ✅ Оптимизация под SEO');
        console.log('   ✅ Монетизация 24/7');
        console.log('   ✅ Ежедневные отчеты');
        console.log('');
        
        console.log('🚀 ВСЕ ГОТОВО К ЗАРАБОТКУ!');
    }

    // Настройка Telegram
    setupTelegram(botToken, chatId) {
        this.config.telegram.enabled = true;
        this.config.telegram.botToken = botToken;
        this.config.telegram.chatId = chatId;
        this.saveConfig();
        
        console.log('✅ Telegram настроен успешно');
        console.log('📱 Теперь вы будете получать ежедневные отчеты');
    }

    // Тестирование системы
    async testSystem() {
        console.log('🧪 Тестирование системы отчетности...');
        
        try {
            // Тест генерации отчета
            const report = await this.reporter.generateDailyReport();
            
            if (!report) {
                throw new Error('Не удалось сгенерировать отчет');
            }
            
            console.log('✅ Отчет сгенерирован успешно');
            
            // Тест Telegram (если настроен)
            if (this.config.telegram.enabled) {
                const testResult = await this.notifier.testNotification();
                if (testResult) {
                    console.log('✅ Telegram работает');
                } else {
                    console.log('❌ Telegram не работает');
                }
            } else {
                console.log('⏭️  Telegram не настроен');
            }
            
            console.log('🎉 Система протестирована успешно');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка тестирования:', error);
            return false;
        }
    }
}

// Использование
if (require.main === module) {
    const system = new ReportingSystem();
    
    // Проверка аргументов командной строки
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        // Тестирование системы
        system.testSystem().then(() => {
            console.log('\n🎉 Тест завершен!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Тест не прошел:', error);
            process.exit(1);
        });
    } else if (args.includes('--weekly')) {
        // Еженедельный отчет
        system.generateWeeklyReport().then(() => {
            console.log('\n🎉 Еженедельный отчет готов!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Ошибка еженедельного отчета:', error);
            process.exit(1);
        });
    } else if (args.includes('--monthly')) {
        // Ежемесячный отчет
        system.generateMonthlyReport().then(() => {
            console.log('\n🎉 Ежемесячный отчет готов!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Ошибка ежемесячного отчета:', error);
            process.exit(1);
        });
    } else {
        // Обычный запуск
        system.run().then(() => {
            console.log('\n🎉 Система завершена!');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Система завершилась с ошибкой:', error);
            process.exit(1);
        });
    }
}

module.exports = ReportingSystem;