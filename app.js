const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const priceGen = require(__dirname + '/lib/price-gen.js');
const port = process.env.PORT || 3000;

const state = {
    categoryNames: [],
    areaNames: [],
    meals: [],
    mealsTitle: ""
};

const app = express();

app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    axios.all([
            axios.get("https://www.themealdb.com/api/json/v1/1/list.php?c=list"),
            axios.get("https://www.themealdb.com/api/json/v1/1/list.php?a=list"),
            axios.get("https://www.themealdb.com/api/json/v1/1/filter.php?c=Miscellaneous")
        ])
        .then(axios.spread((categories, areas, miscCategory) => {
            state.categoryNames = categories.data.meals;
            state.areaNames = areas.data.meals;
            if (state.meals.length === 0) {
                state.meals = miscCategory.data.meals.map(meal => {
                    meal.price = priceGen();
                    return meal;
                });
                state.mealsTitle = 'Chef Recommendations';
            } else {
                state.meals = state.meals.map(meal => {
                    meal.price = priceGen();
                    return meal;
                });
            }

            res.render('index', {
                categoryNames: state.categoryNames,
                areaNames: state.areaNames,
                meals: state.meals,
                mealsTitle: state.mealsTitle
            });
        }))
        .catch(error => console.log(error));
});

app.get("/categories/:categoryName", (req, res) => {
    const categoryName = req.params.categoryName;
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/filter.php?c=" + categoryName;
    axios.get(baseUrl)
        .then(categoryMeals => {
            state.meals = categoryMeals.data.meals;
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
            state.meals = areaMeals.data.meals;
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