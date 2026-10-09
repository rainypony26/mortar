# MORTARFLOW — Sistem Monitoring Produksi Pabrik Mortar

Aplikasi web modern untuk monitoring produksi pabrik mortar dan pengawasan stok 8 material utama secara real-time.

---

## 🏭 8 Material Utama yang Dipantau & Satuannya

1. **Kapur Mesh 150** : `Ton`
2. **Kapur Mesh 200** : `Ton`
3. **Additive Nexco** : `Kg`
4. **Additive Wellmocell** : `Kg`
5. **Pasir Silika** : `Kg`
6. **Semen PCC** : `Ton`
7. **Woven** : `Pcs`
8. **Paper** : `Pcs`

---

## 📌 Alur Kerja Sistem (2 Fase Input)

### 🗓️ Fase 1: Perencanaan Produksi 1 Bulan
* Input target estimasi produksi mortar (Target Sak) per varian (Thinbed, Plester, Acian, Render).
* Input estimasi kebutuhan konsumsi 8 material utama selama 1 bulan.
* Data rencana menjadi patokan komparasi terhadap realisasi lapangan.

### 📦 Fase 2: Input Stok Masuk / Keluar & Realisasi
* **Input Mutasi Stok Material:**
  * **Masuk (+):** Penerimaan kiriman bahan baku dari supplier.
  * **Keluar (-):** Pemakaian material saat proses mixing produksi.
  * **Opname (=):** Penyesuaian stok riil hasil penghitungan fisik gudang.
* **Input Realisasi Sak:** Menambah output sak yang selesai diproduksi.
* **Full History Log:** Setiap mutasi mencatat tanggal, tipe, jumlah, stok sebelum & sesudah, keterangan/PO, dan nama operator penanggung jawab.

---

## 📊 Fitur Dashboard & Laporan

* **Total Produksi:** Menampilkan target estimasi sak vs realisasi riil sak dengan progress bar ketercapaian target (%).
* **Alert Stok Menipis:** Indikator merah & peringatan otomatis ketika stok material berada di bawah batas minimum (safety stock).
* **2 Grafik Komparasi per Item:**
  * Grafik 1: Estimasi (Rencana)
  * Grafik 2: Real (Aktual)
  * Dapat ditinjau per 8 material utama maupun per varian produk mortar.
* **Real Stock Monitoring:** 8 kartu material dengan visual gauge level sisa stok, status AMAN / MENIPIS, dan kapasitas maksimal.
* **Halaman Laporan (Report):**
  * Rekap komparasi resmi per bulan.
  * Tombol **Cetak / Print PDF** siap tanda tangan pimpinan (Admin, Kepala Shift, Plant Manager).
  * Tombol **Ekspor Excel (CSV)**.

---

## 🚀 Cara Menjalankan

Aplikasi sudah langsung berjalan di browser Anda:
* Buka browser: **http://localhost:3000**

Untuk menjalankan di kemudian hari:
1. Cukup double-click file `start.bat` di folder `D:\mortar`, ATAU
2. Buka terminal di `D:\mortar` lalu jalankan:
   ```bash
   npm start
   ```
