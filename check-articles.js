const articles = require('./articles.json');

console.log('Total articles:', articles.length);
console.log('Latest article date:', articles[articles.length - 1]?.date);
console.log('Oldest article date:', articles[0]?.date);

// Check if articles were recently updated
const latestDate = new Date(articles[articles.length - 1]?.date || '2020-01-01');
const now = new Date();
const hoursSinceUpdate = (now - latestDate) / (1000 * 60 * 60);

console.log('Hours since last update:', hoursSinceUpdate.toFixed(2));
console.log('Update needed (older than 2 hours):', hoursSinceUpdate > 2);