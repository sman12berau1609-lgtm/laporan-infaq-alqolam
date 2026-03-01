import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("musholla.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    donation_item TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check if donation_item column exists (for existing databases)
try {
  db.prepare("SELECT donation_item FROM transactions LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE transactions ADD COLUMN donation_item TEXT");
}

// Clean up existing descriptions (remove trailing numbers)
const allTransactions = db.prepare("SELECT id, description FROM transactions").all() as { id: number, description: string }[];
const updateDesc = db.prepare("UPDATE transactions SET description = ? WHERE id = ?");
allTransactions.forEach(t => {
  const cleaned = t.description.replace(/\s+\d+$/, '');
  if (cleaned !== t.description) {
    updateDesc.run(cleaned, t.id);
  }
});

  // Seed sample data if empty
  const count = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number };
  if (count.count === 0) {
    const seedData: any[] = [
      ['2024-01-02', 'Saldo Awal Desember', 'Lain-lain', 5000000, 'income', null],
      ['2024-01-05', 'Infaq Jumat Minggu 1', 'Infaq Jumat', 1250000, 'income', null],
      ['2024-01-10', 'Pembelian Karpet Baru', 'Sarana Prasarana', 2500000, 'expense', null],
      ['2024-01-12', 'Infaq Jumat Minggu 2', 'Infaq Jumat', 1100000, 'income', null],
      ['2024-01-15', 'Biaya Kebersihan Bulanan', 'Operasional', 300000, 'expense', null],
      ['2024-01-19', 'Infaq Jumat Minggu 3', 'Infaq Jumat', 1350000, 'income', null],
      ['2024-01-20', 'Perbaikan Sound System', 'Pemeliharaan', 450000, 'expense', null],
      ['2024-01-25', 'Konsumsi Pengajian Rutin', 'Kegiatan', 600000, 'expense', null],
      ['2024-01-26', 'Infaq Jumat Minggu 4', 'Infaq Jumat', 1200000, 'income', null],
      ['2024-01-28', 'Infaq Bulanan Januari', 'Infaq Bulanan', 2000000, 'income', null],
      ['2024-02-02', 'Infaq Jumat Feb W1', 'Infaq Jumat', 1000000, 'income', null],
      ['2024-02-05', 'Listrik Musholla', 'Operasional', 250000, 'expense', null],
    ];

    // Add more dummy data to reach 50+
    for (let i = 1; i <= 40; i++) {
      const day = (i % 28) + 1;
      const month = i <= 20 ? '01' : '02';
      const date = `2024-${month}-${day.toString().padStart(2, '0')}`;
      const type = i % 3 === 0 ? 'expense' : 'income';
      const amount = Math.floor(Math.random() * 500000) + 50000;
      const desc = type === 'income' ? `Infaq Harian` : `Biaya Operasional`;
      const cat = type === 'income' ? 'Infaq Harian' : 'Operasional';
      seedData.push([date, desc, cat, amount, type, null]);
    }

    const insert = db.prepare("INSERT INTO transactions (date, description, category, amount, type, donation_item) VALUES (?, ?, ?, ?, ?, ?)");
    seedData.forEach(row => insert.run(...row));
  }

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/transactions", (req, res) => {
    try {
      const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC").all();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { date, description, category, amount, type, donation_item } = req.body;
    if (!date || !description || !category || amount === undefined || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare(
        "INSERT INTO transactions (date, description, category, amount, type, donation_item) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(date, description, category, amount, type, donation_item || null);
      
      const newTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(newTransaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to add transaction" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { date, description, category, amount, type, donation_item } = req.body;
    if (!date || !description || !category || amount === undefined || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      db.prepare(
        "UPDATE transactions SET date = ?, description = ?, category = ?, amount = ?, type = ?, donation_item = ? WHERE id = ?"
      ).run(date, description, category, amount, type, donation_item || null, id);
      
      const updatedTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
