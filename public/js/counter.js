'use strict';

const counter = {
	quantity: () => {
		let qtyWrap = document.querySelectorAll('.qty-wrap');
		if (qtyWrap.length > 0) {
			for (let qty of qtyWrap) {
				let minus = qty.querySelector('.qty-minus');
				let plus = qty.querySelector('.qty-plus');
				let input = qty.querySelector('.qty');
				let value = parseInt(input.value, 10);

				plus.addEventListener('click', () => {
					value = value + 1;
					input.value = value;
				});

				minus.addEventListener('click', () => {
					value = (value > 1) ? (value - 1) : 1;
					input.value = value;
				});

			}
		}
	}
};

document.addEventListener('DOMContentLoaded', () => {
	counter.quantity();
	console.log("counter connected!");
});