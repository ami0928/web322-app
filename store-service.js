const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'host',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});



// Item モデル
const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE,
    category: Sequelize.INTEGER  // 外部キーとしてカテゴリーIDを格納
});

// Category モデル
const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

// リレーションシップの設定
Item.belongsTo(Category, { foreignKey: 'category', targetKey: 'id' });


function deletePostById(id) {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: { id: id }
        })
        .then(result => {
            if (result === 0) { // No post found with the given ID
                reject("Post not found");
            } else {
                resolve("Post deleted successfully");
            }
        })
        .catch(error => {
            reject(error); // Reject promise if an error occurs
        });
    });
}
// initialize関数
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve('Database synced successfully.'))
            .catch(err => reject('Unable to sync the database: ' + err));
    });
};

// getAllItems関数
module.exports.getAllItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(() => reject('No results returned.'));
    });
};

// getItemsByCategory関数
module.exports.getItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { category: category } })
            .then(data => resolve(data))
            .catch(() => reject('No results returned.'));
    });
};

// getItemsByMinDate関数
module.exports.getItemsByMinDate = (minDateStr) => {
    const { gte } = Sequelize.Op;
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then(data => resolve(data))
            .catch(() => reject('No results returned.'));
    });
};

// getItemById関数
module.exports.getItemById = (id) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { id: id } })
            .then(data => resolve(data[0]))
            .catch(() => reject('No results returned.'));
    });
};

// addItem関数
module.exports.addItem = (itemData) => {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        for (let prop in itemData) {
            if (itemData[prop] === '') {
                itemData[prop] = null;
            }
        }
        itemData.postDate = new Date();

        // もしcategory名が渡されている場合、そのIDを取得して設定
        if (itemData.category) {
            Category.findOne({ where: { category: itemData.category } })
                .then(category => {
                    if (category) {
                        itemData.category = category.id; // IDに変換
                        Item.create(itemData)
                            .then(() => resolve('Item successfully created.'))
                            .catch(err => reject(`Unable to create item: ${err.message}`));
                    } else {
                        reject("Category not found.");
                    }
                })
                .catch(err => reject('Error fetching category: ' + err.message));
        } else {
            Item.create(itemData)
                .then(() => resolve('Item successfully created.'))
                .catch(err => reject(`Unable to create item: ${err.message}`));
        }
    });
};

// getPublishedItems関数
module.exports.getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true } })
            .then(data => resolve(data))
            .catch(() => reject('No results returned.'));
    });
};

// getPublishedItemsByCategory関数
module.exports.getPublishedItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true, category: category } })
            .then(data => resolve(data))
            .catch(() => reject('No results returned.'));
    });
};

// getCategories関数
module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(() => reject('No results returned.'));
    });
};

// addCategory関数
module.exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {
        // 空の値をnullに設定
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }

        // Category.createを呼び出してカテゴリーを追加
        Category.create(categoryData)
            .then(() => resolve('Category successfully created.'))
            .catch(err => reject("Unable to create category: " + err.message));
    });
};

// deleteCategoryById関数
module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        // IDでカテゴリーを削除
        Category.destroy({
            where: {
                id: id
            }
        })
        .then(deletedCount => {
            if (deletedCount > 0) {
                resolve(); // カテゴリーが削除された場合は成功
            } else {
                reject("Category not found or unable to delete.");
            }
        })
        .catch(err => {
            reject("Unable to delete category: " + err.message); // エラーメッセージ
        });
    });
};

// deleteItemById関数
module.exports.deleteItemById = (id) => {
    return new Promise((resolve, reject) => {
        // IDでアイテムを削除
        Item.destroy({
            where: { id: id }
        })
        .then(deletedCount => {
            if (deletedCount > 0) {
                resolve(); // アイテムが削除された場合は成功
            } else {
                reject("Item not found or unable to delete.");
            }
        })
        .catch(err => {
            reject("Unable to delete item: " + err.message); // エラーメッセージ
        });
    });
};

