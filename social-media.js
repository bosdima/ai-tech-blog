const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');

// Конфигурация для социальных сетей
const SOCIAL_MEDIA_CONFIG = {
  telegram: {
    channel: '@AITechBlog',
    apiToken: 'YOUR_TELEGRAM_BOT_TOKEN',
    postInterval: '0 */6 * * *' // Каждые 6 часов
  },
  twitter: {
    apiKey: 'YOUR_TWITTER_API_KEY',
    apiSecret: 'YOUR_TWITTER_API_SECRET',
    accessToken: 'YOUR_TWITTER_ACCESS_TOKEN',
    accessSecret: 'YOUR_TWITTER_ACCESS_SECRET',
    postInterval: '0 */3 * * *' // Каждые 3 часа
  }
};

// Функция публикации в Telegram
async function postToTelegram(article) {
  const message = `
🤖 Новая статья в AI Tech Блоге!

${article.title}

${article.excerpt}

Читать полную статью: https://your-domain.com/articles/${article.id}

#ИИ #Нейросети #Технологии
  `;
  
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${SOCIAL_MEDIA_CONFIG.telegram.apiToken}/sendMessage`,
      {
        chat_id: '@AITechBlog',
        text: message,
        parse_mode: 'HTML'
      }
    );
    console.log('Пост в Telegram успешно отправлен');
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error.message);
  }
}

// Функция публикации в Twitter
async function postToTwitter(article) {
  const tweet = `${article.title}\n\n${article.excerpt}\n\n#AI #Tech #MachineLearning #NeuralNetworks`;
  
  try {
    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      { text: tweet },
      {
        headers: {
          'Authorization': `Bearer ${SOCIAL_MEDIA_CONFIG.twitter.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Твит успешно опубликован');
  } catch (error) {
    console.error('Ошибка публикации в Twitter:', error.message);
  }
}

// Функция генерации постов для соцсетей
function generateSocialPosts(article) {
  const posts = {
    telegram: {
      message: `
🤖 Новая статья в AI Tech Блоге!

${article.title}

${article.excerpt}

Читать полную статью: https://your-domain.com/articles/${article.id}

#ИИ #Нейросети #Технологии
      `,
      hashtags: ['#ИИ', '#Нейросети', '#Технологии', '#AI', '#MachineLearning']
    },
    twitter: {
      message: `${article.title}\n\n${article.excerpt}\n\n#AI #Tech #MachineLearning #NeuralNetworks`,
      hashtags: ['#AI', '#Tech', '#MachineLearning', '#NeuralNetworks']
    },
    linkedin: {
      message: `📚 Новая статья: "${article.title}"

В нашем AI Tech Блоге вышла новая статья о последних достижениях в области искусственного интеллекта.

${article.excerpt}

#ArtificialIntelligence #MachineLearning #TechInnovation
    `,
      hashtags: ['#ArtificialIntelligence', '#MachineLearning', '#TechInnovation']
    }
  };
  
  return posts;
}

// Автоматическая публикация новых статей
function autoPublishArticles() {
  console.log('Проверка новых статей для публикации...');
  
  try {
    const articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
    const latestArticle = articles[articles.length - 1];
    
    if (latestArticle) {
      const posts = generateSocialPosts(latestArticle);
      
      // Публикация в Telegram
      if (SOCIAL_MEDIA_CONFIG.telegram.apiToken) {
        postToTelegram(latestArticle);
      }
      
      // Публикация в Twitter
      if (SOCIAL_MEDIA_CONFIG.twitter.apiKey) {
        postToTwitter(latestArticle);
      }
      
      console.log('Новая статья автоматически опубликована в соцсетях');
    }
  } catch (error) {
    console.error('Ошибка автоматической публикации:', error.message);
  }
}

// Настройка расписаний
cron.schedule(SOCIAL_MEDIA_CONFIG.telegram.postInterval, () => {
  console.log('Запуск автоматической публикации...');
  autoPublishArticles();
});

// Публикация при запуске
console.log('Система автоматической публикации запущена');
autoPublishArticles();

module.exports = { generateSocialPosts, autoPublishArticles };