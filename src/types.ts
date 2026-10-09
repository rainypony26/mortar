export interface Material {
  id: string;
  code: string;
  name: string;
  unit: 'Ton' | 'Kg' | 'Pcs';
  currentStock: number;
  minStock: number;
  maxStock: number;
}

export interface MaterialPlanItem {
  materialId: string;
  name: string;
  unit: 'Ton' | 'Kg' | 'Pcs';
  estimasi: number;
  realisasi: number;
}

export interface MonthlyPlan {
  period: string; // YYYY-MM
  monthName: string;
  status: string;
  materialsPlan: MaterialPlanItem[];
}

export interface Transaction {
  id: string;
  date: string;
  materialId: string;
  materialName: string;
  type: 'in' | 'out' | 'adjust';
  amount: number;
  unit: string;
  previousStock: number;
  currentStock: number;
  notes: string;
  operator: string;
  createdAt: string;
}

export interface DashboardData {
  kpi: {
    totalMaterial: number;
    totalMaterialMenipis: number;
    totalMasukBulanIni: number;
    totalKeluarBulanIni: number;
  };
  materials: Material[];
  lowStockMaterials: Material[];
  activePlan: MonthlyPlan | null;
  allPlans: { period: string; monthName: string }[];
  recentTransactions: Transaction[];
}
