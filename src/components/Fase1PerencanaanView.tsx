import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, ArrowRight, Trash2, Lock } from 'lucide-react';
import type { Material, MonthlyPlan } from '../types';
import { api } from '../services/api';

interface Fase1Props {
  materials: Material[];
  currentPlan: MonthlyPlan | null;
  onSaved: () => void;
  onNavigateToFase2: () => void;
}

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

  const [matPlans, setMatPlans] = useState<Array<{
    materialId: string;
    name: string;
    unit: 'Ton' | 'Kg' | 'Pcs';
    estimasi: number;
    realisasi: number;
  }>>([]);

  useEffect(() => {
    if (currentPlan && currentPlan.materialsPlan && currentPlan.materialsPlan.length > 0) {
      setPeriod(currentPlan.period);
      setMonthName(currentPlan.monthName);
      setMatPlans(currentPlan.materialsPlan);
    } else {
      const initialMatPlans = materials.map(m => ({
        materialId: m.id,
        name: m.name,
        unit: m.unit,
        estimasi: 0,
        realisasi: 0
      }));
      setMatPlans(initialMatPlans);
    }
  }, [currentPlan, materials]);

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

  const handleMaterialEstimasiChange = (index: number, val: string) => {
    const updated = [...matPlans];
    updated[index].estimasi = Number(val) || 0;
    setMatPlans(updated);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const planToSave: MonthlyPlan = {
        period,
        monthName,
        status: 'Aktif',
        materialsPlan: matPlans
      };

      await api.savePlan(planToSave);
      setNotification({
        type: 'success',
        message: `Rencana 8 material untuk ${monthName} berhasil disimpan.`
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

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Fase 1: Perencanaan Bulanan
          </h1>
          <span className="text-xs text-[#86868b]">
            Target Kebutuhan 8 Material Utama (Maksimal 1 Perencanaan Aktif)
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
              Perencanaan periode <strong>{monthName}</strong> sedang aktif (aturan 1x). Jika ingin memulai perencanaan baru, klik tombol reset di samping (seluruh stok & transaksi akan kembali ke 0).
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

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Periode */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
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

        {/* Target 8 Material */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
          <div className="pb-3 border-b border-[#f2f2f7] mb-4">
            <h2 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              Estimasi Target Kebutuhan 8 Material
            </h2>
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
                    value={mat.estimasi}
                    onChange={(e) => handleMaterialEstimasiChange(idx, e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-[#e5e5ea] rounded-lg px-2.5 py-1.5 text-xs text-[#1d1d1f] font-mono font-bold focus:outline-none focus:border-[#34c759] pr-10 text-right"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#86868b] font-mono">
                    {mat.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-2.5 bg-[#34c759] hover:bg-[#2fb350] text-white font-semibold text-xs rounded-full shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Menyimpan...' : (hasExistingPlan ? 'Perbarui Estimasi Bulanan' : 'Simpan Perencanaan Baru')}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
