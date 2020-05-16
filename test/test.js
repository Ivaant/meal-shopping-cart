const { Item } = require('./Item.js');

const meal = new Item(1, "img", "Soup", 2.55, 3);

console.log(meal.calcAmount());