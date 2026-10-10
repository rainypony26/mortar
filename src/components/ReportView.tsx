import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Factory,
  Layers,
  PackageCheck
} from 'lucide-react';
import type { Material, MonthlyPlan, Transaction } from '../types';

interface ReportProps {
  materials: Material[];
  currentPlan: MonthlyPlan | null;
  transactions: Transaction[];
}

export const ReportView: React.FC<ReportProps> = ({
  materials,
  currentPlan,
  transactions
}) => {
  const [selectedMonth] = useState<string>(currentPlan?.period || '2026-10');

  const totalMasukByMat = materials.reduce((acc, m) => {
    const totalIn = transactions
      .filter(t => t.materialId === m.id && t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0);
    acc[m.id] = totalIn;
    return acc;
  }, {} as Record<string, number>);

  const totalKeluarByMat = materials.reduce((acc, m) => {
    const totalOut = transactions
      .filter(t => t.materialId === m.id && t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0);
    acc[m.id] = totalOut;
    return acc;
  }, {} as Record<string, number>);

  // Agregasi Pemakaian per Produk (dari mutasi keluar)
  const pemakaianPerProduk = transactions
    .filter(t => t.type === 'out' && t.forProduct)
    .reduce((acc, t) => {
      const prodName = t.forProduct || 'Lainnya';
      if (!acc[prodName]) acc[prodName] = {};
      acc[prodName][t.materialName] = (acc[prodName][t.materialName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, Record<string, number>>);

  const handlePrint = () => {
    window.print();
  };

  const exportFullReportCSV = () => {
    let csv = 'LAPORAN KONTROL 8 MATERIAL UTAMA PABRIK MORTAR\n';
    csv += `Periode,${currentPlan?.monthName || selectedMonth}\n`;
    csv += `Tanggal Cetak,${new Date().toLocaleDateString('id-ID')}\n\n`;

    csv += 'REKAPITULASI 8 MATERIAL UTAMA\n';
    csv += 'Nama Material,Satuan,Estimasi Kebutuhan,Realisasi Pemakaian,Total Masuk,Total Keluar,Stok Fisik Akhir,Status\n';
    materials.forEach(m => {
      const planItem = currentPlan?.materialsPlan?.find(mp => mp.materialId === m.id);
      const isLow = m.currentStock <= m.minStock && m.currentStock > 0;
      csv += `"${m.name}","${m.unit}",${planItem?.estimasi || 0},${planItem?.realisasi || 0},${totalMasukByMat[m.id] || 0},${totalKeluarByMat[m.id] || 0},${m.currentStock},"${isLow ? 'MENIPIS' : 'AMAN'}"\n`;
    });

    if (currentPlan?.productsPlan && currentPlan.productsPlan.length > 0) {
      csv += '\nRINCIAN KEBUTUHAN MATERIAL PER PRODUK MORTAR\n';
      csv += 'Nama Produk,Material,Estimasi Kebutuhan,Satuan\n';
      currentPlan.productsPlan.forEach(p => {
        p.requirements.filter(r => r.estimasi > 0).forEach(r => {
          csv += `"${p.productName}","${r.materialName}",${r.estimasi},"${r.unit}"\n`;
        });
      });
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Material_Mortar_${currentPlan?.period || '2026-10'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeProductsPlan = currentPlan?.productsPlan || [];

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4 print:text-black">
      
      {/* Action Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Laporan Material & Produksi
          </h1>
          <span className="text-xs text-[#86868b]">
            Periode: <strong className="text-[#1d1d1f]">{currentPlan?.monthName || 'Oktober 2026'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-semibold rounded-full border border-black/[0.06] transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-[#86868b]" />
            <span>Cetak PDF</span>
          </button>
          <button
            onClick={exportFullReportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#34c759] hover:bg-[#2fb350] text-white text-xs font-semibold rounded-full shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* REPORT CONTAINER */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-6 print:border-none print:p-0 print:text-black">
        
        {/* Report Header */}
        <div className="border-b border-[#f2f2f7] pb-4 print:border-black flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-[#34c759] print:text-black" />
              <h2 className="text-base font-bold text-[#1d1d1f] print:text-black">
                Pabrik Mortar Utama
              </h2>
            </div>
            <div className="text-xs text-[#86868b] print:text-neutral-600 mt-0.5">
              Laporan Kontrol, Perencanaan Produk & Mutasi 8 Material Utama
            </div>
          </div>
          <div className="text-right text-xs text-[#86868b] print:text-neutral-600 font-mono">
            <div>Periode: <strong className="text-[#1d1d1f] print:text-black">{currentPlan?.monthName || 'Oktober 2026'}</strong></div>
            <div>Metode: <strong>{currentPlan?.planType === 'by_product' ? 'Berdasarkan Produk' : 'Material Tok'}</strong></div>
            <div>Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        {/* Ringkasan 8 Material */}
        <div>
          <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
            1. Rekapitulasi 8 Material Utama Pabrik
          </h3>

          <div className="overflow-x-auto rounded-xl border border-black/[0.04] print:border-black">
            <table className="w-full text-left text-xs text-[#1d1d1f] print:text-black">
              <thead className="bg-[#f5f5f7] print:bg-neutral-100 text-[#86868b] print:text-black text-[11px] uppercase border-b border-[#f2f2f7]">
                <tr>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Target Kebutuhan</th>
                  <th className="py-2.5 px-3 text-right">Realisasi Pakai</th>
                  <th className="py-2.5 px-3 text-right">Total Masuk</th>
                  <th className="py-2.5 px-3 text-right">Stok Fisik Gudang</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f7] print:divide-black">
                {materials.map(m => {
                  const planItem = currentPlan?.materialsPlan?.find(mp => mp.materialId === m.id);
                  const isLow = m.currentStock <= m.minStock && m.currentStock > 0;
                  return (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 font-semibold text-[#1d1d1f] print:text-black">{m.name}</td>
                      <td className="py-2.5 px-3 font-mono text-[#34c759] print:text-black">{m.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{planItem?.estimasi || 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#34c759] print:text-black font-semibold">{planItem?.realisasi || 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#1d1d1f] print:text-black">+{totalMasukByMat[m.id] || 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1d1d1f] print:text-black">{m.currentStock}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isLow ? 'bg-[#ff9500]/15 text-[#ff9500]' : 'bg-[#e8f7ec] text-[#34c759]'
                        }`}>
                          {isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Rincian Kebutuhan per Produk Mortar (Jika Ada) */}
        {activeProductsPlan.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#34c759]" />
              <span>2. Rincian Target Kebutuhan per Produk Mortar yang Diproduksi</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProductsPlan.map(prod => {
                const used = prod.requirements.filter(r => r.estimasi > 0);
                return (
                  <div 
                    key={prod.productId}
                    className="p-4 rounded-xl border border-black/[0.05] bg-[#fbfbfd] print:bg-white print:border-black space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#f2f2f7] print:border-black">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1d1d1f] print:text-black">
                        <PackageCheck className="w-3.5 h-3.5 text-[#34c759]" />
                        <span>{prod.productName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f7] print:border font-mono">
                        {used.length} Material
                      </span>
                    </div>

                    <div className="space-y-1">
                      {used.length === 0 ? (
                        <div className="text-[11px] text-[#86868b] italic">Tidak ada estimasi material</div>
                      ) : (
                        used.map(req => (
                          <div key={req.materialId} className="flex justify-between items-center text-xs py-1 border-b border-black/[0.02]">
                            <span className="text-[#1d1d1f] print:text-black">{req.materialName}</span>
                            <span className="font-mono font-bold text-[#34c759] print:text-black">
                              {req.estimasi} {req.unit}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Realisasi Pemakaian Riil per Produk dari Transaksi Keluar */}
        {Object.keys(pemakaianPerProduk).length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
              3. Pemakaian Riil Material per Produk (Berdasarkan Mutasi Keluar)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-black/[0.04] print:border-black">
              <table className="w-full text-left text-xs text-[#1d1d1f] print:text-black">
                <thead className="bg-[#f5f5f7] print:bg-neutral-100 text-[#86868b] print:text-black text-[11px] uppercase border-b border-[#f2f2f7]">
                  <tr>
                    <th className="py-2 px-3">Produk Mortar</th>
                    <th className="py-2 px-3">Material yang Dipakai</th>
                    <th className="py-2 px-3 text-right">Jumlah Terpakai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f7] print:divide-black">
                  {Object.entries(pemakaianPerProduk).map(([prodName, mats]) => (
                    Object.entries(mats).map(([matName, totalAmt], idx) => (
                      <tr key={`${prodName}-${matName}`}>
                        {idx === 0 ? (
                          <td 
                            rowSpan={Object.keys(mats).length} 
                            className="py-2 px-3 font-bold align-top border-r border-[#f2f2f7] bg-[#fbfbfd]/50"
                          >
                            {prodName}
                          </td>
                        ) : null}
                        <td className="py-2 px-3 text-[#1d1d1f]">{matName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#ff3b30] print:text-black">
                          {totalAmt}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
