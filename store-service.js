const fs = require('fs'); // fsモジュールをインポート

// グローバルにアイテムとカテゴリの配列を定義
let items = [];
let categories = [];

// initialize関数
function initialize() {
    return new Promise((resolve, reject) => {
        // items.jsonファイルを読み込む
        fs.readFile('./data/items.json', 'utf8', (err, data) => {
            if (err) {
                return reject("unable to read items file"); // エラー時にreject
            }
            items = JSON.parse(data); // JSONを配列に変換

            // categories.jsonファイルを読み込む
            fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                if (err) {
                    return reject("unable to read categories file"); // エラー時にreject
                }
                categories = JSON.parse(data); // JSONを配列に変換

                resolve(); // 成功時にresolve
            });
        });
    });
}

// getAllItems関数
function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            return reject("no results returned"); // アイテムがない場合にreject
        }
        resolve(items); // アイテムをresolve
    });
}

// getPublishedItems関数
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published); // publishedがtrueのアイテムをフィルター
        if (publishedItems.length === 0) {
            return reject("no results returned"); // アイテムがない場合にreject
        }
        resolve(publishedItems); // 公開アイテムをresolve
    });
}

// getCategories関数
function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            return reject("no results returned"); // カテゴリがない場合にreject
        }
        resolve(categories); // カテゴリをresolve
    });
}

// モジュールとしてエクスポート
module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
