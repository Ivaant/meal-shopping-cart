const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: [true, `Field "id" is required.`]
    },
    title: {
        type: String,
        required: [true, `Field "title" is required.`]
    },
    price: Number,
    qty: Number,
    image: String
});

const ItemModel = mongoose.model("Item", itemSchema);
module.exports = { ItemModel, itemSchema };