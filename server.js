const express = require('express'); // expressモジュールをインポート
const storeService = require('./data/store-service.js'); // store-serviceモジュールをインポート

const app = express(); // expressアプリケーションを作成

// staticミドルウェアを使用してpublicフォルダを提供
app.use(express.static('public'));

// ポートを設定
const PORT = process.env.PORT || 8080;

// ルート"/"で"/about"にリダイレクト
app.get('/', (req, res) => {
    res.redirect('/about');
});

// ルート"/about"でabout.htmlを返す
app.get('/about', (req, res) => {
    res.sendFile(__dirname + '/views/about.html');
});

// /shop ルート
app.get('/shop', (req, res) => {
    storeService.getPublishedItems() // publishedがtrueのアイテムを取得
        .then((items) => {
            res.json(items); // JSON形式でアイテムを返す
        })
        .catch((error) => {
            res.status(500).json({ message: error }); // エラーメッセージをオブジェクト形式で返す
        });
});

// /items ルート
app.get('/items', (req, res) => {
    storeService.getAllItems() // すべてのアイテムを取得
        .then((items) => {
            res.json(items); // JSON形式でアイテムを返す
        })
        .catch((error) => {
            res.status(500).json({ message: error }); // エラーメッセージをオブジェクト形式で返す
        });
});

// /categories ルート
app.get('/categories', (req, res) => {
    storeService.getCategories() // すべてのカテゴリを取得
        .then((categories) => {
            res.json(categories); // JSON形式でカテゴリを返す
        })
        .catch((error) => {
            res.status(500).json({ message: error }); // エラーメッセージをオブジェクト形式で返す
        });
});

// マッチしないルート
app.use((req, res) => {
    res.status(404).send('Page Not Found'); // 404エラーページを返す
});

// initialize()を呼び出してデータを読み込む
storeService.initialize()
    .then(() => {
        // サーバーを起動
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Error initializing data:", error); // エラーメッセージをコンソールに出力
    });
