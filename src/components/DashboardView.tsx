import React, { useState } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { DashboardData } from '../types';

interface DashboardViewProps {
  data: DashboardData;
  onRefresh: () => void;
  onNavigateToFase2: () => void;
  onNavigateToFase1: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  data, 
  onRefresh, 
  onNavigateToFase2,
  onNavigateToFase1 
}) => {
  const { kpi, materials, lowStockMaterials, activePlan, recentTransactions } = data;
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || 'mat-1');

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];
  const selectedPlanItem = activePlan?.materialsPlan?.find(m => m.materialId === selectedMaterial?.id);

  // Big focus card metrics: Planning vs Real Stok
  const focusPlanning = Number(selectedPlanItem?.estimasi) || 0;
  const focusAktual = Number(selectedMaterial?.currentStock) || 0;
  const focusMax = Math.max(focusPlanning, focusAktual, 0.0001);
  const focusPlanPct = focusPlanning > 0 ? Math.round((focusPlanning / focusMax) * 100) : 0;
  const focusActPct = focusAktual > 0 ? Math.round((focusAktual / focusMax) * 100) : 0;
  const focusDiff = Math.round((focusAktual - focusPlanning) * 100) / 100;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Dashboard
          </h1>
          <span className="text-xs text-[#86868b]">
            Periode: <strong className="text-[#1d1d1f]">{activePlan?.monthName || 'Oktober 2026'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-full bg-white hover:bg-[#f5f5f7] text-[#86868b] border border-black/[0.06] transition-all"
            title="Segarkan data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToFase2}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#34c759] hover:bg-[#2fb350] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Stok</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Material */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium">Material Utama</span>
            <Package className="w-4 h-4 text-[#34c759]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#1d1d1f] font-mono">
              {materials.length}
            </span>
            <span className="text-xs text-[#86868b]">Item Terpantau</span>
          </div>
          <div className="mt-3">
            <button 
              onClick={onNavigateToFase1} 
              className="text-xs text-[#34c759] hover:underline font-semibold"
            >
              Atur Planning Bulanan
            </button>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium">Stok Menipis</span>
            {lowStockMaterials.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-[#ff9500]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${lowStockMaterials.length > 0 ? 'text-[#ff9500]' : 'text-[#34c759]'}`}>
              {lowStockMaterials.length}
            </span>
            <span className="text-xs text-[#86868b]">material kritis</span>
          </div>
          <div className="mt-3 text-xs text-[#86868b] truncate">
            {lowStockMaterials.length > 0 
              ? `${lowStockMaterials.length} item perlu restock`
              : 'Semua stok aman'}
          </div>
        </div>

        {/* Total Masuk */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium">Stok Masuk</span>
            <ArrowUpRight className="w-4 h-4 text-[#34c759]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#1d1d1f] font-mono">
              {kpi.totalMasukBulanIni}
            </span>
            <span className="text-xs text-[#86868b]">Transaksi Penerimaan</span>
          </div>
          <div className="mt-3">
            <button 
              onClick={onNavigateToFase2} 
              className="text-xs text-[#34c759] hover:underline font-semibold"
            >
              Input Penerimaan
            </button>
          </div>
        </div>

        {/* Total Keluar / Pemakaian */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium">Stok Keluar</span>
            <ArrowDownRight className="w-4 h-4 text-[#86868b]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#1d1d1f] font-mono">
              {kpi.totalKeluarBulanIni}
            </span>
            <span className="text-xs text-[#86868b]">Transaksi Pemakaian</span>
          </div>
          <div className="mt-3">
            <button 
              onClick={onNavigateToFase2} 
              className="text-xs text-[#34c759] hover:underline font-semibold"
            >
              Input Pemakaian
            </button>
          </div>
        </div>

      </div>

      {/* Alert Banner jika ada stok kritis */}
      {lowStockMaterials.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#ff9500]/30 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#ff9500] shrink-0" />
            <div className="text-xs text-[#1d1d1f]">
              <strong className="text-[#ff9500]">{lowStockMaterials.length} material</strong> di bawah stok minimum: {lowStockMaterials.map(m => m.name).join(', ')}
            </div>
          </div>
          <button
            onClick={onNavigateToFase2}
            className="px-3.5 py-1.5 rounded-full bg-[#ff9500] text-white text-xs font-semibold shrink-0"
          >
            Restock
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2 GRAFIK BATANG PER MATERIAL (1: PLANNING, 2: AKTUAL) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f2f2f7]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#34c759]" />
              <h2 className="text-base font-bold text-[#1d1d1f]">
                Grafik Komparasi Material
              </h2>
            </div>
            <span className="text-xs text-[#86868b] mt-0.5 block">
              2 batang per material: Target Planning vs Real Stok Gudang
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#8e8e93]"></span>
              <span className="text-[#86868b]">1. Target Planning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#34c759]"></span>
              <span className="text-[#1d1d1f] font-semibold">2. Real Stok Gudang</span>
            </div>
          </div>
        </div>

        {/* 1. GRID 8 MATERIAL: MASING-MASING MEMILIKI 2 GRAFIK BATANG TEGAK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {materials.map((mat) => {
            const planItem = activePlan?.materialsPlan?.find(m => m.materialId === mat.id);
            const planningVal = Number(planItem?.estimasi) || 0;
            const aktualVal = Number(mat.currentStock) || 0; // STOK REAL DI GUDANG DARI INPUT FASE 2

            // Skala Dinamis: patokan tinggi 100% adalah nilai tertinggi antara Planning dan Real Stok
            const maxVal = Math.max(planningVal, aktualVal, 0.0001);
            
            // Persentase tinggi batang:
            // Contoh: Planning 100, Stok 50 => maxVal=100 => Planning=100%, Stok=50% (setengah)
            // Contoh: Planning 100, Stok 100 => maxVal=100 => Planning=100%, Stok=100% (sejajar)
            // Contoh: Planning 100, Stok 150 => maxVal=150 => Planning=66%, Stok=100% (stok lebih tinggi)
            const planHeightPct = planningVal > 0 ? Math.round((planningVal / maxVal) * 100) : 0;
            const actHeightPct = aktualVal > 0 ? Math.round((aktualVal / maxVal) * 100) : 0;

            const diff = Math.round((aktualVal - planningVal) * 100) / 100;
            const fulfillmentPct = planningVal > 0 ? Math.round((aktualVal / planningVal) * 100) : (aktualVal > 0 ? 100 : 0);
            const isSelected = selectedMaterialId === mat.id;

            return (
              <div 
                key={mat.id}
                onClick={() => setSelectedMaterialId(mat.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#34c759] bg-[#f5fbf6] shadow-sm' 
                    : 'border-black/[0.06] bg-[#fbfbfd] hover:bg-white hover:border-[#34c759]/40'
                }`}
              >
                {/* Header Card Material */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1d1d1f] line-clamp-1">{mat.name}</h4>
                    <span className="text-[10px] text-[#86868b] font-mono">Kode: {mat.code}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ebebf0] text-[#1d1d1f] font-mono">
                    {mat.unit}
                  </span>
                </div>

                {/* 2 GRAFIK BATANG BERDAMPINGAN DENGAN TRACK LATAR & ANGKA TERLIHAT */}
                <div className="my-4">
                  <div className="h-40 flex items-end justify-center gap-5 px-3 pb-2 pt-6 bg-white rounded-xl border border-black/[0.03]">
                    
                    {/* BATANG 1: PLANNING (ABU-ABU APPLE) */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] font-mono font-semibold text-[#86868b] mb-1.5 select-none truncate max-w-full" title={`${planningVal} ${mat.unit}`}>
                        {planningVal}
                      </span>
                      <div className="w-full bg-[#f2f2f7] rounded-t-md h-full flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-[#8e8e93] rounded-t-md transition-all duration-500 ease-out"
                          style={{ height: planningVal > 0 ? `${Math.max(planHeightPct, 6)}%` : '3px' }}
                          title={`1. Planning: ${planningVal} ${mat.unit}`}
                        />
                      </div>
                    </div>

                    {/* BATANG 2: REAL STOK (HIJAU APPLE) */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] font-mono font-bold text-[#34c759] mb-1.5 select-none truncate max-w-full" title={`${aktualVal} ${mat.unit}`}>
                        {aktualVal}
                      </span>
                      <div className="w-full bg-[#f2f2f7] rounded-t-md h-full flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-[#34c759] rounded-t-md transition-all duration-500 ease-out shadow-xs"
                          style={{ height: aktualVal > 0 ? `${Math.max(actHeightPct, 6)}%` : '3px' }}
                          title={`2. Real Stok: ${aktualVal} ${mat.unit}`}
                        />
                      </div>
                    </div>

                  </div>

                  {/* LABEL KAKI BATANG */}
                  <div className="flex justify-between text-center pt-2 text-[10px] font-medium">
                    <span className="flex-1 text-[#86868b]">1. Planning</span>
                    <span className="flex-1 text-[#34c759] font-bold">2. Real Stok</span>
                  </div>
                </div>

                {/* FOOTER METRIK NILAI */}
                <div className="pt-2 border-t border-black/[0.04] space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-[#86868b]">
                    <span>Ketercukupan:</span>
                    <strong className={`font-mono ${fulfillmentPct >= 100 ? 'text-[#34c759]' : 'text-[#ff9500]'}`}>
                      {fulfillmentPct}%
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[#86868b]">
                    <span>Status:</span>
                    <strong className={`font-mono text-[10px] ${diff >= 0 ? 'text-[#34c759]' : 'text-[#ff9500]'}`}>
                      {diff >= 0 ? (diff === 0 ? 'Tercukupi Pas' : `Surplus +${diff} ${mat.unit}`) : `Kurang ${Math.abs(diff)} ${mat.unit}`}
                    </strong>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* 2. DETAIL FOKUS 2 BATANG DARI MATERIAL YANG DIPILIH */}
        {selectedMaterial && (
          <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-black/[0.04]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34c759] block">
                  Detail Komparasi
                </span>
                <h3 className="text-base font-bold text-[#1d1d1f]">
                  {selectedMaterial.name} ({selectedMaterial.unit})
                </h3>
              </div>

              {/* Selector Material */}
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="bg-white border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] font-semibold focus:outline-none focus:border-[#34c759]"
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                ))}
              </select>
            </div>

            {/* Horizontal Bar Comparison Detail */}
            <div className="space-y-4 max-w-2xl">
              
              {/* Bar 1: Planning */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#86868b]">1. Planning (Rencana)</span>
                  <span className="font-mono font-bold text-[#1d1d1f]">
                    {focusPlanning} {selectedMaterial.unit}
                  </span>
                </div>
                <div className="w-full bg-white h-7 rounded-xl p-1 border border-black/[0.04]">
                  <div 
                    className="bg-[#8e8e93] h-full rounded-lg transition-all flex items-center justify-end pr-2 text-white text-[11px] font-mono font-bold"
                    style={{ width: `${Math.max(focusPlanPct, focusPlanning > 0 ? 6 : 2)}%` }}
                  >
                    {focusPlanning > 0 && `${focusPlanning} ${selectedMaterial.unit}`}
                  </div>
                </div>
              </div>

              {/* Bar 2: Real Stok */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#34c759] font-bold">2. Real Stok (Gudang)</span>
                  <span className="font-mono font-bold text-[#34c759]">
                    {focusAktual} {selectedMaterial.unit}
                  </span>
                </div>
                <div className="w-full bg-white h-7 rounded-xl p-1 border border-black/[0.04]">
                  <div 
                    className="bg-[#34c759] h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-white text-[11px] font-mono font-bold shadow-xs"
                    style={{ width: `${Math.max(focusActPct, focusAktual > 0 ? 6 : 2)}%` }}
                  >
                    {focusAktual > 0 && `${focusAktual} ${selectedMaterial.unit}`}
                  </div>
                </div>
              </div>

            </div>

            {/* Metric Summary */}
            <div className="mt-4 pt-3 border-t border-[#e5e5ea] flex flex-wrap gap-4 text-xs">
              <span className="text-[#86868b]">
                Selisih: <strong className={`font-mono ${focusDiff >= 0 ? 'text-[#34c759]' : 'text-[#ff9500]'}`}>
                  {focusDiff >= 0 ? (focusDiff === 0 ? 'Tercukupi Pas' : `+${focusDiff} ${selectedMaterial.unit}`) : `${focusDiff} ${selectedMaterial.unit}`}
                </strong>
              </span>
              <span className="text-[#86868b]">
                Ketercukupan Stok: <strong className={`font-mono ${focusPlanning > 0 && (focusAktual / focusPlanning) >= 1 ? 'text-[#34c759]' : 'text-[#1d1d1f]'}`}>
                  {focusPlanning > 0 ? Math.round((focusAktual / focusPlanning) * 100) : (focusAktual > 0 ? 100 : 0)}%
                </strong>
              </span>
              <span className="text-[#86868b]">
                Stok Fisik: <strong className="text-[#1d1d1f] font-mono">{selectedMaterial.currentStock} {selectedMaterial.unit}</strong>
              </span>
            </div>

          </div>
        )}

      </div>

      {/* Real Stock Monitoring: 8 Material Utama */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7]">
          <h2 className="text-sm font-bold text-[#1d1d1f]">
            Stok Material Saat Ini
          </h2>
          <button
            onClick={onNavigateToFase2}
            className="text-xs text-[#34c759] hover:underline font-semibold"
          >
            Input Mutasi
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {materials.map((mat) => {
            const isLow = Number(mat.currentStock) <= Number(mat.minStock);
            const stockPct = Math.min(Math.round((mat.currentStock / mat.maxStock) * 100), 100);

            return (
              <div 
                key={mat.id}
                className="p-3.5 rounded-xl border border-black/[0.04] bg-[#fbfbfd]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#1d1d1f] truncate">{mat.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isLow ? 'bg-[#ff9500]/15 text-[#ff9500]' : 'bg-[#e8f7ec] text-[#34c759]'
                  }`}>
                    {isLow ? 'Menipis' : 'Aman'}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold font-mono ${isLow ? 'text-[#ff9500]' : 'text-[#1d1d1f]'}`}>
                      {Number(mat.currentStock).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-[#34c759] font-semibold">{mat.unit}</span>
                  </div>
                  <span className="text-[10px] text-[#86868b] font-mono">
                    Min: {mat.minStock} {mat.unit}
                  </span>
                </div>

                <div className="mt-2 w-full bg-[#ebebf0] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isLow ? 'bg-[#ff9500]' : 'bg-[#34c759]'}`}
                    style={{ width: `${Math.max(stockPct, 5)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Riwayat Mutasi Terkini */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7]">
          <h2 className="text-sm font-bold text-[#1d1d1f]">
            Riwayat Mutasi Terkini
          </h2>
          <button
            onClick={onNavigateToFase2}
            className="text-xs text-[#34c759] hover:underline font-semibold"
          >
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs text-[#1d1d1f]">
            <thead className="text-[#86868b] text-[11px] uppercase border-b border-[#f2f2f7]">
              <tr>
                <th className="py-2 px-2">Tanggal</th>
                <th className="py-2 px-2">Material</th>
                <th className="py-2 px-2">Tipe</th>
                <th className="py-2 px-2">Jumlah</th>
                <th className="py-2 px-2">Sisa</th>
                <th className="py-2 px-2">Catatan</th>
                <th className="py-2 px-2">PIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f2f7]">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#86868b]">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-[#f5f5f7]/50">
                    <td className="py-2 px-2 font-mono text-[#86868b]">{trx.date}</td>
                    <td className="py-2 px-2 font-semibold text-[#1d1d1f]">{trx.materialName}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        trx.type === 'in' ? 'bg-[#e8f7ec] text-[#34c759]' : 'bg-[#f2f2f7] text-[#1d1d1f]'
                      }`}>
                        {trx.type === 'in' ? 'Masuk' : trx.type === 'out' ? 'Keluar' : 'Opname'}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-[#1d1d1f]">
                      {trx.type === 'in' ? `+${trx.amount}` : `-${trx.amount}`} {trx.unit}
                    </td>
                    <td className="py-2 px-2 font-mono text-[#86868b]">
                      {trx.currentStock} {trx.unit}
                    </td>
                    <td className="py-2 px-2 text-[#86868b] truncate max-w-xs">{trx.notes}</td>
                    <td className="py-2 px-2 text-[#86868b] font-mono">{trx.operator}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
