import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Boxes, 
  FileSpreadsheet, 
  Factory 
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'fase1' | 'fase2' | 'report';
  setActiveTab: (tab: 'dashboard' | 'fase1' | 'fase2' | 'report') => void;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lowStockCount }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-700 flex items-center justify-center text-white">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  MORTAR<span className="text-emerald-700">FLOW</span>
                </span>
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  Pabrik Mortar
                </span>
              </div>
              <p className="text-xs text-slate-500">Sistem Monitoring Produksi & Stok</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fase1')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'fase1'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Fase 1: Rencana Bulanan</span>
            </button>

            <button
              onClick={() => setActiveTab('fase2')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'fase2'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Fase 2: Input Stok & Riwayat</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'report'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Laporan</span>
            </button>
          </nav>

          {/* Plant status indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Status: Operasional Aktif</span>
          </div>

        </div>
      </div>
    </header>
  );
};
