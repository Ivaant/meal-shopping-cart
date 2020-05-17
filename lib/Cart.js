// function Item(id, image, title, price, qty) {
//     this.id = id;
//     this.image = image;
//     this.title = title;
//     this.price = price;
//     this.qty = qty;
// }

// Item.prototype.calcAmount = function() {
//     return this.qty * this.price;
// };

class Item {
    constructor(id, image, title, price, qty) {
        this.id = id;
        this.image = image;
        this.title = title;
        this.price = price;
        this.qty = qty;
    }

    setQty(qty) {
        const newQty = parseInt(qty, 10);
        if (newQty > 0) this.qty = newQty;
    }

    addQty(qty) {
        const newQty = parseInt(qty, 10);
        if (newQty > 0) this.qty += newQty;
    }

    calcAmount() {
        return this.qty * this.price;
    }

    getFormattedAmount() {
        return this.calcAmount().toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    getFormattedPrice() {
        return this.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
}

class Cart {
    constructor(items = [], total = 0.00, formattedTotal = '') {
        this.items = items;
        this.total = total;
        this.formattedTotal = formattedTotal;
    }

    getItemIndex(itemID) {
        return this.items.findIndex(item => item.id === itemID);
    }

    addItem(item) {
        const itemIndex = this.getItemIndex(item.id);
        if (itemIndex === -1) {
            this.items.push(item);
        } else {
            this.items[itemIndex].addQty(item.qty);
        }
        this.calculateTotal();
    }

    replaceItems(items) {
        this.items = items;
        this.calculateTotal();
    }

    deleteItem(itemID) {
        this.items = this.items.filter(item => item.id !== itemID);
        this.calculateTotal();
    }

    updateQty(itemID, newQty) {
        for (let item of this.items) {
            if (item.id === itemID) {
                item.setQty(newQty);
                break;
            }
        }
        this.calculateTotal();
    }

    calculateTotal() {
        this.total = this.items.reduce((acc, item) => {
            acc += item.calcAmount();
            return acc;
        }, 0);
        this.formattedTotal = this.formatTotal();
    }

    formatTotal() {
        return this.formattedTotal = this.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    clearAll() {
        this.items = [];
        this.total = 0.00;
        this.formattedTotal = "";
    }

    static deserializeCart(savedCart) {
        if (!savedCart) return new Cart();
        const items = savedCart.items.map(item => {
            return new Item(item.id, item.image, item.title, item.price, item.qty);
        });
        return new Cart(items, savedCart.total, savedCart.formattedTotal);
    }
}


module.exports = { Item, Cart };