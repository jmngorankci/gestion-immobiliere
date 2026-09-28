'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { PaymentValidationTable } from '@/components/admin/PaymentValidationTable';
import { NewPaymentModal } from '@/components/admin/NewPaymentModal';
import { CreditCard, PlusCircle } from 'lucide-react';

export default function EncaissementsPage() {
  const { paiements, validerPaiement, rejeterPaiement } = useAppStore();
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <CreditCard className="w-6 h-6 mr-2.5 text-emerald-600" />
            Gestion des Encaissements & Quittances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrez les nouveaux paiements et validez les règlements déclarés par les locataires (Wave, Orange Money, Virement, Espèces) pour émettre automatiquement les reçus officiels séquentiels REC-2026-XXXX avec QR Code.
          </p>
        </div>

        <button
          onClick={() => setShowNewPaymentModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          + Nouvel Encaissement
        </button>
      </div>

      <PaymentValidationTable
        paiements={paiements}
        onValidate={validerPaiement}
        onReject={rejeterPaiement}
      />

      <NewPaymentModal
        isOpen={showNewPaymentModal}
        onClose={() => setShowNewPaymentModal(false)}
      />
    </div>
  );
}

