import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { Fase1PerencanaanView } from './components/Fase1PerencanaanView';
import { Fase2InputStokView } from './components/Fase2InputStokView';
import { ReportView } from './components/ReportView';
import { api } from './services/api';
import type { DashboardData, Material, MonthlyPlan, Transaction } from './types';
import { Loader2, AlertCircle, Menu, X, Factory } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fase1' | 'fase2' | 'report'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentPlan, setCurrentPlan] = useState<MonthlyPlan | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dash, mats, plans, trxs] = await Promise.all([
        api.getDashboard(),
        api.getMaterials(),
        api.getPlans(),
        api.getTransactions()
      ]);

      setDashboardData(dash);
      setMaterials(mats);
      setCurrentPlan(dash.activePlan || plans[0] || null);
      setTransactions(trxs);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Gagal terhubung ke backend API. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockCount = dashboardData?.lowStockMaterials.length || 0;

  const handleTabChange = (tab: 'dashboard' | 'fase1' | 'fase2' | 'report') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Bar (Only on small screens) */}
      <div className="md:hidden bg-white border-b border-[#e5e5ea] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#34c759] text-white flex items-center justify-center">
            <Factory className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#1d1d1f]">
            Mortar<span className="text-[#34c759]">Flow</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-[#1d1d1f] hover:bg-[#f5f5f7]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          lowStockCount={lowStockCount} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#34c759]" />
              <p className="text-xs text-[#86868b] tracking-wide font-medium">
                Memuat data operasional pabrik mortar...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 bg-white border border-black/[0.06] rounded-2xl text-center space-y-3 my-12 max-w-lg mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <AlertCircle className="w-8 h-8 text-[#ff3b30] mx-auto" />
              <h3 className="text-base font-bold text-[#1d1d1f]">Gagal Menghubungkan Sistem</h3>
              <p className="text-xs text-[#86868b]">{error}</p>
              <button
                onClick={loadData}
                className="px-5 py-2 bg-[#34c759] hover:bg-[#2fb350] text-white rounded-full text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              >
                Coba Hubungkan Kembali
              </button>
            </div>
          ) : dashboardData ? (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  data={dashboardData}
                  onRefresh={loadData}
                  onNavigateToFase1={() => setActiveTab('fase1')}
                  onNavigateToFase2={() => setActiveTab('fase2')}
                />
              )}

              {activeTab === 'fase1' && (
                <Fase1PerencanaanView 
                  materials={materials}
                  currentPlan={currentPlan}
                  onSaved={loadData}
                  onNavigateToFase2={() => setActiveTab('fase2')}
                />
              )}

              {activeTab === 'fase2' && (
                <Fase2InputStokView 
                  materials={materials}
                  currentPlan={currentPlan}
                  transactions={transactions}
                  onDataUpdated={loadData}
                />
              )}

              {activeTab === 'report' && (
                <ReportView 
                  materials={materials}
                  currentPlan={currentPlan}
                  transactions={transactions}
                />
              )}
            </>
          ) : null}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-[#e5e5ea] py-4 text-center text-xs text-[#86868b] bg-transparent print:hidden px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} MortarFlow • Sistem Monitoring Pabrik Mortar</span>
            <div className="flex items-center gap-3">
              <span>8 Material Utama Terpantau</span>
              <span>•</span>
              <span>Audit Trail Aktif</span>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}

export default App;
