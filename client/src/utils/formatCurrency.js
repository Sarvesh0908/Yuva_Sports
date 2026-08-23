export function formatCurrency(amount = 0, showSymbol = true) {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  return showSymbol ? `₹ ${formatted}` : formatted;
}

export function formatCompactNumber(num = 0) {
  const n = Number(num) || 0;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} K`;
  return `${n}`;
}
