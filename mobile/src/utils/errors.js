export function getApiErrorMessage(error, fallback = 'Ocorreu um erro inesperado.') {
  const data = error?.response?.data;

  if (!data) return fallback;

  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;

  const firstEntry = Object.entries(data)[0];
  if (!firstEntry) return fallback;

  const [field, value] = firstEntry;
  if (Array.isArray(value) && value.length) {
    return `${field}: ${value[0]}`;
  }
  if (typeof value === 'string') {
    return `${field}: ${value}`;
  }

  try {
    return JSON.stringify(data);
  } catch {
    return fallback;
  }
}