export function calculateOrderTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function formatOrderStatus(status) {
  const labels = {
    pending: 'Pending',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
}
