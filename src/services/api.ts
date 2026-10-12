import type { DashboardData, Material, MonthlyPlan, Transaction } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'mortar_monitoring_db_v1';

// Template 8 Material Utama (Default Awal = 0)
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

function getLocalDB(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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

// Mapper Supabase Material ke Interface App
function mapSupabaseMaterial(row: any): Material {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    unit: row.unit,
    currentStock: Number(row.current_stock) || 0,
    minStock: Number(row.min_stock) || 0,
    maxStock: Number(row.max_stock) || 0
  };
}

// Mapper Supabase MonthlyPlan ke Interface App
function mapSupabasePlan(row: any): MonthlyPlan {
  return {
    period: row.period,
    monthName: row.month_name,
    status: row.status || 'Aktif',
    planType: row.plan_type || 'by_product',
    materialsPlan: row.materials_plan || [],
    productsPlan: row.products_plan || []
  };
}

// Mapper Supabase Transaction ke Interface App
function mapSupabaseTransaction(row: any): Transaction {
  return {
    id: row.id,
    date: row.date,
    materialId: row.material_id,
    materialName: row.material_name,
    type: row.type,
    amount: Number(row.amount) || 0,
    unit: row.unit,
    previousStock: Number(row.previous_stock) || 0,
    currentStock: Number(row.current_stock) || 0,
    notes: row.notes || '-',
    operator: row.operator || 'Operator',
    forProduct: row.for_product || '',
    createdAt: row.created_at || new Date().toISOString()
  };
}

export const api = {
  // 1. Ambil Data Dashboard
  async getDashboard(period?: string): Promise<DashboardData> {
    try {
      const materials = await this.getMaterials();
      const currentPeriod = period || new Date().toISOString().slice(0, 7);

      // Ambil Plan Aktif dari Supabase
      const { data: planData } = await supabase
        .from('monthly_plans')
        .select('*')
        .eq('period', currentPeriod)
        .maybeSingle();

      let activePlan: MonthlyPlan | null = null;
      if (planData) {
        activePlan = mapSupabasePlan(planData);
      } else {
        // Ambil plan terbaru jika ada
        const { data: latestPlans } = await supabase
          .from('monthly_plans')
          .select('*')
          .order('period', { ascending: false })
          .limit(1);
        if (latestPlans && latestPlans.length > 0) {
          activePlan = mapSupabasePlan(latestPlans[0]);
        }
      }

      // Ambil Semua List Plan
      const { data: allPlansData } = await supabase
        .from('monthly_plans')
        .select('period, month_name')
        .order('period', { ascending: false });

      // Ambil 10 Transaksi Terkini
      const { data: trxsData } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      // Hitung KPI
      const lowStockMaterials = materials.filter(m => m.currentStock <= m.minStock);

      const { data: monthTrxs } = await supabase
        .from('transactions')
        .select('type')
        .ilike('date', `${currentPeriod}%`);

      const totalMasuk = monthTrxs ? monthTrxs.filter(t => t.type === 'in').length : 0;
      const totalKeluar = monthTrxs ? monthTrxs.filter(t => t.type === 'out').length : 0;

      const recentTransactions = trxsData ? trxsData.map(mapSupabaseTransaction) : [];

      return {
        kpi: {
          totalMaterial: materials.length,
          totalMaterialMenipis: lowStockMaterials.length,
          totalMasukBulanIni: totalMasuk,
          totalKeluarBulanIni: totalKeluar
        },
        materials,
        lowStockMaterials,
        activePlan,
        allPlans: (allPlansData || []).map((p: any) => ({ period: p.period, monthName: p.month_name })),
        recentTransactions
      };
    } catch (e) {
      console.warn('Supabase getDashboard offline, fallback ke local storage:', e);
    }

    // Fallback Local Storage
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

  // 2. Ambil Daftar 8 Material
  async getMaterials(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('id');

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapSupabaseMaterial);
        // Simpan salinan ke local storage sebagai backup
        const db = getLocalDB();
        db.materials = mapped;
        saveLocalDB(db);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase getMaterials offline, fallback local:', e);
    }

    return getLocalDB().materials;
  },

  // 3. Ambil Perencanaan
  async getPlans(): Promise<MonthlyPlan[]> {
    try {
      const { data, error } = await supabase
        .from('monthly_plans')
        .select('*')
        .order('period', { ascending: false });

      if (!error && data) {
        return data.map(mapSupabasePlan);
      }
    } catch (e) {
      console.warn('Supabase getPlans offline, fallback local:', e);
    }

    return getLocalDB().monthlyPlans;
  },

  // 4. Simpan Perencanaan Bulanan (Aturan 1 Planning Aktif)
  async savePlan(plan: MonthlyPlan): Promise<{ success: boolean; plan: MonthlyPlan }> {
    try {
      // Upsert ke Supabase
      const { error } = await supabase
        .from('monthly_plans')
        .upsert({
          period: plan.period,
          month_name: plan.monthName,
          status: plan.status || 'Aktif',
          plan_type: plan.planType || 'by_product',
          materials_plan: plan.materialsPlan,
          products_plan: plan.productsPlan || [],
          updated_at: new Date().toISOString()
        });

      if (!error) {
        // Backup ke local storage
        const db = getLocalDB();
        db.monthlyPlans = [plan];
        saveLocalDB(db);
        return { success: true, plan };
      } else {
        console.error('Supabase savePlan error:', error);
      }
    } catch (e) {
      console.warn('Supabase savePlan offline, simpan ke local storage:', e);
    }

    const db = getLocalDB();
    db.monthlyPlans = [plan];
    saveLocalDB(db);
    return { success: true, plan };
  },

  // 5. Reset & Hapus Semua Data
  async deletePlan(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Reset stok seluruh material ke 0 di Supabase
      await supabase
        .from('materials')
        .update({ current_stock: 0, updated_at: new Date().toISOString() })
        .neq('id', '');

      // 2. Kosongkan monthly_plans di Supabase
      await supabase
        .from('monthly_plans')
        .delete()
        .neq('period', '');

      // 3. Kosongkan transactions di Supabase
      await supabase
        .from('transactions')
        .delete()
        .neq('id', '');
    } catch (e) {
      console.warn('Supabase deletePlan error:', e);
    }

    // Reset local storage juga
    const db = getLocalDB();
    db.materials = initialMaterials.map(m => ({ ...m, currentStock: 0 }));
    db.monthlyPlans = [];
    db.transactions = [];
    saveLocalDB(db);

    return { success: true, message: 'Seluruh data berhasil direset bersih ke 0.' };
  },

  // 6. Ambil Riwayat Transaksi Mutasi
  async getTransactions(params?: { materialId?: string; type?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (params?.materialId) query = query.eq('material_id', params.materialId);
      if (params?.type) query = query.eq('type', params.type);
      if (params?.startDate) query = query.gte('date', params.startDate);
      if (params?.endDate) query = query.lte('date', params.endDate);

      const { data, error } = await query;
      if (!error && data) {
        return data.map(mapSupabaseTransaction);
      }
    } catch (e) {
      console.warn('Supabase getTransactions offline, fallback local:', e);
    }

    let trxs = getLocalDB().transactions;
    if (params?.materialId) trxs = trxs.filter(t => t.materialId === params.materialId);
    if (params?.type) trxs = trxs.filter(t => t.type === params.type);
    if (params?.startDate) trxs = trxs.filter(t => t.date >= params.startDate!);
    if (params?.endDate) trxs = trxs.filter(t => t.date <= params.endDate!);
    return trxs;
  },

  // 7. Simpan Mutasi Stok Baru (Fase 2)
  async createTransaction(payload: {
    materialId: string;
    type: 'in' | 'out' | 'adjust';
    amount: number;
    notes: string;
    operator: string;
    date: string;
    forProduct?: string;
  }): Promise<{ success: boolean; transaction: Transaction; updatedMaterial: Material }> {
    const materials = await this.getMaterials();
    const mat = materials.find(m => m.id === payload.materialId);
    if (!mat) throw new Error('Material tidak ditemukan');

    const prevStock = Number(mat.currentStock) || 0;
    let nextStock = prevStock;

    if (payload.type === 'in') nextStock += payload.amount;
    else if (payload.type === 'out') nextStock = Math.max(0, prevStock - payload.amount);
    else if (payload.type === 'adjust') nextStock = payload.amount;

    nextStock = Math.round(nextStock * 100) / 100;
    const updatedMaterial: Material = { ...mat, currentStock: nextStock };

    const newTrx: Transaction = {
      id: 'trx-' + Date.now(),
      date: payload.date,
      materialId: mat.id,
      materialName: mat.name,
      type: payload.type,
      amount: payload.amount,
      unit: mat.unit,
      previousStock: prevStock,
      currentStock: nextStock,
      notes: payload.notes || '-',
      operator: payload.operator || 'Operator',
      forProduct: payload.forProduct || '',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Simpan transaksi ke Supabase
      const { error: trxError } = await supabase.from('transactions').insert({
        id: newTrx.id,
        date: newTrx.date,
        material_id: newTrx.materialId,
        material_name: newTrx.materialName,
        type: newTrx.type,
        amount: newTrx.amount,
        unit: newTrx.unit,
        previous_stock: newTrx.previousStock,
        current_stock: newTrx.currentStock,
        notes: newTrx.notes,
        operator: newTrx.operator,
        for_product: newTrx.forProduct,
        created_at: newTrx.createdAt
      });

      // 2. Update stok material di Supabase
      const { error: matError } = await supabase
        .from('materials')
        .update({ current_stock: nextStock, updated_at: new Date().toISOString() })
        .eq('id', mat.id);

      // 3. Jika mutasi 'out', update realisasi pemakaian di active plan
      if (payload.type === 'out') {
        const currentPeriod = payload.date.slice(0, 7);
        const { data: planData } = await supabase
          .from('monthly_plans')
          .select('*')
          .eq('period', currentPeriod)
          .maybeSingle();

        if (planData && planData.materials_plan) {
          const updatedMaterialsPlan = planData.materials_plan.map((mp: any) => {
            if (mp.materialId === mat.id) {
              return { ...mp, realisasi: (Number(mp.realisasi) || 0) + payload.amount };
            }
            return mp;
          });

          await supabase
            .from('monthly_plans')
            .update({ materials_plan: updatedMaterialsPlan, updated_at: new Date().toISOString() })
            .eq('period', currentPeriod);
        }
      }

      if (!trxError && !matError) {
        // Sync ke local storage
        const db = getLocalDB();
        const mIdx = db.materials.findIndex(m => m.id === payload.materialId);
        if (mIdx !== -1) db.materials[mIdx] = updatedMaterial;
        db.transactions.unshift(newTrx);
        saveLocalDB(db);

        return { success: true, transaction: newTrx, updatedMaterial };
      }
    } catch (e) {
      console.warn('Supabase createTransaction offline, simpan ke local storage:', e);
    }

    // Fallback jika Supabase offline
    const db = getLocalDB();
    const mIdx = db.materials.findIndex(m => m.id === payload.materialId);
    if (mIdx !== -1) db.materials[mIdx] = updatedMaterial;
    db.transactions.unshift(newTrx);
    saveLocalDB(db);

    return { success: true, transaction: newTrx, updatedMaterial };
  }
};
