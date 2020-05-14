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

app.use('/static', express.static("public"));
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

app.get("/meals/:mealID/index/:index", (req, res) => {
    const { mealID, index } = req.params;
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
                title: mealItem.strMeal,
                picture: mealItem.strMealThumb,
                meal: state.meals[index],
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

app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});