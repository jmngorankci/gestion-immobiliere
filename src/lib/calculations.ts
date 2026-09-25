import { TravauxReparation } from '@/types/database.types';

export interface RentBreakdown {
  loyerBase: number;
  travauxImputes: TravauxReparation[];
  totalTravauxImputes: number;
  montantTotalExige: number;
  commissionCabinet: number; // 10%
  montantReversableProprietaire: number; // 90%
}

/**
 * Calculates the exact rent for a given month considering imputed repairs.
 * Rule: Si une réparation est marquée `impute_au_loyer`, le montant du loyer à payer
 * pour le mois ciblé est automatiquement : Loyer de base + Coût réparation.
 */
export function calculateLoyerDuMois(
  loyerBase: number,
  reparations: TravauxReparation[] = []
): RentBreakdown {
  const travauxImputes = reparations.filter(
    (rep) => rep.imputation === 'impute_au_loyer'
  );

  const totalTravauxImputes = travauxImputes.reduce((sum, rep) => sum + (rep.cout || 0), 0);
  const montantTotalExige = loyerBase + totalTravauxImputes;

  // Split: 10% Cabinet / 90% Propriétaire
  const commissionCabinet = Math.round(montantTotalExige * 0.10);
  const montantReversableProprietaire = montantTotalExige - commissionCabinet;

  return {
    loyerBase,
    travauxImputes,
    totalTravauxImputes,
    montantTotalExige,
    commissionCabinet,
    montantReversableProprietaire,
  };
}

/**
 * Calculates 10% commission and 90% owner remittance.
 */
export function calculateCommissionSplit(totalPaye: number): {
  commissionCabinet: number;
  montantReversableProprietaire: number;
} {
  const commissionCabinet = Math.round(totalPaye * 0.10);
  const montantReversableProprietaire = totalPaye - commissionCabinet;

  return {
    commissionCabinet,
    montantReversableProprietaire,
  };
}

/**
 * Formats sequential receipt number (e.g. REC-2026-0042).
 */
export function formatReceiptNumber(year: number = 2026, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `REC-${year}-${padded}`;
}
