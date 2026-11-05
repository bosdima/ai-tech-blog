const fs = require('fs');
const path = require('path');

// Система автоматического продвижения AI Tech Blog
class PromotionSystem {
    constructor() {
        this.promotionTasks = [
            {
                name: 'Reddit Promotion',
                platforms: ['r/MachineLearning', 'r/OpenAI', 'r/LocalLLaMA', 'r/AI_Agents', 'r/technology'],
                frequency: 'daily',
                content: this.generateRedditContent.bind(this)
            },
            {
                name: 'LinkedIn Promotion',
                platforms: ['LinkedIn Articles', 'LinkedIn Posts'],
                frequency: 'weekly',
                content: this.generateLinkedInContent.bind(this)
            },
            {
                name: 'SEO Optimization',
                platforms: ['Google', 'AI Search'],
                frequency: 'monthly',
                content: this.optimizeSEO.bind(this)
            },
            {
                name: 'Content Repurposing',
                platforms: ['Multiple Platforms'],
                frequency: 'weekly',
                content: this.repurposeContent.bind(this)
            }
        ];
    }

    // Генерация контента для Reddit
    generateRedditContent() {
        const articles = this.getRecentArticles();
        const content = [];
        
        articles.forEach(article => {
            // Генерация постов для Reddit
            const redditPosts = [
                {
                    title: `Обзор: ${article.title}`,
                    content: `Поделился интересной статьей из моего AI Tech Блога. ${article.excerpt}\n\nЧто думаете о развитии ${article.tags[0]} в 2026 году?`,
                    flair: 'Discussion',
                    subreddit: 'r/technology'
                },
                {
                    title: `Вопрос по теме: ${article.title}`,
                    content: `В своей последней статье я писал о ${article.tags[0]}. У кого есть опыт использования таких технологий?\n\n${article.content.substring(0, 300)}...`,
                    flair: 'Help',
                    subreddit: 'r/OpenAI'
                }
            ];
            
            content.push(...redditPosts);
        });
        
        return content;
    }

    // Генерация контента для LinkedIn
    generateLinkedInContent() {
        const articles = this.getRecentArticles();
        const linkedInContent = [];
        
        articles.forEach(article => {
            linkedInContent.push({
                type: 'article',
                title: article.title,
                content: `
📝 Новая статья в моем AI Tech Блоге!

${article.title}

${article.excerpt}

💡 Ключевые моменты:
• Современные тенденции в ${article.tags[0]}
• Практическое применение технологий
• Прогнозы развития на 2026 год

🔗 Читать полностью: https://ai-tech-blog-steel.vercel.app

#ИИ #ИскусственныйИнтеллект #Технологии2026 #AI #MachineLearning
                `,
                image: 'ai-tech-banner.png'
            });
            
            linkedInContent.push({
                type: 'post',
                content: `
💡 Интересный факт дня: ${this.generateAIInsight()}

Что думаете о будущем ИИ? Делитесь в комментариях!

#AI #Technology #Innovation
                `
            });
        });
        
        return linkedInContent;
    }

    // SEO оптимизация
    optimizeSEO() {
        const articles = this.getRecentArticles();
        const seoTasks = [];
        
        articles.forEach(article => {
            // Генерация мета-тегов
            const metaTitle = `${article.title} | AI Tech Блог`;
            const metaDescription = article.excerpt.substring(0, 160) + '...';
            
            // Генерация ключевых слов
            const keywords = this.generateKeywords(article.tags[0]);
            
            seoTasks.push({
                article: article.title,
                metaTitle,
                metaDescription,
                keywords,
                schema: this.generateSchema(article)
            });
        });
        
        return seoTasks;
    }

    // Репостинг контента
    repurposeContent() {
        const articles = this.getRecentArticles();
        const repurposedContent = [];
        
        articles.forEach(article => {
            // Twitter/X thread
            const twitterThread = this.createTwitterThread(article);
            
            // Facebook post
            const facebookPost = this.createFacebookPost(article);
            
            // Email newsletter
            const emailContent = this.createEmailContent(article);
            
            repurposedContent.push({
                original: article.title,
                twitter: twitterThread,
                facebook: facebookPost,
                email: emailContent
            });
        });
        
        return repurposedContent;
    }

    // Вспомогательные методы
    getRecentArticles() {
        try {
            const articlesPath = path.join(__dirname, 'articles.json');
            const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
            return articles.slice(-5); // Последние 5 статей
        } catch (error) {
            console.log('Ошибка чтения статей:', error);
            return [];
        }
    }

    generateKeywords(topic) {
        const keywordMap = {
            'нейросети': ['нейросети 2026', 'глубокое обучение', 'deep learning', 'нейронные сети', 'ML'],
            'ИИ в медицине': ['ИИ медицина', 'healthcare AI', 'медицинский ИИ', 'AI diagnostics'],
            'автономные системы': ['автономные системы', 'autonomous systems', 'робототехника', 'AI robots'],
            'компьютерное зрение': ['computer vision', 'CV 2026', 'распознавание образов', 'AI vision'],
            'обработка естественного языка': ['NLP 2026', 'обработка текста', 'языковые модели', 'LLM']
        };
        
        return keywordMap[topic] || [topic, 'ИИ', 'AI', 'технологии'];
    }

    generateSchema(article) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': article.title,
            'description': article.excerpt,
            'author': {
                '@type': 'Person',
                'name': 'AI Tech Team'
            },
            'datePublished': article.date,
            'dateModified': article.date,
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': `https://ai-tech-blog-steel.vercel.app/${article.id}`
            }
        };
    }

    generateAIInsight() {
        const insights = [
            'До 2028 года ИИ будет автоматизировать до 70% рутинных задач в бизнесе',
            'Нейросети уже могут писать код лучше 40% junior разработчиков',
            'ChatGPT использует более 1 триллиона параметров для обработки запросов',
            'Компьютерное зрение достигло точности 98.7% в распознавании лиц',
            'Генеративный ИИ создаст контент стоимостью $1.3 трлн к 2030 году'
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }

    createTwitterThread(article) {
        return `
🧵 Тред: ${article.title}

1/ ${article.excerpt}

2/ Основные моменты:
• Тренды 2026 года
• Практическое применение
• Будущее развития

3/ Мое мнение:
${article.content.substring(0, 200)}...

#ИИ #AI #Технологии
        `;
    }

    createFacebookPost(article) {
        return `
📚 Новая статья в AI Tech Блоге!

${article.title}

${article.excerpt}

💬 Обсуждаем в комментариях: как вы используете ${article.tags[0]} в своей работе?

🔗 Читать полностью: https://ai-tech-blog-steel.vercel.app

#ИскусственныйИнтеллект #Технологии #AI #Блог
        `;
    }

    createEmailContent(article) {
        return `
📧 AI Tech Блог - Лучшие статьи недели

${article.title}

${article.content}

🎯 Не пропустите:
• Анализ трендов ИИ
• Практические руководства
• Экспертные прогнозы

🔗 Читать: https://ai-tech-blog-steel.vercel.app

С уважением,
AI Tech Team
        `;
    }

    // Генерация отчета о продвижении
    generatePromotionReport() {
        const report = {
            date: new Date().toISOString(),
            platforms: {
                reddit: this.generateRedditContent(),
                linkedin: this.generateLinkedInContent(),
                seo: this.optimizeSEO(),
                repurposed: this.repurposeContent()
            },
            summary: {
                totalContent: 0,
                platformsActive: 0,
                seoOptimized: 0
            }
        };

        // Подсчет метрик
        Object.values(report.platforms).forEach(platform => {
            if (Array.isArray(platform)) {
                report.summary.totalContent += platform.length;
            }
        });

        report.summary.platformsActive = Object.keys(report.platforms).filter(key => 
            report.platforms[key].length > 0
        ).length;

        report.summary.seoOptimized = report.platforms.seo.length;

        return report;
    }
}

// Экспорт класса
module.exports = PromotionSystem;