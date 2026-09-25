'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  Wrench,
  Wallet,
  LogOut,
  ShieldCheck,
  Bell,
  Menu,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, paiements, profiles, deconnexion, reinitialiserDonnees } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingCount = paiements.filter((p) => p.statut === 'en_attente').length;

  const navItems = [
    {
      label: 'Tableau de Bord',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Encaissements & Validation',
      href: '/encaissements',
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: 'Parc Immobilier & Baux',
      href: '/biens',
      icon: Building2,
    },
    {
      label: 'Travaux & Imputations',
      href: '/travaux',
      icon: Wrench,
    },
    {
      label: 'Bordereaux Reversement',
      href: '/reversements',
      icon: Wallet,
    },
    {
      label: 'Attribution des Accès',
      href: '/utilisateurs',
      icon: Users,
      badge: profiles.length > 0 ? profiles.length : null,
    },
  ];

  const handleLogout = () => {
    deconnexion();
    router.push('/auth/cabinet');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-950 text-slate-100 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white uppercase">
                Cabinet Ivoire Immo
              </h1>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                Espace Gestionnaire
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      item.href === '/encaissements'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Authentication */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt="Admin"
                className="w-9 h-9 rounded-full border border-emerald-500/50 object-cover shrink-0"
              />
              <div className="overflow-hidden">
                <p className="font-bold text-xs text-white truncate">{currentUser?.nom_complet || 'Administrateur'}</p>
                <p className="text-[10px] text-emerald-400 uppercase font-semibold capitalize">
                  {currentUser?.role?.replace('_', ' ') || 'Super Admin'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/utilisateurs"
              className="flex-1 text-center py-2 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition"
            >
              + Attribuer un Accès
            </Link>
            <button
              onClick={reinitialiserDonnees}
              className="p-2 text-slate-400 hover:text-amber-400 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
              title="Réinitialiser les données de démo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden bg-slate-950 text-white p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <Building2 className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-sm uppercase">Cabinet Ivoire Immo</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleLogout}
            className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg text-xs"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 text-white p-4 border-b border-slate-800 space-y-2 z-40">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800"
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-center p-3 rounded-xl text-xs font-bold text-rose-400 bg-slate-900"
          >
            Se déconnecter de l'Espace Cabinet
          </button>
        </div>
      )}

      {/* Main App Content View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
