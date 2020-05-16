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

module.exports = { Item };