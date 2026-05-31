const smallNumbers = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

export function numberToIndonesianWords(value: number): string {
  const n = Math.floor(Math.abs(value));

  if (n < 12) {
    return smallNumbers[n];
  }

  if (n < 20) {
    return `${numberToIndonesianWords(n - 10)} belas`;
  }

  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${numberToIndonesianWords(tens)} puluh${rest ? ` ${numberToIndonesianWords(rest)}` : ''}`;
  }

  if (n < 200) {
    return `seratus${n - 100 ? ` ${numberToIndonesianWords(n - 100)}` : ''}`;
  }

  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    return `${numberToIndonesianWords(hundreds)} ratus${rest ? ` ${numberToIndonesianWords(rest)}` : ''}`;
  }

  if (n < 2000) {
    return `seribu${n - 1000 ? ` ${numberToIndonesianWords(n - 1000)}` : ''}`;
  }

  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    return `${numberToIndonesianWords(thousands)} ribu${rest ? ` ${numberToIndonesianWords(rest)}` : ''}`;
  }

  if (n < 1000000000) {
    const millions = Math.floor(n / 1000000);
    const rest = n % 1000000;
    return `${numberToIndonesianWords(millions)} juta${rest ? ` ${numberToIndonesianWords(rest)}` : ''}`;
  }

  return n.toLocaleString('id-ID');
}

export function formatCurrencySpeech(amount: number): string {
  const numeric = Math.max(0, Math.floor(amount));
  if (!numeric) {
    return 'nol rupiah';
  }

  return `${numberToIndonesianWords(numeric)} rupiah`;
}
