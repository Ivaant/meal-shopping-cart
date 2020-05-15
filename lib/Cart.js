'use strict';

class Item {
    constructor(id, image, title, price, qty) {
        this.id = id;
        this.image = image;
        this.title = title;
        this.price = price;
        this.qty = qty;
    }
    calcAmount() {
        return this.qty * this.price;
    }
}

class Cart {
    // constructor() {
    //     this.items = [];
    //     this.total = 0.00;
    //     this.formattedTotal = "";
    // }

    static addItem(item, cart) {
        cart.items.push(item);
        this.calculateTotal(cart);
    }

    static replaceItems(items, cart) {
        cart.items = items;
        this.calculateTotal(cart);
    }

    static deleteItem(itemID, cart) {
        cart.items = cart.items.filter(item => item.id !== itemID);
        this.calculateTotal(cart);
    }

    static calculateTotal(cart) {
        cart.total = cart.items.reduce((acc, item) => {
            acc += item.calcAmount();
            return acc;
        }, 0);
        cart.formattedTotal = this.formatTotal(cart);
    }

    static formatTotal(cart) {
        cart.formattedTotal = cart.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    clearAll(cart) {
        cart.items = [];
        cart.total = 0.00;
        cart.formattedTotal = "";
    }
}

module.exports = { Item, Cart };