import type { DashboardData, Material, MonthlyPlan, Transaction } from '../types';

const STORAGE_KEY = 'mortar_monitoring_db_v1';
const API_BASE = '/api';

// Template 8 Material Utama Murni (Awal = 0)
const initialMaterials: Material[] = [
  { id: 'mat-1', code: 'KP-150', name: 'Kapur mesh 150', unit: 'Ton', currentStock: 0, minStock: 20, maxStock: 100 },
  { id: 'mat-2', code: 'KP-200', name: 'Kapur mesh 200', unit: 'Ton', currentStock: 0, minStock: 20, maxStock: 100 },
  { id: 'mat-3', code: 'AD-NXC', name: 'Additive nexco', unit: 'Kg', currentStock: 0, minStock: 50, maxStock: 250 },
  { id: 'mat-4', code: 'AD-WLM', name: 'Additive wellmocell', unit: 'Kg', currentStock: 0, minStock: 40, maxStock: 200 },
  { id: 'mat-5', code: 'PS-SLK', name: 'Pasir silika', unit: 'Kg', currentStock: 0, minStock: 5000, maxStock: 50000 },
  { id: 'mat-6', code: 'SM-PCC', name: 'Semen pcc', unit: 'Ton', currentStock: 0, minStock: 25, maxStock: 120 },
  { id: 'mat-7', code: 'KB-WVN', name: 'Woven', unit: 'Pcs', currentStock: 0, minStock: 1500, maxStock: 10000 },
  { id: 'mat-8', code: 'KB-PPR', name: 'Paper', unit: 'Pcs', currentStock: 0, minStock: 1200, maxStock: 8000 }
];

interface LocalDB {
  materials: Material[];
  monthlyPlans: MonthlyPlan[];
  transactions: Transaction[];
}

// Helper Local Storage
function getLocalDB(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error read local storage:', e);
  }

  const defaultDB: LocalDB = {
    materials: initialMaterials,
    monthlyPlans: [],
    transactions: []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDB));
  return defaultDB;
}

function saveLocalDB(data: LocalDB) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error write local storage:', e);
  }
}

export const api = {
  async getDashboard(period?: string): Promise<DashboardData> {
    // 1. Coba request ke backend server
    try {
      const url = period ? `${API_BASE}/dashboard?period=${period}` : `${API_BASE}/dashboard`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      // Backend offline di Vercel -> fallback langsung ke Local Database
    }

    // 2. Fallback aman: Gunakan data lokal browser
    const db = getLocalDB();
    const currentPeriod = period || (db.monthlyPlans[0]?.period || new Date().toISOString().slice(0, 7));
    const activePlan = db.monthlyPlans.find(p => p.period === currentPeriod) || db.monthlyPlans[0] || null;

    const lowStockMaterials = db.materials.filter(m => Number(m.currentStock) <= Number(m.minStock));
    const monthTrxs = db.transactions.filter(t => t.date && t.date.startsWith(currentPeriod));

    return {
      kpi: {
        totalMaterial: db.materials.length,
        totalMaterialMenipis: lowStockMaterials.length,
        totalMasukBulanIni: monthTrxs.filter(t => t.type === 'in').length,
        totalKeluarBulanIni: monthTrxs.filter(t => t.type === 'out').length
      },
      materials: db.materials,
      lowStockMaterials,
      activePlan,
      allPlans: db.monthlyPlans.map(p => ({ period: p.period, monthName: p.monthName })),
      recentTransactions: db.transactions.slice(0, 10)
    };
  },

  async getMaterials(): Promise<Material[]> {
    try {
      const res = await fetch(`${API_BASE}/materials`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return getLocalDB().materials;
  },

  async getPlans(): Promise<MonthlyPlan[]> {
    try {
      const res = await fetch(`${API_BASE}/plans`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return getLocalDB().monthlyPlans;
  },

  async savePlan(plan: MonthlyPlan): Promise<{ success: boolean; plan: MonthlyPlan }> {
    // Coba ke backend
    try {
      const res = await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      if (res.ok) {
        const data = await res.json();
        // Simpan juga ke local storage sebagai backup
        const db = getLocalDB();
        db.monthlyPlans = [data.plan || plan];
        saveLocalDB(db);
        return data;
      }
    } catch (e) {}

    // Fallback simpan di local storage
    const db = getLocalDB();
    db.monthlyPlans = [plan];
    saveLocalDB(db);
    return { success: true, plan };
  },

  async deletePlan(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/plans`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        // Reset local storage juga
        const db = getLocalDB();
        db.materials = initialMaterials;
        db.monthlyPlans = [];
        db.transactions = [];
        saveLocalDB(db);
        return data;
      }
    } catch (e) {}

    // Fallback reset total lokal
    const db = getLocalDB();
    db.materials = initialMaterials.map(m => ({ ...m, currentStock: 0 }));
    db.monthlyPlans = [];
    db.transactions = [];
    saveLocalDB(db);
    return { success: true, message: 'Seluruh data berhasil direset' };
  },

  async getTransactions(params?: { materialId?: string; type?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.materialId) searchParams.append('materialId', params.materialId);
      if (params?.type) searchParams.append('type', params.type);
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);

      const res = await fetch(`${API_BASE}/transactions?${searchParams.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    let trxs = getLocalDB().transactions;
    if (params?.materialId) trxs = trxs.filter(t => t.materialId === params.materialId);
    if (params?.type) trxs = trxs.filter(t => t.type === params.type);
    if (params?.startDate) trxs = trxs.filter(t => t.date >= params.startDate!);
    if (params?.endDate) trxs = trxs.filter(t => t.date <= params.endDate!);
    return trxs;
  },

  async createTransaction(payload: {
    materialId: string;
    type: 'in' | 'out' | 'adjust';
    amount: number;
    notes: string;
    operator: string;
    date: string;
    forProduct?: string;
  }): Promise<{ success: boolean; transaction: Transaction; updatedMaterial: Material }> {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        // Sync local storage
        const db = getLocalDB();
        const mIdx = db.materials.findIndex(m => m.id === payload.materialId);
        if (mIdx !== -1) db.materials[mIdx] = data.updatedMaterial;
        db.transactions.unshift(data.transaction);
        saveLocalDB(db);
        return data;
      }
    } catch (e) {}

    // Fallback mutasi langsung di local storage
    const db = getLocalDB();
    const mIdx = db.materials.findIndex(m => m.id === payload.materialId);
    if (mIdx === -1) throw new Error('Material tidak ditemukan');

    const mat = db.materials[mIdx];
    const prevStock = Number(mat.currentStock) || 0;
    let nextStock = prevStock;

    if (payload.type === 'in') nextStock += payload.amount;
    else if (payload.type === 'out') nextStock = Math.max(0, prevStock - payload.amount);
    else if (payload.type === 'adjust') nextStock = payload.amount;

    mat.currentStock = Math.round(nextStock * 100) / 100;
    db.materials[mIdx] = mat;

    const newTrx: Transaction = {
      id: 'trx-' + Date.now(),
      date: payload.date,
      materialId: mat.id,
      materialName: mat.name,
      type: payload.type,
      amount: payload.amount,
      unit: mat.unit,
      previousStock: prevStock,
      currentStock: mat.currentStock,
      notes: payload.notes || '-',
      operator: payload.operator || 'Operator',
      forProduct: payload.forProduct || '',
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(newTrx);
    saveLocalDB(db);

    return {
      success: true,
      transaction: newTrx,
      updatedMaterial: mat
    };
  },

  async updateActuals(period: string, actuals: Array<{ materialId: string; realisasi: number }>): Promise<{ success: boolean; plan: MonthlyPlan }> {
    try {
      const res = await fetch(`${API_BASE}/actuals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, actuals })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    const plan = db.monthlyPlans.find(p => p.period === period) || db.monthlyPlans[0];
    if (plan && plan.materialsPlan) {
      actuals.forEach(act => {
        const item = plan.materialsPlan.find(m => m.materialId === act.materialId);
        if (item) item.realisasi = act.realisasi;
      });
      saveLocalDB(db);
    }
    return { success: true, plan: plan || ({} as any) };
  }
};
