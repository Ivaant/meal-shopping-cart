const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const { customerSchema } = require('./Customer.js');
const { cartSchema } = require('./CartModel.js');

const connection = mongoose.createConnection("mongodb://localhost:27017/mealCartDB", { useNewUrlParser: true, useUnifiedTopology: true });
autoIncrement.initialize(connection);

const orderSchema = new mongoose.Schema({
    orderNumber: Number,
    customer: customerSchema,
    cart: cartSchema,
    deliveryType: String,
    paymentType: String,
    date: { type: Date, default: Date.now }
});

//autoincrement code here
orderSchema.plugin(autoIncrement.plugin, {
    model: 'Order',
    field: 'orderNumber',
    startAt: 100,
    incrementBy: 13
});

const Order = mongoose.model("Order", orderSchema);
module.exports = { Order };