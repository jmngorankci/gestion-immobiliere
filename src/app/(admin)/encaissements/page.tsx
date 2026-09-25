'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { PaymentValidationTable } from '@/components/admin/PaymentValidationTable';
import { CreditCard, ShieldCheck } from 'lucide-react';

export default function EncaissementsPage() {
  const { paiements, validerPaiement, rejeterPaiement } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <CreditCard className="w-6 h-6 mr-2.5 text-emerald-600" />
            Gestion des Encaissements & Quittances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Validez les règlements déclarés par les locataires (Wave, Orange Money, Virement, Espèces) pour émettre automatiquement les reçus officiels séquentiels REC-2026-XXXX avec QR Code.
          </p>
        </div>
      </div>

      <PaymentValidationTable
        paiements={paiements}
        onValidate={validerPaiement}
        onReject={rejeterPaiement}
      />
    </div>
  );
}
