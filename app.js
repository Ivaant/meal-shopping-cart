const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const priceGen = require(__dirname + '/lib/price-gen.js');
const initState = require(__dirname + '/lib/init-state.js');
const port = process.env.PORT || 3000;

let state;

(async() => {
    state = await initState();
})();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
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

app.get("/meals/:meal-id", (req, res) => {
    const mealID = req.params.meal - id;
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + mealID;
    axios.get(baseUrl)
        .then(mealItem => {
            console.log(mealItem);
            res.redirect("/");
        })
        .catch(error => console.log);
});

app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});