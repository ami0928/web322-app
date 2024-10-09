const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

// データファイルのパスを設定
const itemsFilePath = './data/items.json';
const categoriesFilePath = './data/categories.json';

let items = [];
let categories = [];

// データを初期化する関数
function initialize() {
    return new Promise((resolve, reject) => {
        // アイテムデータの読み込み
        fs.readFile(itemsFilePath, 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading items file:', err);
                reject('Unable to load items.');
            } else {
                items = JSON.parse(data);
                console.log('Items loaded successfully.');
                resolve();
            }
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            // カテゴリデータの読み込み
            fs.readFile(categoriesFilePath, 'utf-8', (err, data) => {
                if (err) {
                    console.error('Error reading categories file:', err);
                    reject('Unable to load categories.');
                } else {
                    categories = JSON.parse(data);
                    console.log('Categories loaded successfully.');
                    resolve();
                }
            });
        });
    });
}

// 公開されているアイテムを取得する関数
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length === 0) {
            reject('No published items found.');
        } else {
            resolve(publishedItems);
        }
    });
}

// すべてのアイテムを取得する関数
function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject('No items found.');
        } else {
            resolve(items);
        }
    });
}

// すべてのカテゴリを取得する関数
function getAllCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject('No categories found.');
        } else {
            resolve(categories);
        }
    });
}

// ルート設定
app.get('/shop', async (req, res) => {
    try {
        const items = await getPublishedItems();
        let itemsHTML = '<h1>Shop Items</h1><ul>';
        items.forEach(item => {
            itemsHTML += `<li>${item.title} - $${item.price} <img src="${item.featureImage}" alt="${item.title}"></li>`;
        });
        itemsHTML += '</ul>';
        res.send(itemsHTML);
    } catch (error) {
        console.error('Error retrieving shop items:', error);
        res.status(500).send('Error retrieving shop items.');
    }
});

app.get('/items', async (req, res) => {
    try {
        const items = await getAllItems();
        let itemsHTML = '<h1>All Items</h1><ul>';
        items.forEach(item => {
            itemsHTML += `<li>${item.title} - $${item.price} <img src="${item.featureImage}" alt="${item.title}"></li>`;
        });
        itemsHTML += '</ul>';
        res.send(itemsHTML);
    } catch (error) {
        console.error('Error retrieving items:', error);
        res.status(500).send('Error retrieving items.');
    }
});

app.get('/categories', async (req, res) => {
    try {
        const categories = await getAllCategories();
        console.log('Fetched categories:', categories); 
        let categoriesHTML = '<h1>Categories</h1><ul>';
        categories.forEach(category => {
            categoriesHTML += `<li>${category.category}</li>`;
        });
        categoriesHTML += '</ul>';
        res.send(categoriesHTML);
    } catch (error) {
        console.error('Error retrieving categories:', error);
        res.status(500).send('Error retrieving categories.');
    }
});

// Aboutページを追加
app.get('/about', (req, res) => {
    res.sendFile(__dirname + '/views/about.html'); // 'about.html'のパスを指定
});

// サーバーを起動し、データの初期化を行う
initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Error initializing data:', error);
});
