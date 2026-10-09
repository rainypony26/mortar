import type { DashboardData, Material, MonthlyPlan, Transaction } from '../types';

const API_BASE = '/api';

export const api = {
  async getDashboard(period?: string): Promise<DashboardData> {
    const url = period ? `${API_BASE}/dashboard?period=${period}` : `${API_BASE}/dashboard`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data dashboard');
    return res.json();
  },

  async getMaterials(): Promise<Material[]> {
    const res = await fetch(`${API_BASE}/materials`);
    if (!res.ok) throw new Error('Gagal mengambil data material');
    return res.json();
  },

  async getPlans(): Promise<MonthlyPlan[]> {
    const res = await fetch(`${API_BASE}/plans`);
    if (!res.ok) throw new Error('Gagal mengambil perencanaan bulanan');
    return res.json();
  },

  async savePlan(plan: MonthlyPlan): Promise<{ success: boolean; plan: MonthlyPlan }> {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perencanaan bulanan');
    return data;
  },

  async deletePlan(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menghapus perencanaan');
    return data;
  },

  async getTransactions(params?: { materialId?: string; type?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    const searchParams = new URLSearchParams();
    if (params?.materialId) searchParams.append('materialId', params.materialId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/transactions?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil riwayat transaksi');
    return res.json();
  },

  async createTransaction(payload: {
    materialId: string;
    type: 'in' | 'out' | 'adjust';
    amount: number;
    notes: string;
    operator: string;
    date: string;
  }): Promise<{ success: boolean; transaction: Transaction; updatedMaterial: Material }> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menyimpan transaksi stok');
    }
    return res.json();
  },

  async updateActuals(period: string, actuals: Array<{ materialId: string; realisasi: number }>): Promise<{ success: boolean; plan: MonthlyPlan }> {
    const res = await fetch(`${API_BASE}/actuals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, actuals })
    });
    if (!res.ok) throw new Error('Gagal memperbarui nilai aktual');
    return res.json();
  }
};
