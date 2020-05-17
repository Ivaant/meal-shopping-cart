const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const priceGen = require(__dirname + '/lib/price-gen.js');
const initState = require(__dirname + '/lib/init-state.js');
const { Item, Cart } = require(__dirname + '/lib/Cart.js');
const port = process.env.PORT || 3000;

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
    uri: 'mongodb://localhost:27017/mealCartDB',
    collection: 'sessions'
});

app.use(session({
    secret: "This is a shopping cart application",
    resave: false,
    saveUninitialized: true,
    unset: 'destroy',
    store: store
}));

mongoose.connect("mongodb://localhost:27017/mealCartDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

app.get("/", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = new Cart();
    } else {
        req.session.cart = Cart.deserializeCart(req.session.cart);
    }
    console.log("inside get /", req.session.cart);
    res.render('index', {
        categoryNames: state.categoryNames,
        areaNames: state.areaNames,
        meals: state.meals,
        mealsTitle: state.mealsTitle
    });
});

app.get("/categories/:categoryName", (req, res) => {
    const categoryName = req.params.categoryName;
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/filter.php?c=" + categoryName;
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
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/filter.php?a=" + areaName;
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
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + mealID;
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
    console.log(req.body);

    res.redirect("/checkout");
});

app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});