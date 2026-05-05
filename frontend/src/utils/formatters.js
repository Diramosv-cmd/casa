
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL');
};
