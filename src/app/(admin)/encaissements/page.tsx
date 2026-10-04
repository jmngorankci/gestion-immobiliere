'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { PaymentValidationTable } from '@/components/admin/PaymentValidationTable';
import { NewPaymentModal } from '@/components/admin/NewPaymentModal';
import { SalesPaymentsManagement } from '@/components/admin/SalesPaymentsManagement';
import { CreditCard, PlusCircle, Building2, Briefcase } from 'lucide-react';

export default function EncaissementsPage() {
  const { paiements, validerPaiement, rejeterPaiement } = useAppStore();
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'loyers' | 'ventes'>('loyers');

  return (
    <div className="space-y-6">
      {/* Top Header Navigation Tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <CreditCard className="w-6 h-6 mr-2.5 text-emerald-600" />
            Gestion des Encaissements & Règlements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des encaissements locatifs et des règlements de transactions de vente avec émission de reçus sécurisés par QR Code.
          </p>
        </div>

        {activeTab === 'loyers' && (
          <button
            onClick={() => setShowNewPaymentModal(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            + Nouvel Encaissement Loyer
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-6 pt-3 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('loyers')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center ${
            activeTab === 'loyers'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Encaissements Locatifs (Baux)
        </button>
        <button
          onClick={() => setActiveTab('ventes')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center ${
            activeTab === 'ventes'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Encaissements des Ventes
        </button>
      </div>

      {/* Tab 1: Loyers */}
      {activeTab === 'loyers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
      )}

      {/* Tab 2: Ventes */}
      {activeTab === 'ventes' && (
        <div className="animate-in fade-in duration-200">
          <SalesPaymentsManagement />
        </div>
      )}
    </div>
  );
}

