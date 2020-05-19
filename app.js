require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const priceGen = require(__dirname + '/lib/price-gen.js');
const initState = require(__dirname + '/lib/init-state.js');
const { Item, Cart } = require(__dirname + '/lib/Cart.js');
let port = process.env.PORT || 3000;

const { Customer } = require(__dirname + '/models/Customer.js');
const { Order } = require(__dirname + '/models/Order.js');
const { CartModel } = require(__dirname + '/models/CartModel.js');
const { ItemModel } = require(__dirname + '/models/ItemModel.js');

let state;

(async() => {
    state = await initState();
})();


const app = express();

app.set('view engine', 'ejs');

app.use('/static', express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const store = new MongoDBStore({
    uri: process.env.DB_URI,
    collection: 'sessions'
});

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    unset: 'destroy',
    store: store
}));

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const conn = mongoose.connection;
conn.on('error', () => console.log("Connection error"));
conn.once('open', () => console.log(`Connected successfully to ${conn.name}`));

app.get("/", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = new Cart();
    } else {
        req.session.cart = Cart.deserializeCart(req.session.cart);
    }
    res.render('index', {
        categoryNames: state.categoryNames,
        areaNames: state.areaNames,
        meals: state.meals,
        mealsTitle: state.mealsTitle
    });
});

app.get("/categories/:categoryName", (req, res) => {
    const categoryName = req.params.categoryName;
    const baseUrl = process.env.API_CAT_URL + categoryName;
    axios.get(baseUrl)
        .then(categoryMeals => {
            state.meals = categoryMeals.data.meals.map(meal => {
                meal.price = priceGen();
                return meal;
            });
            state.mealsTitle = categoryName;
            res.redirect("/");
        })
        .catch(error => console.log(error));
});

app.get("/areas/:areaName", (req, res) => {
    const areaName = req.params.areaName;
    const baseUrl = process.env.API_AREA_URL + areaName;
    axios.get(baseUrl)
        .then(areaMeals => {
            state.meals = areaMeals.data.meals.map(meal => {
                meal.price = priceGen();
                return meal;
            });
            state.mealsTitle = areaName;
            res.redirect("/");
        })
        .catch(error => console.log(error));
});

app.get("/meals/:mealID/price/:price", (req, res) => {
    const { mealID, price } = req.params;
    const baseUrl = process.env.API_MEAL_URL + mealID;
    axios.get(baseUrl)
        .then(mealData => {
            const mealItem = mealData.data.meals[0];
            const ingreds = [];
            for (let i = 1; i < 20; i++) {
                let ingredientField = 'strIngredient' + i;
                let measureField = 'strMeasure' + i;
                if (mealItem[ingredientField] !== '') {
                    ingreds.push({
                        ingredient: mealItem[ingredientField],
                        measure: mealItem[measureField]
                    });
                }
            }
            res.render('meal-page', {
                mealID: mealItem.idMeal,
                title: mealItem.strMeal,
                picture: mealItem.strMealThumb,
                price: price,
                recipe: mealItem.strInstructions,
                category: mealItem.strCategory,
                cuisine: mealItem.strArea,
                ingredients: ingreds,
                movie: mealItem.strYoutube,
                categoryNames: state.categoryNames,
                areaNames: state.areaNames
            });
        })
        .catch(error => console.log(error));
});

app.route("/cart")
    .get((req, res) => {
        res.render("cart-page", {
            categoryNames: state.categoryNames,
            areaNames: state.areaNames,
            cart: Cart.deserializeCart(req.session.cart)
        });
    })
    .post((req, res) => {
        const { qty, mealID, image, title, price } = req.body;
        const priceNum = parseFloat(price.slice(1));
        const qtyNum = parseInt(qty);
        const cartItem = new Item(mealID, image, title, priceNum, qtyNum);

        let cart = req.session.cart ? req.session.cart : null;
        if (cart) {
            cart = Cart.deserializeCart(cart);
            cart.addItem(cartItem);
            req.session.cart = cart;
        }
        res.redirect("/cart");
    })
    .put((req, res) => {
        res.redirect("/");
    });

app.get("/cart/:mealID", (req, res) => {
    const mealID = req.params.mealID;
    const cart = Cart.deserializeCart(req.session.cart);
    cart.deleteItem(mealID);
    req.session.cart = cart;
    res.redirect("/cart");
});

app.post("/cart/:mealID", (req, res) => {
    const mealID = req.params.mealID;
    const qty = req.body.qty;
    const cart = Cart.deserializeCart(req.session.cart);
    cart.updateQty(mealID, qty);
    req.session.cart = cart;
    res.redirect("/cart");
});
app.get("/checkout", (req, res) => {
    res.render("checkout-page", {
        categoryNames: state.categoryNames,
        areaNames: state.areaNames,
        totalAmount: req.session.cart.formattedTotal
    });
});

app.post("/checkout", (req, res) => {
    const { name, phoneNumber, email, deliveryType, paymentType } = req.body;

    const items = req.session.cart.items.map(item => {
        return new ItemModel({
            id: item.id,
            title: item.title,
            price: item.price,
            qty: item.qty,
            image: item.image
        });
    });
    const cart = new CartModel({
        items: items,
        total: req.session.cart.total,
        formattedTotal: req.session.cart.formattedTotal
    });

    Customer.findOne({ name: name, phone: phoneNumber }, (err, foundCustomer) => {
        if (err) console.log(err);
        else {
            if (!foundCustomer) {
                Customer.create({
                    name: name,
                    phone: phoneNumber,
                    email: email
                }, (err, newCustomer) => {
                    if (err) console.log(err);
                    else {
                        const newOrder = new Order({
                            customer: newCustomer,
                            cart: cart,
                            deliveryType: deliveryType,
                            paymentType: paymentType
                        });
                        newOrder.save()
                            .then(savedOrder => {
                                req.session.cart = new Cart();

                                (async() => {
                                    state = await initState();
                                })();

                                res.render("confirm-page", {
                                    categoryNames: state.categoryNames,
                                    areaNames: state.areaNames,
                                    orderNumber: savedOrder.orderNumber,
                                    formattedTotal: savedOrder.cart.formattedTotal
                                });
                            })
                            .catch(err => console.log("Error while saving newOrder"));
                    }
                });
            } else {
                const newOrder = new Order({
                    customer: foundCustomer,
                    cart: cart,
                    deliveryType: deliveryType,
                    paymentType: paymentType
                });
                newOrder.save()
                    .then(savedOrder => {
                        req.session.cart = new Cart();

                        (async() => {
                            state = await initState();
                        })();

                        res.render("confirm-page", {
                            categoryNames: state.categoryNames,
                            areaNames: state.areaNames,
                            orderNumber: savedOrder.orderNumber,
                            formattedTotal: savedOrder.cart.formattedTotal
                        });
                    })
                    .catch(err => console.log(err, "Error while saving newOrder with old Customer"));
            }
        }
    });
});

app.get("/admin/orders", (req, res) => {
    Order.find({}, (err, allOrders) => {
        const totalAmount = allOrders.reduce((all, order) => {
            return all += order.cart.total;
        }, 0);
        res.render("order-page", {
            categoryNames: state.categoryNames,
            areaNames: state.areaNames,
            orders: allOrders,
            totalAmount: totalAmount
        });
    });
});

app.get("/admin/customer/rating", (req, res) => {
    Order.find({}, (err, allOrders) => {
        const customerRating = {};
        allOrders.forEach(order => {
            const id = order.customer._id;
            let customer = customerRating[id];
            if (!customer) {
                customer = {
                    name: order.customer.name,
                    phone: order.customer.phone,
                    ordersCount: 1,
                    ordersTotal: order.cart.total
                };
                customerRating[id] = customer;
            } else {
                customer.ordersCount++;
                customer.ordersTotal += order.cart.total;
            }
        });
        const customerTotals = Object.values(customerRating);
        customerTotals.sort((a, b) => {
            return b.ordersTotal - a.ordersTotal;
        });
        res.render("customer-rating", {
            categoryNames: state.categoryNames,
            areaNames: state.areaNames,
            customerRating: customerTotals
        });
    });
});
app.get("/admin/meal/rating", (req, res) => {
    Order.find({}, (err, allOrders) => {
        const mealRating = {};
        allOrders.forEach(order => {
            order.cart.items.forEach(item => {
                const id = item._id;
                let meal = mealRating[id];
                if (!meal) {
                    meal = {
                        image: item.image,
                        title: item.title,
                        qty: item.qty,
                        ordersTotal: item.price * item.qty
                    };
                    mealRating[id] = meal;
                } else {
                    meal.qty += item.qty;
                    meal.ordersTotal += (item.price * item.qty);
                }
            });
        });

        const mealTotals = Object.values(mealRating);
        mealTotals.sort((a, b) => {
            return b.ordersTotal - a.ordersTotal;
        });
        res.render("meal-rating", {
            categoryNames: state.categoryNames,
            areaNames: state.areaNames,
            mealRating: mealTotals
        });
    });

});

app.get("/about", (req, res) => {
    res.render("about", {
        categoryNames: state.categoryNames,
        areaNames: state.areaNames
    });
});

app.get("/contact", (req, res) => {
    res.render("contact", {
        categoryNames: state.categoryNames,
        areaNames: state.areaNames
    });
});

app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});