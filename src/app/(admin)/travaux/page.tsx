'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { RepairsManagement } from '@/components/admin/RepairsManagement';

export default function TravauxPage() {
  const { travaux, biens, ajouterTravaux } = useAppStore();

  return (
    <div className="space-y-6">
      <RepairsManagement
        travaux={travaux}
        biens={biens}
        onAddTravaux={ajouterTravaux}
      />
    </div>
  );
}
