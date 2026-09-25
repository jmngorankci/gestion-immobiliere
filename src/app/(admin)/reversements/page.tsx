'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { OwnerRemittanceStatement } from '@/components/admin/OwnerRemittanceStatement';

export default function ReversementsPage() {
  const { proprietaires, biens, contrats, paiements, travaux } = useAppStore();

  return (
    <div className="space-y-6">
      <OwnerRemittanceStatement
        proprietaires={proprietaires}
        biens={biens}
        contrats={contrats}
        paiements={paiements}
        travaux={travaux}
      />
    </div>
  );
}
