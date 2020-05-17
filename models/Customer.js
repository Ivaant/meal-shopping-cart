const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, `Field "name" is required.`]
    },
    phone: {
        type: Number,
        unique: true,
        required: [true, `Field "phone" is required.`]
    },
    email: String,
    date: { type: Date, default: Date.now }
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = { Customer, customerSchema };