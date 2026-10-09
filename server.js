import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
// Di serverless Vercel, filesystem bersifat read-only kecuali folder /tmp
const DB_PATH = process.env.VERCEL 
  ? path.join('/tmp', 'db.json') 
  : path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());

// Pure 8 Materials Template
const initialData = {
  materials: [
    { id: 'mat-1', code: 'KP-150', name: 'Kapur mesh 150', unit: 'Ton', currentStock: 0, minStock: 20, maxStock: 100 },
    { id: 'mat-2', code: 'KP-200', name: 'Kapur mesh 200', unit: 'Ton', currentStock: 0, minStock: 20, maxStock: 100 },
    { id: 'mat-3', code: 'AD-NXC', name: 'Additive nexco', unit: 'Kg', currentStock: 0, minStock: 50, maxStock: 250 },
    { id: 'mat-4', code: 'AD-WLM', name: 'Additive wellmocell', unit: 'Kg', currentStock: 0, minStock: 40, maxStock: 200 },
    { id: 'mat-5', code: 'PS-SLK', name: 'Pasir silika', unit: 'Kg', currentStock: 0, minStock: 5000, maxStock: 50000 },
    { id: 'mat-6', code: 'SM-PCC', name: 'Semen pcc', unit: 'Ton', currentStock: 0, minStock: 25, maxStock: 120 },
    { id: 'mat-7', code: 'KB-WVN', name: 'Woven', unit: 'Pcs', currentStock: 0, minStock: 1500, maxStock: 10000 },
    { id: 'mat-8', code: 'KB-PPR', name: 'Paper', unit: 'Pcs', currentStock: 0, minStock: 1200, maxStock: 8000 }
  ],
  monthlyPlans: [],
  transactions: []
};

// Helper: Read DB
function readDb() {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error reading DB:', err);
    return initialData;
  }
}

// Helper: Write DB
function writeDb(data) {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// ----------------- ROUTES ----------------- //

// GET /api/dashboard
app.get('/api/dashboard', (req, res) => {
  const db = readDb();
  const currentPeriod = req.query.period || '2026-10';
  const plan = db.monthlyPlans.find(p => p.period === currentPeriod) || db.monthlyPlans[0] || {
    period: currentPeriod,
    monthName: 'Oktober 2026',
    status: 'Aktif',
    materialsPlan: []
  };

  const lowStockMaterials = db.materials.filter(m => Number(m.currentStock) <= Number(m.minStock));

  const monthTrxs = db.transactions.filter(t => t.date && t.date.startsWith(currentPeriod));
  const totalMasukCount = monthTrxs.filter(t => t.type === 'in').length;
  const totalKeluarCount = monthTrxs.filter(t => t.type === 'out').length;

  res.json({
    kpi: {
      totalMaterial: db.materials.length,
      totalMaterialMenipis: lowStockMaterials.length,
      totalMasukBulanIni: totalMasukCount,
      totalKeluarBulanIni: totalKeluarCount
    },
    materials: db.materials,
    lowStockMaterials,
    activePlan: plan,
    allPlans: db.monthlyPlans.map(p => ({ period: p.period, monthName: p.monthName })),
    recentTransactions: db.transactions.slice(0, 10)
  });
});

// GET /api/materials
app.get('/api/materials', (req, res) => {
  const db = readDb();
  res.json(db.materials);
});

// GET /api/plans
app.get('/api/plans', (req, res) => {
  const db = readDb();
  res.json(db.monthlyPlans);
});

// POST /api/plans - Simpan estimasi bulanan (HANYA 1 PLANNING YANG BERLAKU)
app.post('/api/plans', (req, res) => {
  const { period, monthName, materialsPlan } = req.body;
  if (!period) {
    return res.status(400).json({ error: 'Periode (YYYY-MM) wajib diisi' });
  }

  const db = readDb();
  
  // Jika sudah ada planning dengan periode berbeda dan user belum hapus:
  // Aturan: Hanya boleh ada 1 planning.
  if (db.monthlyPlans.length > 0 && db.monthlyPlans[0].period !== period) {
    return res.status(400).json({ 
      error: 'Sudah ada perencanaan aktif (' + db.monthlyPlans[0].monthName + '). Hapus perencanaan lama terlebih dahulu sebelum membuat baru.' 
    });
  }

  const planData = {
    period,
    monthName: monthName || period,
    status: 'Aktif',
    materialsPlan: materialsPlan || []
  };

  // Simpan sebagai satu-satunya planning aktif
  db.monthlyPlans = [planData];
  writeDb(db);
  res.json({ success: true, plan: planData });
});

// DELETE /api/plans - Reset total: hapus perencanaan, kosongkan transaksi, dan reset stok 8 material jadi 0
app.delete('/api/plans', (req, res) => {
  const db = readDb();
  
  // 1. Reset stok seluruh material ke 0
  db.materials = db.materials.map(m => ({
    ...m,
    currentStock: 0
  }));

  // 2. Kosongkan perencanaan bulanan
  db.monthlyPlans = [];

  // 3. Kosongkan seluruh riwayat transaksi
  db.transactions = [];

  writeDb(db);
  res.json({ success: true, message: 'Semua data dan perencanaan berhasil direset bersih ke 0.' });
});

// POST /api/actuals - Update nilai hasil aktual 8 material langsung
app.post('/api/actuals', (req, res) => {
  const { period, actuals } = req.body; // actuals: [{ materialId, realisasi }]
  if (!period || !Array.isArray(actuals)) {
    return res.status(400).json({ error: 'Data period dan actuals wajib dikirim' });
  }

  const db = readDb();
  let plan = db.monthlyPlans.find(p => p.period === period);
  if (!plan) {
    plan = {
      period,
      monthName: period,
      status: 'Aktif',
      materialsPlan: db.materials.map(m => ({
        materialId: m.id,
        name: m.name,
        unit: m.unit,
        estimasi: 0,
        realisasi: 0
      }))
    };
    db.monthlyPlans.unshift(plan);
  }

  actuals.forEach(act => {
    const mat = plan.materialsPlan?.find(m => m.materialId === act.materialId);
    if (mat && act.realisasi !== undefined) {
      mat.realisasi = Number(act.realisasi) || 0;
    }
  });

  writeDb(db);
  res.json({ success: true, plan });
});

// GET /api/transactions
app.get('/api/transactions', (req, res) => {
  const db = readDb();
  const { materialId, type, startDate, endDate } = req.query;

  let filtered = [...db.transactions];
  if (materialId) {
    filtered = filtered.filter(t => t.materialId === materialId);
  }
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }
  if (startDate) {
    filtered = filtered.filter(t => t.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(t => t.date <= endDate);
  }

  res.json(filtered);
});

// POST /api/transactions - Mutasi Stok Material (Fase 2)
app.post('/api/transactions', (req, res) => {
  const { materialId, type, amount, notes, operator, date } = req.body;

  if (!materialId || !type || amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Data material, tipe, dan jumlah (harus > 0) wajib diisi' });
  }

  const db = readDb();
  const matIndex = db.materials.findIndex(m => m.id === materialId);

  if (matIndex === -1) {
    return res.status(404).json({ error: 'Material tidak ditemukan' });
  }

  const material = db.materials[matIndex];
  const numAmount = Number(amount);
  const previousStock = Number(material.currentStock) || 0;
  let newStock = previousStock;

  if (type === 'in') {
    newStock = previousStock + numAmount;
  } else if (type === 'out') {
    newStock = Math.max(0, previousStock - numAmount);
  } else if (type === 'adjust') {
    newStock = numAmount;
  } else {
    return res.status(400).json({ error: 'Tipe transaksi tidak valid' });
  }

  // Update stok material
  material.currentStock = Math.round(newStock * 100) / 100;
  db.materials[matIndex] = material;

  // Catat transaksi
  const transaction = {
    id: 'trx-' + Date.now(),
    date: date || new Date().toISOString().split('T')[0],
    materialId: material.id,
    materialName: material.name,
    type,
    amount: numAmount,
    unit: material.unit,
    previousStock: Math.round(previousStock * 100) / 100,
    currentStock: material.currentStock,
    notes: notes || '-',
    operator: operator || 'Operator',
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(transaction);

  // Jika mutasi adalah pemakaian ('out'), otomatis tambahkan ke realisasi rencana bulanan
  const currentPeriod = transaction.date.slice(0, 7);
  let activePlan = db.monthlyPlans.find(p => p.period === currentPeriod);
  if (!activePlan) {
    activePlan = {
      period: currentPeriod,
      monthName: currentPeriod,
      status: 'Aktif',
      materialsPlan: db.materials.map(m => ({
        materialId: m.id,
        name: m.name,
        unit: m.unit,
        estimasi: 0,
        realisasi: 0
      }))
    };
    db.monthlyPlans.unshift(activePlan);
  }

  if (type === 'out' && activePlan.materialsPlan) {
    const matPlan = activePlan.materialsPlan.find(m => m.materialId === material.id);
    if (matPlan) {
      matPlan.realisasi = Math.round(((matPlan.realisasi || 0) + numAmount) * 100) / 100;
    }
  }

  writeDb(db);
  res.json({ success: true, transaction, updatedMaterial: material });
});

// POST /api/reset - Reset bersih
app.post('/api/reset', (req, res) => {
  writeDb(initialData);
  res.json({ success: true, message: 'Database berhasil direset bersih' });
});

// Serve frontend build (dist) untuk production hosting
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server jika dijalankan lokal (bukan serverless Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Mortar Monitoring API running on http://localhost:${PORT}`);
  });
}

export default app;
