'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import { Building2, Plus, MapPin, User, CheckCircle2, XCircle } from 'lucide-react';

export default function BiensPage() {
  const { biens, proprietaires, contrats } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Building2 className="w-6 h-6 mr-2.5 text-emerald-600" />
            Parc Immobilier & Baux en Gestion
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consultez le statut d'occupation, les caractéristiques des biens et les propriétaires bailleurs associés.
          </p>
        </div>
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {biens.map((bien) => {
          const prop = proprietaires.find((p) => p.id === bien.proprietaire_id);
          const activeLease = contrats.find((c) => c.bien_id === bien.id && c.statut === 'actif');

          return (
            <div
              key={bien.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
            >
              {bien.photos_urls?.[0] && (
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={bien.photos_urls[0]}
                    alt={bien.code_reference}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white">
                    {bien.code_reference}
                  </div>
                  <div className="absolute top-3 right-3">
                    {bien.est_occupe ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
                        Occupé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow">
                        Disponible
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{bien.commune_quartier}</h3>
                  <p className="text-xs text-slate-500 flex items-center mt-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {bien.adresse_precise}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{bien.description}</p>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loyer mensuel :</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatFCFA(bien.loyer_mensuel_reference)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bailleur :</span>
                    <span className="font-semibold text-slate-800">{prop?.nom_complet || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs flex justify-between items-center text-slate-500">
                <span>Type : <strong className="capitalize text-slate-800">{bien.type_bien.replace('_', ' ')}</strong></span>
                {activeLease && <span className="text-emerald-700 font-semibold">Bail actif</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
