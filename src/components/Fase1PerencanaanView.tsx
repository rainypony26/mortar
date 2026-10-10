import React, { useState, useEffect } from 'react';
import { 
  Save, CheckCircle, ArrowRight, ArrowLeft, Trash2, Lock, 
  Layers, Calculator, PackageCheck, AlertCircle, CheckSquare, Square
} from 'lucide-react';
import type { Material, MonthlyPlan, ProductPlanItem } from '../types';
import { api } from '../services/api';

interface Fase1Props {
  materials: Material[];
  currentPlan: MonthlyPlan | null;
  onSaved: () => void;
  onNavigateToFase2: () => void;
}

// 6 Produk Mortar Jadi
const ALL_MORTAR_PRODUCTS = [
  { id: 'prod-thinbed', name: 'Thin bed perekat' },
  { id: 'prod-plaster', name: 'Plaster' },
  { id: 'prod-skimcoat-ext', name: 'Skimcoat luar' },
  { id: 'prod-skimcoat-int', name: 'Skim coat dalam' },
  { id: 'prod-acian', name: 'Acian' },
  { id: 'prod-tile-adhesive', name: 'Tile adhesive' }
];

export const Fase1PerencanaanView: React.FC<Fase1Props> = ({
  materials,
  currentPlan,
  onSaved,
  onNavigateToFase2
}) => {
  const hasExistingPlan = !!(currentPlan && currentPlan.materialsPlan && currentPlan.materialsPlan.length > 0 && currentPlan.period);

  const [period, setPeriod] = useState<string>(currentPlan?.period || '2026-10');
  const [monthName, setMonthName] = useState<string>(currentPlan?.monthName || 'Oktober 2026');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Pilihan Mode Perencanaan: 'by_product' (Berdasarkan Produk) ATAU 'material_only' (Material Tok)
  const [planMode, setPlanMode] = useState<'by_product' | 'material_only'>(
    currentPlan?.planType === 'material_only' ? 'material_only' : 'by_product'
  );

  // 2. Daftar ID Produk yang DIPILIH diproduksi bulan ini (default misal: Plaster & Acian atau produk dari plan tersimpan)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    if (currentPlan?.productsPlan && currentPlan.productsPlan.length > 0) {
      return currentPlan.productsPlan.map(p => p.productId);
    }
    // Default awal contoh: Plaster dan Acian
    return ['prod-plaster', 'prod-acian'];
  });

  // 3. Tab Halaman Aktif saat mode 'by_product':
  // 'select_products' (Pilih Produk) | 'prod-xxx' (Halaman Produk Tertentu) | 'recap' (Halaman Rekap Total)
  const [activeStepTab, setActiveStepTab] = useState<string>('prod-plaster');

  // 4. Data Rincian Material untuk 6 Produk
  const [productsPlan, setProductsPlan] = useState<ProductPlanItem[]>(() => {
    return ALL_MORTAR_PRODUCTS.map(p => ({
      productId: p.id,
      productName: p.name,
      requirements: materials.map(m => ({
        materialId: m.id,
        materialName: m.name,
        unit: m.unit,
        estimasi: 0
      }))
    }));
  });

  // 5. Total Akumulasi 8 Material Utama
  const [matPlans, setMatPlans] = useState<Array<{
    materialId: string;
    name: string;
    unit: 'Ton' | 'Kg' | 'Pcs';
    estimasi: number;
    realisasi: number;
  }>>([]);

  // Inisialisasi data dari currentPlan atau materials
  useEffect(() => {
    if (materials.length === 0) return;

    if (currentPlan && currentPlan.materialsPlan && currentPlan.materialsPlan.length > 0) {
      setPeriod(currentPlan.period);
      setMonthName(currentPlan.monthName);
      setMatPlans(currentPlan.materialsPlan);
      setPlanMode(currentPlan.planType === 'material_only' ? 'material_only' : 'by_product');

      if (currentPlan.productsPlan && currentPlan.productsPlan.length > 0) {
        const prodIds = currentPlan.productsPlan.map(p => p.productId);
        setSelectedProductIds(prodIds);
        if (prodIds.length > 0) {
          setActiveStepTab(prodIds[0]);
        }

        const mergedProds = ALL_MORTAR_PRODUCTS.map(prod => {
          const found = currentPlan.productsPlan?.find(p => p.productId === prod.id);
          return {
            productId: prod.id,
            productName: prod.name,
            requirements: materials.map(m => {
              const req = found?.requirements?.find(r => r.materialId === m.id);
              return {
                materialId: m.id,
                materialName: m.name,
                unit: m.unit,
                estimasi: req ? req.estimasi : 0
              };
            })
          };
        });
        setProductsPlan(mergedProds);
      }
    } else {
      const initialMatPlans = materials.map(m => ({
        materialId: m.id,
        name: m.name,
        unit: m.unit,
        estimasi: 0,
        realisasi: 0
      }));
      setMatPlans(initialMatPlans);

      setProductsPlan(ALL_MORTAR_PRODUCTS.map(p => ({
        productId: p.id,
        productName: p.name,
        requirements: materials.map(m => ({
          materialId: m.id,
          materialName: m.name,
          unit: m.unit,
          estimasi: 0
        }))
      })));
    }
  }, [currentPlan, materials]);

  // Recalculate MatPlans saat produk dipilih atau kebutuhan produk berubah
  const recalculateFromSelectedProducts = (prods: ProductPlanItem[], activeIds: string[]) => {
    setMatPlans(prev => prev.map(m => {
      const sum = prods
        .filter(p => activeIds.includes(p.productId))
        .reduce((acc, p) => {
          const req = p.requirements.find(r => r.materialId === m.materialId);
          return acc + (req ? req.estimasi : 0);
        }, 0);
      return {
        ...m,
        estimasi: Math.round(sum * 100) / 100
      };
    }));
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPeriod(val);
    if (val) {
      const [year, month] = val.split('-');
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const mIdx = parseInt(month, 10) - 1;
      setMonthName(`${monthNames[mIdx] || 'Bulan'} ${year}`);
    }
  };

  // Toggle Centang Produk yang Diproduksi Bulan Ini
  const handleToggleProductSelection = (prodId: string) => {
    let newSelected: string[];
    if (selectedProductIds.includes(prodId)) {
      if (selectedProductIds.length === 1) {
        alert('Minimal harus ada 1 produk yang dipilih, atau beralihlah ke mode "Material Saja".');
        return;
      }
      newSelected = selectedProductIds.filter(id => id !== prodId);
    } else {
      newSelected = [...selectedProductIds, prodId];
    }
    setSelectedProductIds(newSelected);
    recalculateFromSelectedProducts(productsPlan, newSelected);

    // Jika tab aktif saat ini adalah produk yang di-uncheck, pindah ke produk pertama yang aktif
    if (activeStepTab === prodId) {
      setActiveStepTab(newSelected[0] || 'recap');
    }
  };

  // Ubah Kebutuhan Material di Halaman Produk Tertentu
  const handleProductMaterialChange = (prodId: string, matId: string, val: string) => {
    const numVal = Math.max(0, Number(val) || 0);
    const updatedProducts = productsPlan.map(p => {
      if (p.productId !== prodId) return p;
      return {
        ...p,
        requirements: p.requirements.map(r => 
          r.materialId === matId ? { ...r, estimasi: numVal } : r
        )
      };
    });

    setProductsPlan(updatedProducts);
    recalculateFromSelectedProducts(updatedProducts, selectedProductIds);
  };

  // Ubah Langsung 8 Material (Mode Material Tok)
  const handleDirectMaterialChange = (index: number, val: string) => {
    const updated = [...matPlans];
    updated[index].estimasi = Math.max(0, Number(val) || 0);
    setMatPlans(updated);
  };

  // Reset & Hapus Semua Data
  const handleDeletePlan = async () => {
    if (!window.confirm('Reset semua data? Menghapus perencanaan akan mereset seluruh stok material ke 0 dan menghapus riwayat transaksi sehingga sistem kembali bersih dari awal.')) {
      return;
    }

    setDeleting(true);
    setNotification(null);

    try {
      await api.deletePlan();
      setNotification({
        type: 'success',
        message: 'Seluruh data dan perencanaan berhasil direset bersih ke 0. Anda dapat memulai perencanaan baru.'
      });
      onSaved();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal mereset data'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Submit Simpan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      // Jika mode produk, hanya simpan produk-produk yang dipilih
      const activeProductsPlan = planMode === 'by_product'
        ? productsPlan.filter(p => selectedProductIds.includes(p.productId))
        : [];

      const planToSave: MonthlyPlan = {
        period,
        monthName,
        status: 'Aktif',
        planType: planMode,
        materialsPlan: matPlans,
        productsPlan: planMode === 'by_product' ? activeProductsPlan : undefined
      };

      await api.savePlan(planToSave);
      setNotification({
        type: 'success',
        message: `Perencanaan ${planMode === 'by_product' ? 'berdasarkan produk' : 'material'} untuk ${monthName} berhasil disimpan.`
      });
      onSaved();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menyimpan rencana'
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter produk yang aktif dipilih
  const activeSelectedProducts = ALL_MORTAR_PRODUCTS.filter(p => selectedProductIds.includes(p.id));
  
  // Data produk yang sedang dibuka di halaman khusus
  const currentProductData = productsPlan.find(p => p.productId === activeStepTab);

  // Index untuk tombol navigasi "Next Produk / Prev Produk"
  const currentProdIndex = activeSelectedProducts.findIndex(p => p.id === activeStepTab);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Fase 1: Perencanaan Bulanan
          </h1>
          <span className="text-xs text-[#86868b]">
            Tentukan Target Kebutuhan Material Pabrik (Aturan 1 Perencanaan Aktif)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasExistingPlan && (
            <button
              type="button"
              onClick={handleDeletePlan}
              disabled={deleting}
              className="text-xs px-4 py-2 bg-white hover:bg-[#ff3b30]/10 text-[#ff3b30] rounded-full flex items-center gap-1.5 font-semibold border border-[#ff3b30]/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Menghapus...' : 'Hapus Perencanaan'}</span>
            </button>
          )}

          <button
            onClick={onNavigateToFase2}
            className="text-xs px-4 py-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] rounded-full flex items-center gap-1.5 font-semibold border border-black/[0.06] transition-all"
          >
            <span>Fase 2: Input Stok</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
          notification.type === 'success' 
            ? 'bg-[#e8f7ec] border-[#34c759]/20 text-[#248a3d]' 
            : 'bg-[#ff3b30]/10 border-[#ff3b30]/20 text-[#ff3b30]'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Info Status Perencanaan Aktif */}
      {hasExistingPlan && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#86868b] shrink-0" />
            <div className="text-xs text-[#1d1d1f]">
              Perencanaan periode <strong>{monthName}</strong> sedang aktif (Metode: {currentPlan?.planType === 'material_only' ? 'Material Tok' : 'Berdasarkan Produk'}).
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeletePlan}
            disabled={deleting}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#ff3b30] bg-[#ff3b30]/10 rounded-lg hover:bg-[#ff3b30]/20 self-start sm:self-auto shrink-0 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset & Hapus Semua Data</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card Periode */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Periode</label>
              <input
                type="month"
                value={period}
                onChange={handlePeriodChange}
                required
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Nama Bulan</label>
              <input
                type="text"
                value={monthName}
                onChange={(e) => setMonthName(e.target.value)}
                required
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
              />
            </div>
          </div>
        </div>

        {/* 2 PILIHAN METODE PERENCANAAN */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Langkah 1: Pilih Metode Perencanaan Bulan Ini
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* OPSI 1: BERDASARKAN PRODUK */}
            <div 
              onClick={() => {
                setPlanMode('by_product');
                recalculateFromSelectedProducts(productsPlan, selectedProductIds);
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                planMode === 'by_product'
                  ? 'border-[#34c759] bg-[#f5fbf6]'
                  : 'border-black/[0.06] bg-[#fbfbfd] hover:bg-white hover:border-[#34c759]/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${planMode === 'by_product' ? 'bg-[#34c759] text-white' : 'bg-[#ebebf0] text-[#1d1d1f]'}`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1d1d1f]">Input Berdasarkan Produk yang Diproduksi</h3>
                  {planMode === 'by_product' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#34c759] text-white rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                  Pilih produk apa saja yang akan diproduksi bulan ini (contoh: hanya <strong>Plaster & Acian</strong>). Kebutuhan material diisi di halaman masing-masing produk secara terpisah.
                </p>
              </div>
            </div>

            {/* OPSI 2: MATERIAL TOK */}
            <div 
              onClick={() => {
                setPlanMode('material_only');
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                planMode === 'material_only'
                  ? 'border-[#34c759] bg-[#f5fbf6]'
                  : 'border-black/[0.06] bg-[#fbfbfd] hover:bg-white hover:border-[#34c759]/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${planMode === 'material_only' ? 'bg-[#34c759] text-white' : 'bg-[#ebebf0] text-[#1d1d1f]'}`}>
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1d1d1f]">Input Material Saja (Material Tok)</h3>
                  {planMode === 'material_only' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#34c759] text-white rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                  Tidak perlu menginput produk sama sekali. Langsung tentukan target estimasi untuk 8 Material Utama (Kapur, Additive, Semen, Silika, Zak).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* METODE 1: BERDASARKAN PRODUK YANG DIPRODUKSI BULAN INI                    */}
        {/* ========================================================================= */}
        {planMode === 'by_product' && (
          <div className="space-y-5">
            
            {/* Bagian A: Pilih Produk yang Diproduksi Bulan Ini */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[#f2f2f7]">
                <div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                    Langkah 2: Centang Produk yang Diproduksi Bulan Ini ({monthName})
                  </h3>
                  <p className="text-[11px] text-[#86868b]">
                    Centang produk yang aktif bulan ini (halaman pengisian material hanya akan dibuat untuk produk yang Anda centang).
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#f5f5f7] rounded-full text-[#1d1d1f]">
                  {selectedProductIds.length} dari 6 Produk Dipilih
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {ALL_MORTAR_PRODUCTS.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleToggleProductSelection(prod.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isChecked 
                          ? 'border-[#34c759] bg-[#f5fbf6] shadow-2xs' 
                          : 'border-black/[0.06] bg-[#fbfbfd] hover:bg-white text-[#86868b]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#34c759]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#86868b]/50" />
                        )}
                        {isChecked && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]"></span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-[#1d1d1f]">
                        {prod.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bagian B: Navigasi Halaman Terpisah per Produk Terpilih */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-3 shadow-2xs">
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider px-2 py-1 mb-1">
                Navigasi Halaman Terpisah:
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeSelectedProducts.map((prod, idx) => {
                  const isCurrent = activeStepTab === prod.id;
                  const prodData = productsPlan.find(p => p.productId === prod.id);
                  const filledCount = prodData?.requirements.filter(r => r.estimasi > 0).length || 0;

                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => setActiveStepTab(prod.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                        isCurrent
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-[#fbfbfd] text-[#1d1d1f] border-black/[0.05] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent ? 'bg-[#34c759] text-white' : 'bg-[#ebebf0] text-[#1d1d1f]'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>Halaman: {prod.name}</span>
                      {filledCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isCurrent ? 'bg-white/20 text-white' : 'bg-[#e8f7ec] text-[#248a3d]'
                        }`}>
                          {filledCount} material
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Tab Rekap Total */}
                <button
                  type="button"
                  onClick={() => setActiveStepTab('recap')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ml-auto ${
                    activeStepTab === 'recap'
                      ? 'bg-[#34c759] text-white border-[#34c759] shadow-xs'
                      : 'bg-[#fbfbfd] text-[#1d1d1f] border-black/[0.05] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Lihat Rekap Total Gabungan</span>
                </button>
              </div>
            </div>

            {/* Bagian C: Halaman Khusus Produk yang Sedang Dibuka */}
            {activeStepTab !== 'recap' && currentProductData && (
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-2xs space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f2f2f7] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/10 text-[#248a3d] border border-[#34c759]/20">
                        Halaman Produk {currentProdIndex + 1} dari {activeSelectedProducts.length}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-[#1d1d1f] mt-1 flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-[#34c759]" />
                      <span>Kebutuhan Material untuk Produk: <strong>{currentProductData.productName}</strong></span>
                    </h2>
                    <p className="text-xs text-[#86868b] mt-0.5">
                      Masukkan estimasi berapa banyak material yang dibutuhkan untuk memproduksi <strong>{currentProductData.productName}</strong> selama periode {monthName}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {currentProdIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveStepTab(activeSelectedProducts[currentProdIndex - 1].id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] rounded-lg flex items-center gap-1 transition-all"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Ke {activeSelectedProducts[currentProdIndex - 1].name}</span>
                      </button>
                    )}
                    {currentProdIndex < activeSelectedProducts.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveStepTab(activeSelectedProducts[currentProdIndex + 1].id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#1d1d1f] hover:bg-black text-white rounded-lg flex items-center gap-1 transition-all"
                      >
                        <span>Lanjut ke {activeSelectedProducts[currentProdIndex + 1].name}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveStepTab('recap')}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#34c759] hover:bg-[#2fb350] text-white rounded-lg flex items-center gap-1 transition-all"
                      >
                        <span>Ke Rekap Total</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Input 8 Material Khusus Produk Ini */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentProductData.requirements.map((req) => (
                    <div 
                      key={req.materialId}
                      className="p-3.5 bg-[#fbfbfd] rounded-xl border border-black/[0.04] flex items-center justify-between gap-3 hover:border-black/[0.08] transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-semibold text-[#1d1d1f] truncate">{req.materialName}</h4>
                        <span className="text-[10px] text-[#86868b] font-mono">
                          Satuan: <strong className="text-[#34c759]">{req.unit}</strong>
                        </span>
                      </div>

                      <div className="w-36 relative shrink-0">
                        <input
                          type="number"
                          step={req.unit === 'Ton' ? '0.1' : '1'}
                          min="0"
                          value={req.estimasi === 0 ? '' : req.estimasi}
                          onChange={(e) => handleProductMaterialChange(currentProductData.productId, req.materialId, e.target.value)}
                          placeholder="0"
                          className="w-full bg-white border border-[#e5e5ea] rounded-lg px-2.5 py-1.5 text-xs text-[#1d1d1f] font-mono font-bold focus:outline-none focus:border-[#34c759] pr-11 text-right"
                        />
                        <span className="absolute right-2.5 top-1.5 text-xs text-[#86868b] font-mono pointer-events-none">
                          {req.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian D: Rekapitulasi Akumulasi Total Gabungan (Tampil Saat Tab Rekap atau Selalu di Bawah) */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-[#f2f2f7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#34c759]" />
                    <span>Rekapitulasi Akumulasi Total Material (Gabungan Produk Terpilih)</span>
                  </h3>
                  <p className="text-[11px] text-[#86868b]">
                    Hasil penjumlahan otomatis dari produk yang diproduksi bulan ini ({activeSelectedProducts.map(p => p.name).join(', ')}). Nilai ini yang menjadi Target Planning di Dashboard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {matPlans.map((mat) => {
                  const contributors = productsPlan
                    .filter(p => selectedProductIds.includes(p.productId))
                    .map(p => {
                      const r = p.requirements.find(req => req.materialId === mat.materialId);
                      return { name: p.productName, val: r ? r.estimasi : 0 };
                    })
                    .filter(c => c.val > 0);

                  return (
                    <div 
                      key={mat.materialId}
                      className="p-3.5 bg-[#fbfbfd] rounded-xl border border-black/[0.04] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-[#1d1d1f] line-clamp-1">{mat.name}</span>
                        <span className="text-[10px] text-[#86868b] font-mono">{mat.unit}</span>
                      </div>

                      <div className="text-lg font-bold font-mono text-[#34c759]">
                        {mat.estimasi.toLocaleString('id-ID')} <span className="text-xs font-normal text-[#86868b]">{mat.unit}</span>
                      </div>

                      {/* Detail per produk yang berkontribusi */}
                      <div className="pt-1.5 border-t border-black/[0.04] text-[10px] text-[#86868b] space-y-0.5">
                        {contributors.length > 0 ? (
                          contributors.map((c, i) => (
                            <div key={i} className="flex justify-between truncate">
                              <span className="truncate">{c.name}:</span>
                              <span className="font-mono font-medium text-[#1d1d1f] ml-1">{c.val} {mat.unit}</span>
                            </div>
                          ))
                        ) : (
                          <span className="italic text-[#86868b]/60">Tidak digunakan</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* METODE 2: MATERIAL SAJA (MATERIAL TOK)                                   */}
        {/* ========================================================================= */}
        {planMode === 'material_only' && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-[#f2f2f7]">
              <h2 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                Estimasi Target Kebutuhan 8 Material Utama (Material Tok)
              </h2>
              <p className="text-[11px] text-[#86868b]">
                Masukkan target kebutuhan bahan baku langsung tanpa mengaitkan dengan produk.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matPlans.map((mat, idx) => (
                <div 
                  key={mat.materialId || idx}
                  className="p-3.5 bg-[#fbfbfd] rounded-xl border border-black/[0.03] flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-[#1d1d1f]">{mat.name}</h4>
                    <span className="text-[10px] text-[#86868b] font-mono">
                      Satuan: <strong className="text-[#34c759]">{mat.unit}</strong>
                    </span>
                  </div>

                  <div className="w-36 relative">
                    <input
                      type="number"
                      step={mat.unit === 'Ton' ? '0.1' : '1'}
                      min="0"
                      value={mat.estimasi === 0 ? '' : mat.estimasi}
                      onChange={(e) => handleDirectMaterialChange(idx, e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-[#e5e5ea] rounded-lg px-2.5 py-1.5 text-xs text-[#1d1d1f] font-mono font-bold focus:outline-none focus:border-[#34c759] pr-10 text-right"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-[#86868b] font-mono pointer-events-none">
                      {mat.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Save Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-[#86868b] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#34c759] shrink-0" />
            <span>Target yang disimpan akan langsung tampil sebagai grafik Target Planning di Dashboard.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#34c759] hover:bg-[#2fb350] text-white font-semibold text-xs rounded-full shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Menyimpan...' : (hasExistingPlan ? 'Perbarui Perencanaan Bulanan' : 'Simpan Perencanaan Baru')}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
