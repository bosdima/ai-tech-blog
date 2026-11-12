const { autoUpdate } = require('./simple-auto-update.js');

console.log('🚀 Запуск AI Tech Blog обновления...');

const result = autoUpdate();
console.log('✅ Обновление завершено:', result ? 'успешно' : 'с ошибками');
process.exit(result ? 0 : 1);