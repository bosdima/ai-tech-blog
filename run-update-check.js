const { checkUpdateNeeded, autoUpdate } = require('./auto-update.js');
if (checkUpdateNeeded()) {
  console.log('Обновление нужно');
  autoUpdate();
} else {
  console.log('Обновление не нужно');
}