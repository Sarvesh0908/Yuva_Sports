export function throwIfError(error) {
  if (error) throw error;
}

export function safeSearchTerm(value = '') {
  return String(value).trim().replace(/[(),]/g, ' ');
}

export function istDayBounds(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function istDateKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export function toBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function sum(rows, selector = row => row.amount) {
  return (rows || []).reduce((total, row) => total + (Number(selector(row)) || 0), 0);
}

export function countByAndSum(rows, keyName, amountName = 'amount') {
  const map = new Map();
  for (const row of rows || []) {
    const key = row[keyName] ?? 'इतर';
    const current = map.get(key) || { [keyName]: key, count: 0, total_amount: 0 };
    current.count += 1;
    current.total_amount += Number(row[amountName]) || 0;
    map.set(key, current);
  }
  return [...map.values()];
}
