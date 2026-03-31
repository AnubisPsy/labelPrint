/**
 * Formatea un precio con separador de miles y dos decimales.
 * Ejemplo: 21562.87 → "L. 21,562.87"
 */
export function formatPrice(amount: number, currency = 'L.'): string {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency} ${parts[0]}.${parts[1]}`;
}