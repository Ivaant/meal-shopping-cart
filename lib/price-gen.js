const priceGen = (maxPrice = 10) => {
    const price = Math.random() * maxPrice + 1;
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

module.exports = priceGen;