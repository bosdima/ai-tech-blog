const { generateStaticVersion, updateContentAndStatic } = require('./server.js');

// Функция для ручного обновления
function manualUpdate() {
    console.log('🚀 Запуск ручного обновления AI Tech Блог...');
    updateContentAndStatic();
}

// Функция для генерации только статической версии
function generateStatic() {
    console.log('🔄 Генерация статической версии...');
    generateStaticVersion();
    console.log('✅ Статическая версия готова!');
}

// Экспортируем функции
module.exports = {
    manualUpdate,
    generateStatic
};