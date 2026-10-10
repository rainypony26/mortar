import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import type { Material, MonthlyPlan, Transaction } from '../types';
import { api } from '../services/api';

interface Fase2Props {
  materials: Material[];
  currentPlan: MonthlyPlan | null;
  transactions: Transaction[];
  onDataUpdated: () => void;
}

const ALL_MORTAR_PRODUCTS = [
  'Thin bed perekat',
  'Plaster',
  'Skimcoat luar',
  'Skim coat dalam',
  'Acian',
  'Tile adhesive'
];

export const Fase2InputStokView: React.FC<Fase2Props> = ({
  materials,
  currentPlan,
  transactions,
  onDataUpdated
}) => {
  // Form State: Mutasi Stok Material
  const [selectedMatId, setSelectedMatId] = useState<string>(materials[0]?.id || 'mat-1');
  const [trxType, setTrxType] = useState<'in' | 'out' | 'adjust'>('in');
  const [amount, setAmount] = useState<string>('');
  const [trxDate, setTrxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [forProduct, setForProduct] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // History Filter State
  const [searchFilter, setSearchFilter] = useState('');
  const [matFilter, setMatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  const selectedMaterial = materials.find(m => m.id === selectedMatId) || materials[0];

  const numAmount = Number(amount) || 0;
  let simulatedStock = selectedMaterial ? Number(selectedMaterial.currentStock) : 0;
  if (trxType === 'in') simulatedStock += numAmount;
  else if (trxType === 'out') simulatedStock = Math.max(0, simulatedStock - numAmount);
  else if (trxType === 'adjust') simulatedStock = numAmount;

  // Daftar produk yang aktif di perencanaan atau default
  const activePlanProducts = currentPlan?.productsPlan?.map(p => p.productName) || ALL_MORTAR_PRODUCTS;

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setFeedback({ type: 'error', message: 'Jumlah mutasi harus lebih dari 0' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.createTransaction({
        materialId: selectedMatId,
        type: trxType,
        amount: Number(amount),
        notes: notes || '-',
        operator: operator || 'Operator',
        date: trxDate,
        forProduct: forProduct || undefined
      });

      setFeedback({
        type: 'success',
        message: `${selectedMaterial.name} diperbarui: ${trxType === 'in' ? '+' : '-'}${amount} ${selectedMaterial.unit}${forProduct ? ` (Untuk produksi ${forProduct})` : ''}`
      });

      setAmount('');
      setNotes('');
      onDataUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan transaksi' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory = transactions.filter(t => {
    const matchMat = matFilter === 'all' || t.materialId === matFilter;
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchProduct = productFilter === 'all' || 
      (productFilter === 'none' ? !t.forProduct : t.forProduct === productFilter);
    const matchSearch = searchFilter === '' || 
      t.materialName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (t.forProduct && t.forProduct.toLowerCase().includes(searchFilter.toLowerCase())) ||
      t.notes.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.operator.toLowerCase().includes(searchFilter.toLowerCase());
    return matchMat && matchType && matchProduct && matchSearch;
  });

  const exportHistoryCSV = () => {
    const headers = ['ID,Tanggal,Material,Tipe,Jumlah,Satuan,Untuk_Produk,Stok_Sebelum,Stok_Sesudah,Keterangan,Operator'];
    const rows = filteredHistory.map(t => 
      `"${t.id}","${t.date}","${t.materialName}","${t.type}","${t.amount}","${t.unit}","${t.forProduct || '-'}","${t.previousStock}","${t.currentStock}","${t.notes.replace(/"/g, '""')}","${t.operator}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mutasi_stok_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Fase 2: Input Stok & Mutasi
          </h1>
          <span className="text-xs text-[#86868b]">
            Input Penerimaan, Pemakaian per Produk, dan Riwayat Stok 8 Material Utama
          </span>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
          feedback.type === 'success' 
            ? 'bg-[#e8f7ec] border-[#34c759]/20 text-[#248a3d]' 
            : 'bg-[#ff3b30]/10 border-[#ff3b30]/20 text-[#ff3b30]'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* FORM INPUT MUTASI */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-2xs">
        <h2 className="text-sm font-bold text-[#1d1d1f] pb-3 border-b border-[#f2f2f7] mb-4">
          Form Input Mutasi Stok Fisik Gudang
        </h2>

        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Pilih Material */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">
                Material Utama
              </label>
              <select
                value={selectedMatId}
                onChange={(e) => setSelectedMatId(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] font-semibold focus:outline-none focus:border-[#34c759]"
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.currentStock} {m.unit})
                  </option>
                ))}
              </select>
              <div className="mt-1 flex justify-between text-[11px] text-[#86868b]">
                <span>Satuan: <strong className="text-[#34c759]">{selectedMaterial?.unit}</strong></span>
                <span>Stok Saat Ini: <strong>{selectedMaterial?.currentStock} {selectedMaterial?.unit}</strong></span>
              </div>
            </div>

            {/* Tipe Mutasi */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">
                Tipe Mutasi
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea]">
                <button
                  type="button"
                  onClick={() => setTrxType('in')}
                  className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                    trxType === 'in' ? 'bg-white text-[#248a3d] shadow-xs' : 'text-[#86868b]'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3 text-[#34c759]" />
                  <span>Masuk (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrxType('out')}
                  className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                    trxType === 'out' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#86868b]'
                  }`}
                >
                  <ArrowDownRight className="w-3 h-3 text-[#86868b]" />
                  <span>Keluar (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrxType('adjust')}
                  className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                    trxType === 'adjust' ? 'bg-white text-[#007aff] shadow-xs' : 'text-[#86868b]'
                  }`}
                >
                  <RotateCcw className="w-3 h-3 text-[#007aff]" />
                  <span>Opname (=)</span>
                </button>
              </div>
            </div>

            {/* Jumlah */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">
                Jumlah ({selectedMaterial?.unit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={selectedMaterial?.unit === 'Ton' ? '0.01' : '1'}
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-2 text-sm text-[#1d1d1f] font-mono font-bold focus:outline-none focus:border-[#34c759] pr-12"
                />
                <span className="absolute right-3 top-2 text-xs text-[#86868b] font-mono">
                  {selectedMaterial?.unit}
                </span>
              </div>
              {amount && (
                <div className="mt-1 text-[11px] text-[#86868b] flex justify-between font-mono">
                  <span>Stok Setelahnya:</span>
                  <strong className="text-[#34c759]">{Math.round(simulatedStock * 100) / 100} {selectedMaterial?.unit}</strong>
                </div>
              )}
            </div>

          </div>

          {/* Row 2: Keperluan Produk & Detail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#f2f2f7]">
            {/* Keperluan Produksi Produk */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">
                Keperluan Produk Mortar
              </label>
              <select
                value={forProduct}
                onChange={(e) => setForProduct(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
              >
                <option value="">- Umum / Gudang -</option>
                {activePlanProducts.map(pName => (
                  <option key={pName} value={pName}>Produksi {pName}</option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Tanggal</label>
              <input
                type="date"
                value={trxDate}
                onChange={(e) => setTrxDate(e.target.value)}
                required
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] font-mono focus:outline-none focus:border-[#34c759]"
              />
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Keterangan / No. PO</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="No. Surat Jalan / Batch"
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Operator / PIC</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama staf"
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#34c759] hover:bg-[#2fb350] text-white font-semibold text-xs rounded-full shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Mutasi'}
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat Mutasi */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7]">
          <div>
            <h2 className="text-sm font-bold text-[#1d1d1f]">
              Riwayat Mutasi & Audit Trail
            </h2>
            <p className="text-[11px] text-[#86868b]">
              Pencatatan mutasi lengkap dengan peruntukan produk mortar
            </p>
          </div>
          <button
            onClick={exportHistoryCSV}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#f5f5f7] hover:bg-[#ebebf0] text-[#1d1d1f] text-xs font-semibold rounded-full transition-all"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#34c759]" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 my-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari..."
              className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
            />
          </div>

          <select
            value={matFilter}
            onChange={(e) => setMatFilter(e.target.value)}
            className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
          >
            <option value="all">Semua Material</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
          >
            <option value="all">Semua Tipe</option>
            <option value="in">Masuk (+)</option>
            <option value="out">Keluar (-)</option>
            <option value="adjust">Opname (=)</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
          >
            <option value="all">Semua Keperluan Produk</option>
            <option value="none">Tanpa Produk (Umum)</option>
            {activePlanProducts.map(pName => (
              <option key={pName} value={pName}>{pName}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1d1d1f]">
            <thead className="text-[#86868b] text-[11px] uppercase border-b border-[#f2f2f7]">
              <tr>
                <th className="py-2.5 px-2">Tanggal</th>
                <th className="py-2.5 px-2">Material</th>
                <th className="py-2.5 px-2">Tipe</th>
                <th className="py-2.5 px-2">Jumlah</th>
                <th className="py-2.5 px-2">Untuk Produk</th>
                <th className="py-2.5 px-2">Sisa Gudang</th>
                <th className="py-2.5 px-2">Keterangan</th>
                <th className="py-2.5 px-2">PIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f2f7]">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[#86868b]">
                    Belum ada riwayat mutasi stok.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((trx) => (
                  <tr key={trx.id} className="hover:bg-[#f5f5f7]/50">
                    <td className="py-2 px-2 font-mono text-[#86868b]">{trx.date}</td>
                    <td className="py-2 px-2 font-semibold text-[#1d1d1f]">{trx.materialName}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        trx.type === 'in' 
                          ? 'bg-[#e8f7ec] text-[#34c759]' 
                          : trx.type === 'out' 
                          ? 'bg-[#fff0ed] text-[#ff3b30]' 
                          : 'bg-[#f2f2f7] text-[#1d1d1f]'
                      }`}>
                        {trx.type === 'in' ? 'Masuk' : trx.type === 'out' ? 'Keluar' : 'Opname'}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-[#1d1d1f]">
                      {trx.type === 'in' ? `+${trx.amount}` : `-${trx.amount}`} {trx.unit}
                    </td>
                    <td className="py-2 px-2">
                      {trx.forProduct ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef7ff] text-[#007aff] border border-[#007aff]/15 flex items-center gap-1 w-fit">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{trx.forProduct}</span>
                        </span>
                      ) : (
                        <span className="text-[#86868b]/60 text-[11px]">-</span>
                      )}
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
