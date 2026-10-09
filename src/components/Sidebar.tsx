import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Boxes, 
  FileSpreadsheet, 
  Factory
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'fase1' | 'fase2' | 'report';
  setActiveTab: (tab: 'dashboard' | 'fase1' | 'fase2' | 'report') => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, lowStockCount }) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? lowStockCount : null,
    },
    {
      id: 'fase1' as const,
      label: 'Perencanaan',
      icon: CalendarRange,
    },
    {
      id: 'fase2' as const,
      label: 'Mutasi Stok',
      icon: Boxes,
    },
    {
      id: 'report' as const,
      label: 'Laporan',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-[#e5e5ea] flex flex-col shrink-0 min-h-screen sticky top-0 h-screen">
      
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#f2f2f7]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#34c759] text-white flex items-center justify-center">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[#1d1d1f]">
              Mortar<span className="text-[#34c759]">Flow</span>
            </div>
            <div className="text-[11px] text-[#86868b]">Pabrik Mortar</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#34c759] text-white font-semibold shadow-xs'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#86868b]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-[#34c759]' : 'bg-[#ff9500]/15 text-[#ff9500]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 8 Material Satuan Summary */}
        <div className="px-2 pt-2">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-[#86868b] mb-2">
            Material & Satuan
          </div>
          <div className="bg-[#f5f5f7] rounded-xl p-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-[#1d1d1f]">
              <span className="text-[#86868b]">Kapur 150 & 200</span>
              <span className="font-mono font-medium text-[#34c759]">Ton</span>
            </div>
            <div className="flex justify-between text-[#1d1d1f]">
              <span className="text-[#86868b]">Additive Nexco & W.</span>
              <span className="font-mono font-medium text-[#34c759]">Kg</span>
            </div>
            <div className="flex justify-between text-[#1d1d1f]">
              <span className="text-[#86868b]">Pasir Silika</span>
              <span className="font-mono font-medium text-[#34c759]">Kg</span>
            </div>
            <div className="flex justify-between text-[#1d1d1f]">
              <span className="text-[#86868b]">Semen PCC</span>
              <span className="font-mono font-medium text-[#34c759]">Ton</span>
            </div>
            <div className="flex justify-between text-[#1d1d1f]">
              <span className="text-[#86868b]">Woven & Paper</span>
              <span className="font-mono font-medium text-[#34c759]">Pcs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-[#f2f2f7]">
        <div className="flex items-center gap-2 text-xs text-[#86868b] px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-[#34c759]"></span>
          <span>Pabrik Aktif</span>
        </div>
      </div>

    </aside>
  );
};
