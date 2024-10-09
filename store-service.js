const fs = require('fs').promises; // fsモジュールをPromise形式でインポート

let items = []; // アイテムを格納する配列
let categories = []; // カテゴリを格納する配列

// initialize()関数でitem.jsonからデータを読み込む
async function initialize() {
    try {
        const data = await fs.readFile('./data/items.json', 'utf8'); // items.jsonのデータを読み込む
        items = JSON.parse(data); // JSONをパースしてitemsに格納

        const categoriesData = await fs.readFile('./data/categories.json', 'utf8'); // categories.jsonのデータを読み込む
        categories = JSON.parse(categoriesData); // JSONをパースしてcategoriesに格納
    } catch (error) {
        console.error('Error reading data:', error);
        throw error; // エラーが発生したらthrow
    }
}

// publishedがtrueのアイテムを取得
async function getPublishedItems() {
    return items.filter(item => item.published); // publishedがtrueのアイテムをフィルタリング
}

// すべてのアイテムを取得
async function getAllItems() {
    return items; // すべてのアイテムを返す
}

// カテゴリを取得
async function getCategories() {
    return categories; // カテゴリを返す
}

// モジュールとしてエクスポート
module.exports = {
    initialize,
    getPublishedItems,
    getAllItems,
    getCategories
};
