const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Обслуживание ads.txt
app.get('/ads.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'ads.txt'));
});

// Обслуживание основного приложения
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Static server running on port ${PORT}`);
});