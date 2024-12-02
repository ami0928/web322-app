/*********************************************************************************

WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Ami Yamada 
Student ID: 159621226 
Date: Nov.21
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
const exphbs = require('express-handlebars');
const expressHandlebars = require('express-handlebars');
const handlebars = expressHandlebars.create().handlebars;
const storeService = require('./store-service'); 

app.use(express.urlencoded({ extended: true }));

app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

cloudinary.config({
    cloud_name: 'dwffbl9mq',
    api_key: '829141384638156',
    api_secret: 'k6Mbf0Z_bpwEIgoNFerqfkKbXfA',
    secure: true
});

app.use(function(req, res, next) {
    let route = req.path.substring(1); // パスの最初のスラッシュを削除
    // ルートにカテゴリIDが含まれている場合、それを除去
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    // クエリパラメータの category を保存
    app.locals.viewingCategory = req.query.category;
    next();
});
// アイテムを追加するPOSTリクエストを処理
router.post('/add', (req, res) => {
    // 画像がアップロードされる場合の処理
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
            // Cloudinaryへのアップロード後、画像URLを取得
            processItem(uploaded.secure_url);
        }).catch((error) => {
            console.error("Error uploading to Cloudinary:", error);
            res.status(500).send("Error uploading image.");
        });
    } else {
        // 画像がない場合は空のURLを渡す
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl; // 画像URLを設定

        // アイテムをデータベースに保存
        const newItem = new Item(req.body); // req.bodyから新しいアイテムを作成

        newItem.save() // アイテムを保存
            .then(() => {
                // アイテムが追加された後、リダイレクト
                res.redirect('/items');
            })
            .catch((error) => {
                console.error("Error saving item to database:", error);
                res.status(500).send("Error saving item.");
            });
    }
});

router.get('/items/delete/:id', (req, res) => {
    const postId = req.params.id;

    storeService.deletePostById(postId)
        .then(() => {
            res.redirect('/items'); // 削除後にアイテム一覧ページにリダイレクト
        })
        .catch((error) => {
            console.error("ポスト削除エラー:", error);
            res.status(500).send("ポストの削除に失敗しました / ポストが見つかりません");
        });
});


// データファイルのパスを設定
const itemsFilePath = './items.json';
const categoriesFilePath = './categories.json';

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
app.get("/shop", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
  
    try {
      // declare empty array to hold "item" objects
      let items = [];
  
      // if there's a "category" query, filter the returned items by category
      if (req.query.category) {
        // Obtain the published "item" by category
        items = await itemData.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published "items"
        items = await itemData.getPublishedItems();
      }
  
      // sort the published items by itemDate
      items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
  
      // get the latest item from the front of the list (element 0)
      let item = items[0];
  
      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;
      viewData.item = item;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();
  
      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
  });

  app.get('/shop/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
  
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned items by category
        if(req.query.category){
            // Obtain the published "items" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "items"
            items = await itemData.getPublishedItems();
        }
  
        // sort the published items by itemDate
        items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
  });
  

  app.get('/items', async (req, res) => {
    try {
        let filteredItems;

        if (req.query.category) {
            filteredItems = await getItemsByCategory(req.query.category);
        } else if (req.query.minDate) {
            filteredItems = await getItemsByMinDate(req.query.minDate);
        } else {
            filteredItems = await getAllItems();
        }

        if (filteredItems.length > 0) {
            res.render("items", { items: filteredItems });
        } else {
            res.render("items", { message: "no results" });
        }
    } catch (error) {
        console.error('Error retrieving items:', error);
        res.render("items", { message: "no results" });
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
    res.render('addPost'); 
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
        const allCategories = await getAllCategories();

        if (allCategories.length > 0) {
            res.render("categories", { categories: allCategories });
        } else {
            res.render("categories", { message: "no results" });
        }
    } catch (error) {
        console.error('Error retrieving categories:', error);
        res.render("categories", { message: "no results" });
    }
});



app.get('/', (req, res) => {
    res.redirect('/about');
});

// Aboutページを追加
app.get('/about', (req, res) => {
    res.render('about');
});

// サーバーを起動し、データの初期化を行う
initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Error initializing data:', error);
});


handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if (lvalue != rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});

// `navLink` ヘルパーを登録
handlebars.registerHelper('navLink', function (url, options) {
    return (
        '<li class="nav-item"><a ' +
        (url == app.locals.activeRoute
            ? ' class="nav-link active"'
            : ' class="nav-link"') +
        ' href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
    );
});

app.use((req, res, next) => {
    res.status(404).render('404');  // 404.hbsを表示
});

app.get('/', (req, res) => {
    res.redirect('/shop');
});

const hbs = exphbs.create({
    helpers: {
        formatDate: function(dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
});

app.get('/items/add', (req, res) => {
    res.render("addItem"); // "addItem.hbs" を表示
});

// 新規ルート /categories/add
app.get('/categories/add', (req, res) => {
    res.render("addCategory"); // "addCategory.hbs" を表示
});

app.post('/categories/add', (req, res) => {
    const categoryData = req.body;  // フォームから送信されたデータを取得
    storeService.addCategory(categoryData)  // store-serviceのaddCategory関数を呼び出し
        .then(() => {
            res.redirect('/categories');  // カテゴリーの一覧ページへリダイレクト
        })
        .catch(err => {
            res.status(500).send("Unable to create category: " + err);  // エラーメッセージを表示
        });
});


app.get('/categories/delete/:id', (req, res) => {
    const categoryId = req.params.id;  // URLパラメータからカテゴリーIDを取得
    storeService.deleteCategoryById(categoryId)  // store-serviceのdeleteCategoryById関数を呼び出し
        .then(() => {
            res.redirect('/categories');  // 削除後、カテゴリー一覧ページへリダイレクト
        })
        .catch(err => {
            res.status(500).send("Unable to remove category / Category not found");  // エラーメッセージを表示
        });
});

app.get('/Items/delete/:id', (req, res) => {
    const itemId = req.params.id;  // URLパラメータからアイテムIDを取得
    storeService.deleteItemById(itemId)  // store-serviceのdeleteItemById関数を呼び出し
        .then(() => {
            res.redirect('/Items');  // 削除後、アイテム一覧ページへリダイレクト
        })
        .catch(err => {
            res.status(500).send("Unable to remove item / Item not found");  // エラーメッセージを表示
        });
});
