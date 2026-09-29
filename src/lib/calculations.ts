import { TravauxReparation } from '@/types/database.types';

export interface RentBreakdown {
  loyerBase: number;
  travauxImputes: TravauxReparation[];
  totalTravauxImputes: number;
  montantTotalExige: number;
  commissionCabinet: number;
  montantReversableProprietaire: number;
  tauxCommission: number;
}

/**
 * Calculates the exact rent for a given month considering imputed repairs and lease-specific commission rate.
 */
export function calculateLoyerDuMois(
  loyerBase: number,
  reparations: TravauxReparation[] = [],
  tauxCommission: number = 10
): RentBreakdown {
  const travauxImputes = reparations.filter(
    (rep) => rep.imputation === 'impute_au_loyer'
  );

  const totalTravauxImputes = travauxImputes.reduce((sum, rep) => sum + (rep.cout || 0), 0);
  const montantTotalExige = loyerBase + totalTravauxImputes;

  // Split: Variable % Cabinet / (100 - %) Propriétaire
  const rate = typeof tauxCommission === 'number' && tauxCommission >= 0 ? tauxCommission : 10;
  const commissionCabinet = Math.round(montantTotalExige * (rate / 100));
  const montantReversableProprietaire = montantTotalExige - commissionCabinet;

  return {
    loyerBase,
    travauxImputes,
    totalTravauxImputes,
    montantTotalExige,
    commissionCabinet,
    montantReversableProprietaire,
    tauxCommission: rate,
  };
}

/**
 * Calculates variable commission and owner remittance based on custom rate (default 10%).
 */
export function calculateCommissionSplit(
  totalPaye: number,
  tauxCommission: number = 10
): {
  commissionCabinet: number;
  montantReversableProprietaire: number;
  tauxCommission: number;
} {
  const rate = typeof tauxCommission === 'number' && tauxCommission >= 0 ? tauxCommission : 10;
  const commissionCabinet = Math.round(totalPaye * (rate / 100));
  const montantReversableProprietaire = totalPaye - commissionCabinet;

  return {
    commissionCabinet,
    montantReversableProprietaire,
    tauxCommission: rate,
  };
}

/**
 * Formats sequential receipt number (e.g. REC-2026-0042).
 */
export function formatReceiptNumber(year: number = 2026, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `REC-${year}-${padded}`;
}
