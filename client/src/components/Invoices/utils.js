
export const CURRENCY = '₹';

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const calculateLineItemAmount = (quantity, rate) => {
    return quantity * rate;
};

export const calculateSubtotal = (items) => {
    return items.reduce((acc, item) => acc + (item.amount || 0), 0);
};

export const calculateTotal = (subtotal, discount, tax, shipping) => {
    let total = subtotal;

    if (discount.type === 'percentage') {
        total -= (subtotal * (discount.value / 100));
    } else {
        total -= discount.value;
    }

    if (tax.type === 'percentage') {
        total += (total * (tax.value / 100)); // Tax usually applied after discount
    } else {
        total += tax.value;
    }

    total += shipping;
    return Math.max(0, total); // Ensure total is not negative
};
