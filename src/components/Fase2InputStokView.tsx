import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  FileSpreadsheet
} from 'lucide-react';
import type { Material, MonthlyPlan, Transaction } from '../types';
import { api } from '../services/api';

interface Fase2Props {
  materials: Material[];
  currentPlan: MonthlyPlan | null;
  transactions: Transaction[];
  onDataUpdated: () => void;
}

export const Fase2InputStokView: React.FC<Fase2Props> = ({
  materials,
  transactions,
  onDataUpdated
}) => {
  // Form State: Mutasi Stok Material
  const [selectedMatId, setSelectedMatId] = useState<string>(materials[0]?.id || 'mat-1');
  const [trxType, setTrxType] = useState<'in' | 'out' | 'adjust'>('in');
  const [amount, setAmount] = useState<string>('');
  const [trxDate, setTrxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // History Filter State
  const [searchFilter, setSearchFilter] = useState('');
  const [matFilter, setMatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const selectedMaterial = materials.find(m => m.id === selectedMatId) || materials[0];

  const numAmount = Number(amount) || 0;
  let simulatedStock = selectedMaterial ? Number(selectedMaterial.currentStock) : 0;
  if (trxType === 'in') simulatedStock += numAmount;
  else if (trxType === 'out') simulatedStock = Math.max(0, simulatedStock - numAmount);
  else if (trxType === 'adjust') simulatedStock = numAmount;

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
        date: trxDate
      });

      setFeedback({
        type: 'success',
        message: `${selectedMaterial.name} diperbarui: ${trxType === 'in' ? '+' : '-'}${amount} ${selectedMaterial.unit}`
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
    const matchSearch = searchFilter === '' || 
      t.materialName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.notes.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.operator.toLowerCase().includes(searchFilter.toLowerCase());
    return matchMat && matchType && matchSearch;
  });

  const exportHistoryCSV = () => {
    const headers = ['ID,Tanggal,Material,Tipe,Jumlah,Satuan,Stok_Sebelum,Stok_Sesudah,Keterangan,Operator'];
    const rows = filteredHistory.map(t => 
      `"${t.id}","${t.date}","${t.materialName}","${t.type}","${t.amount}","${t.unit}","${t.previousStock}","${t.currentStock}","${t.notes.replace(/"/g, '""')}","${t.operator}"`
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
            Fase 2: Input Stok
          </h1>
          <span className="text-xs text-[#86868b]">
            Input Penerimaan, Pemakaian, dan Riwayat Stok 8 Material Utama
          </span>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
          feedback.type === 'success' 
            ? 'bg-[#e8f7ec] border-[#34c759]/20 text-[#248a3d]' 
            : 'bg-[#ff3b30]/10 border-[#ff3b30]/20 text-[#ff3b30]'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* FORM INPUT MUTASI STOK */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Material */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">
                Material
              </label>
              <select
                value={selectedMatId}
                onChange={(e) => setSelectedMatId(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759] font-semibold"
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.currentStock} {m.unit})
                  </option>
                ))}
              </select>
              <div className="mt-1 flex justify-between text-[11px] text-[#86868b]">
                <span>Satuan: <strong className="text-[#34c759]">{selectedMaterial?.unit}</strong></span>
                <span>Stok: <strong>{selectedMaterial?.currentStock} {selectedMaterial?.unit}</strong></span>
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
                  <span>Sisa Nanti:</span>
                  <strong className="text-[#34c759]">{Math.round(simulatedStock * 100) / 100} {selectedMaterial?.unit}</strong>
                </div>
              )}
            </div>

          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#f2f2f7]">
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

            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Keterangan / PO</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nomor PO / Batch produksi"
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] focus:outline-none focus:border-[#34c759]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868b] mb-1">Operator / PIC</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama penanggung jawab"
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
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7]">
          <h2 className="text-sm font-bold text-[#1d1d1f]">
            Riwayat Mutasi & Audit Trail
          </h2>
          <button
            onClick={exportHistoryCSV}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#f5f5f7] hover:bg-[#ebebf0] text-[#1d1d1f] text-xs font-semibold rounded-full transition-all"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#34c759]" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3">
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#86868b]">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((trx) => (
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
