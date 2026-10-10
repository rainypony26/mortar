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

export interface ProductMaterialRequirement {
  materialId: string;
  materialName: string;
  unit: 'Ton' | 'Kg' | 'Pcs';
  estimasi: number;
}

export interface ProductPlanItem {
  productId: string;
  productName: string;
  requirements: ProductMaterialRequirement[];
}

export interface MonthlyPlan {
  period: string; // YYYY-MM
  monthName: string;
  status: string;
  planType?: 'material_only' | 'by_product';
  materialsPlan: MaterialPlanItem[];
  productsPlan?: ProductPlanItem[];
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
  forProduct?: string;
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
