const axios = require('axios');
const priceGen = require('./price-gen.js');

initState = async() => {
    const state = {
        categoryNames: [],
        areaNames: [],
        meals: [],
        mealsTitle: ""
    };

    try {
        const categories = await axios.get("https://www.themealdb.com/api/json/v1/1/list.php?c=list");
        const areas = await axios.get("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
        const miscCategory = await axios.get("https://www.themealdb.com/api/json/v1/1/filter.php?c=Miscellaneous");
        state.categoryNames = categories.data.meals;
        state.areaNames = areas.data.meals;
        state.meals = miscCategory.data.meals.map(meal => {
            meal.price = priceGen();
            return meal;
        });
        state.mealsTitle = 'Chef Recommendations';
        return state;
    } catch (error) {
        console.log(error);
    }
}

module.exports = initState;