import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatDateFR(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatMonthYearFR(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Converts a number to French words for official legal receipts.
 */
export function numberToFrenchWords(num: number): string {
  if (num === 0) return 'Zéro';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  function convertBelowThousand(n: number): string {
    let result = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundred > 0) {
      if (hundred === 1) {
        result += 'cent ';
      } else {
        result += units[hundred] + ' cent ';
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += units[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;
        
        if (ten === 7) {
          result += 'soixante-' + (unit === 1 ? 'et-onze' : teens[unit]);
        } else if (ten === 9) {
          result += 'quatre-vingt-' + teens[unit];
        } else if (ten === 8 && unit === 0) {
          result += 'quatre-vingts';
        } else {
          result += tens[ten] + (unit === 1 ? ' et un' : (unit > 0 ? '-' + units[unit] : ''));
        }
      }
    }

    return result.trim();
  }

  if (num < 1000) {
    return capitalizeFirstLetter(convertBelowThousand(num));
  }

  const million = Math.floor(num / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const rest = num % 1000;

  let words = '';

  if (million > 0) {
    words += (million === 1 ? 'un million ' : convertBelowThousand(million) + ' millions ');
  }

  if (thousand > 0) {
    words += (thousand === 1 ? 'mille ' : convertBelowThousand(thousand) + ' mille ');
  }

  if (rest > 0) {
    words += convertBelowThousand(rest);
  }

  return capitalizeFirstLetter(words.trim()) + ' Francs CFA';
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
