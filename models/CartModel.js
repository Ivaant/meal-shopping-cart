const mongoose = require('mongoose');
const { itemSchema } = require('./ItemModel.js');

const cartSchema = new mongoose.Schema({
    items: [itemSchema],
    total: Number,
    formattedTotal: String
});

const CartModel = mongoose.model("Cart", cartSchema);
module.exports = { CartModel, cartSchema };