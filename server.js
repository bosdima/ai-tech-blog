const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Статические файлы
app.use(express.static('.'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Конфигурация
const AI_NEWS_SOURCES = [
    'https://habr.com/hub/neural_networks/',
    'https://habr.com/hub/ai/',
    'https://tproger.ru/tag/neural-networks/',
    'https://vc.ru/tech'
];

const MONETIZATION_LINKS = {
    'courses': [
        { name: 'Coursera AI Courses', url: 'https://www.coursera.org/browse/artificial-intelligence', commission: 15 },
        { name: 'Udacity AI Nanodegree', url: 'https://www.udacity.com/course/ai-artificial-intelligence--nd001', commission: 20 },
        { name: 'Fast.ai ML Course', url: 'https://www.fast.ai/', commission: 10 }
    ],
    'tools': [
        { name: 'OpenAI API', url: 'https://openai.com/', commission: 10 },
        { name: 'Hugging Face', url: 'https://huggingface.co/', commission: 8 },
        { name: 'Google AI Platform', url: 'https://cloud.google.com/ai-platform', commission: 12 }
    ]
};

// База данных статей (в памяти, для простоты)
let articles = [];

// Функция для парсинга новостей
async function parseNews() {
    console.log('Начинаю парсинг новостей...');
    
    for (const source of AI_NEWS_SOURCES) {
        try {
            const response = await axios.get(source);
            const $ = cheerio.load(response.data);
            
            // Здесь должна быть логика извлечения новостей
            // В зависимости от структуры сайта
            
            console.log(`Парсинг источника: ${source}`);
            
            // Добавляем задержку между запросами
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`Ошибка при парсинге ${source}:`, error.message);
        }
    }
    
    // Генерируем новые статьи на основе трендов
    generateAIContent();
}

// Функция генерации контента с ИИ
function generateAIContent() {
    const topics = [
        'Новые архитектуры нейросетей',
        'ИИ в медицине',
        'Автономные системы',
        'Компьютерное зрение',
        'Обработка естественного языка',
        'Робототехника',
        'Квантовые вычисления и ИИ',
        'Этика искусственного интеллекта'
    ];
    
    const newArticles = topics.map((topic, index) => ({
        id: Date.now() + index,
        title: `${topic}: последние достижения`,
        excerpt: `Обзор последних разработок в области ${topic}. Анализ трендов и прогнозы развития.`,
        content: generateArticleContent(topic),
        date: new Date().toLocaleDateString('ru-RU'),
        tags: [topic.toLowerCase()],
        monetization: getMonetizationLinks(topic)
    }));
    
    articles = [...articles, ...newArticles];
    
    // Сохраняем в файл
    fs.writeFileSync(path.join(__dirname, 'articles.json'), JSON.stringify(articles, null, 2));
    
    console.log(`Сгенерировано ${newArticles.length} новых статей`);
}

// Функция генерации контента статьи
function generateArticleContent(topic) {
    const templates = [
        `В этой статье мы рассмотрим последние достижения в области ${topic}. Современные технологии позволяют достигать невероятных результатов...`,
        `Исследуем новые подходы к ${topic}. Эксперты прогнозируют значительный прогресс в ближайшие годы...`,
        `Анализируем тренды развития ${topic}. Какие технологии будут доминировать в 2026 году?`,
        `Глубокое погружение в мир ${topic}. Практические примеры и реальные кейсы внедрения...`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// Функция получения партнерских ссылок
function getMonetizationLinks(topic) {
    let relevantLinks = [];
    
    if (topic.includes('курс') || topic.includes('обучение')) {
        relevantLinks = MONETIZATION_LINKS.courses;
    } else if (topic.includes('инструмент') || topic.includes('платформа')) {
        relevantLinks = MONETIZATION_LINKS.tools;
    }
    
    return relevantLinks.slice(0, 2); // Максимум 2 ссылки на статью
}

// API эндпоинты
app.get('/api/articles', (req, res) => {
    res.json(articles);
});

app.get('/api/monetization', (req, res) => {
    res.json(MONETIZATION_LINKS);
});

app.get('/api/stats', (req, res) => {
    const stats = {
        totalArticles: articles.length,
        lastUpdate: new Date().toISOString(),
        sourcesCount: AI_NEWS_SOURCES.length
    };
    res.json(stats);
});

// Запуск парсинга по расписанию (каждые 2 часа)
cron.schedule('0 */2 * * *', () => {
    console.log('Запускаю автоматический парсинг...');
    parseNews();
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`AI Tech Блог запущен на порту ${PORT}`);
    
    // Первоначальный парсинг при запуске
    parseNews();
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
    console.error('Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Необработанный rejection:', reason);
});