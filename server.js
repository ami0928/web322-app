/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Ami Yamada 
Student ID: 159621226 
Date: Oct.9th
Cyclic Web App URL: https://replit.com/@amiyamada0928/web322-app
GitHub Repository URL: https://github.com/ami0928/web322-app__________

********************************************************************************/ 

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;
const multer = require("multer");
const upload = multer();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const router = express.Router();

cloudinary.config({
    cloud_name: 'dwffbl9mq',
    api_key: '829141384638156',
    api_secret: 'k6Mbf0Z_bpwEIgoNFerqfkKbXfA',
    secure: true
});

// アイテムを追加するPOSTリクエストを処理
router.post('/items/add', upload.single('featureImage'), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.secure_url);
        }).catch((error) => {
            console.error("Error uploading to Cloudinary:", error);
            res.status(500).send("Error uploading image.");
        });
    } else {
        processItem(""); // 画像がない場合は空のURLを渡す
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        // 新しいアイテムをデータベースに追加する処理
        const newItem = new Item(req.body); // req.bodyをもとに新しいアイテムを作成

        newItem.save() // データベースに保存
            .then(() => {
                res.redirect('/items'); // アイテムの一覧ページにリダイレクト
            })
            .catch((error) => {
                console.error("Error saving item to database:", error);
                res.status(500).send("Error saving item.");
            });
    }
});

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

// アイテムを追加する関数
function addItem(newItem) {
    return new Promise((resolve, reject) => {
        items.push(newItem);
        fs.writeFile(itemsFilePath, JSON.stringify(items, null, 2), (err) => {
            if (err) {
                console.error('Error writing items file:', err);
                reject('Unable to save item.');
            } else {
                console.log('Item added successfully.');
                resolve(newItem);
            }
        });
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
        let filteredItems;

        if (req.query.category) {
            // カテゴリによるフィルタリング
            filteredItems = await getItemsByCategory(req.query.category);
        } else if (req.query.minDate) {
            // 最小日付によるフィルタリング
            filteredItems = await getItemsByMinDate(req.query.minDate);
        } else {
            // フィルターなしで全アイテムを取得
            filteredItems = await getAllItems();
        }

        let itemsHTML = '<h1>All Items</h1><ul>';
        filteredItems.forEach(item => {
            itemsHTML += `<li>${item.title} - $${item.price} <img src="${item.featureImage}" alt="${item.title}"></li>`;
        });
        itemsHTML += '</ul>';
        res.send(itemsHTML);
    } catch (error) {
        console.error('Error retrieving items:', error);
        res.status(500).send('Error retrieving items.');
    }
});

// アイテムをIDで取得するルートを追加
app.get('/item/:id', async (req, res) => {
    const itemId = req.params.id; // URLからIDを取得

    try {
        const item = await getItemById(itemId); // getItemById関数を呼び出す
        if (item) {
            res.json(item); // アイテム情報をJSON形式で返す
        } else {
            res.status(404).send('Item not found'); // アイテムが見つからない場合
        }
    } catch (error) {
        console.error('Error retrieving item:', error);
        res.status(500).send('Error retrieving item'); // エラーが発生した場合
    }
});

// getItemById関数の実装例
function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === parseInt(id)); // IDでアイテムを検索
        if (item) {
            resolve(item); // アイテムが見つかった場合
        } else {
            reject('Item not found'); // アイテムが見つからない場合
        }
    });
}


// カテゴリでアイテムを取得する関数
function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category == category); // categoryは数値として扱う必要があるため==を使用
        if (filteredItems.length === 0) {
            reject('No items found for the specified category.');
        } else {
            resolve(filteredItems);
        }
    });
}

// 最小日付でアイテムを取得する関数
function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        if (filteredItems.length === 0) {
            reject('No items found after the specified date.');
        } else {
            resolve(filteredItems);
        }
    });
}



app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'addItem.html')); // 'addItem.html'のパスを指定
});

// アイテムを追加するPOSTリクエストを処理
app.post('/items/add', upload.single('featureImage'), async (req, res) => {
    try {
        const newItem = {
            title: req.body.title,
            price: req.body.price,
            published: true,
            featureImage: '' // CloudinaryからのURLはここで設定する必要があります
        };

        // Cloudinaryに画像をアップロード
        const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (error) {
                console.error('Error uploading image:', error);
                return res.status(500).send('Error uploading image.');
            }
            newItem.featureImage = result.secure_url;
            return addItem(newItem).then(item => {
                res.redirect('/items');
            }).catch(err => {
                console.error('Error adding item:', err);
                res.status(500).send('Error adding item.');
            });
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);

    } catch (error) {
        console.error('Error adding new item:', error);
        res.status(500).send('Error adding new item.');
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

app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Shop!</h1><p><a href="/shop">Go to Shop</a></p><p><a href="/items">View All Items</a></p><p><a href="/categories">View Categories</a></p><p><a href="/about">About Us</a></p>');
});

// Aboutページを追加
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html')); // 'about.html'のパスを指定
});

// サーバーを起動し、データの初期化を行う
initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Error initializing data:', error);
});
