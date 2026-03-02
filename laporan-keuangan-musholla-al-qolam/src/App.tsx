/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  Trash2, 
  Download,
  Filter,
  ChevronRight,
  ChevronLeft,
  Search,
  PieChart as PieChartIcon,
  BarChart3,
  Printer,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Pencil,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  donation_item?: string | null;
}

const DONORS = [
  "Abjiatul Astiani, SE",
  "Ali Patau, SE",
  "Dandi Septian, S.Pd.",
  "Diana Rita, S. Pd",
  "Didi Rosady, S.Pd",
  "Disa Septiani Robiah, S.Pd.",
  "Dr. Marwan Toni, S.Hut, M.Pd",
  "Duwi Andriyani, S.Pd",
  "Eko Randy Yusuf, S.Pd.",
  "Eli Septiana, S.Pd.",
  "Elisia Rosalinda Manullang, S.Pd",
  "Frida Norjayanti, S. Pd",
  "Hariati, S.Pd.I",
  "Hayrul Syam, S.Pd.",
  "Isroiyah, S.Pd.I",
  "Jumratul Akbah, S.Pd.",
  "Kartini, SE",
  "Laila Sari, S.Pd.",
  "Lisa Carolina, S.Pd.",
  "Maria Floriyanti Nogo Weluk, S.Ag.",
  "Mariasa, S.Pd.I",
  "Marten, S.Pd",
  "Muhamad Fahmi Bisma, S.Pd.",
  "Muhammad Syahrul Sani, S.Pd.",
  "Muhlis, S.Pd.I., M.Pd.",
  "Noor Hasinah Khalid, S.Pd.",
  "Noor Hidayat, S.Pd",
  "Norhasanah, SE",
  "Ramlah, S.Pd.",
  "Robi Ardiah Murti Murhanuddin, S.Pd.",
  "Rudianto",
  "Siti Asaniyati, S.Pd.",
  "Siti Nurwana, S.Pd.",
  "Suharta Nurul Mulhikmah, S.Pd.I",
  "Tresna Yulianti, S.Sos.",
  "Yuli Sri Hartati, S.Pd.",
  "Hamba Allah"
];

const CATEGORIES = [
  'Infaq Jumat',
  'Infaq Harian',
  'Infaq Bulanan',
  'Donasi Khusus',
  'Pemeliharaan',
  'Kegiatan Hari Besar',
  'Lain-lain'
];

export default function App() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [authPassword, setAuthPassword] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'month' | 'date' | 'description'>('all');
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterDescription, setFilterDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');
  const [filterDonor, setFilterDonor] = useState('Semua Penyumbang');
  const [searchTerm, setSearchTerm] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: 'Infaq Jumat',
    amount: '',
    type: 'income' as 'income' | 'expense',
    donation_item: ''
  });

  useEffect(() => {
    fetchTransactions();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTransactionId ? `/api/transactions/${editingTransactionId}` : '/api/transactions';
      const method = editingTransactionId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description: formData.description === 'Lain-lain' ? customDescription : formData.description,
          amount: parseFloat(formData.amount) || 0,
          donation_item: (formData.type === 'income' && formData.description === 'Lain-lain' && formData.category === 'Lain-lain') ? formData.donation_item : null
        })
      });
      if (response.ok) {
        fetchTransactions();
        setIsModalOpen(false);
        setEditingTransactionId(null);
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          category: 'Infaq Jumat',
          amount: '',
          type: 'income',
          donation_item: ''
        });
        setCustomDescription('');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode, filterDate, filterMonth, filterDescription, filterCategory, filterDonor]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterMode === 'all') return matchesSearch;

      if (filterMode === 'description') {
        const matchesDesc = t.description.toLowerCase().includes(filterDescription.toLowerCase());
        const matchesCat = filterCategory === 'Semua Kategori' || t.category === filterCategory;
        return matchesSearch && matchesDesc && matchesCat;
      }

      if (filterMode === 'date') {
        return matchesSearch && t.date === filterDate;
      }

      if (filterMode === 'month') {
        const transactionDate = parseISO(t.date);
        const start = startOfMonth(parseISO(`${filterMonth}-01`));
        const end = endOfMonth(start);
        const matchesMonth = isWithinInterval(transactionDate, { start, end });
        const matchesDonor = filterDonor === 'Semua Penyumbang' || t.description === filterDonor;
        return matchesSearch && matchesMonth && matchesDonor;
      }

      return matchesSearch;
    });
  }, [transactions, searchTerm, filterMode, filterDate, filterMonth, filterDescription, filterCategory, filterDonor]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    // Group by month for the comparison chart
    transactions.forEach(t => {
      const month = format(parseISO(t.date), 'MMM yyyy');
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      if (t.type === 'income') data[month].income += t.amount;
      else data[month].expense += t.amount;
    });
    return Object.entries(data)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => {
        const dateA = parseISO(`01 ${a.name}`);
        const dateB = parseISO(`01 ${b.name}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [transactions]);

  const expenseCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!data[t.category]) data[t.category] = 0;
        data[t.category] += t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const recentActivities = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return transactions
      .filter(t => parseISO(t.date) >= thirtyDaysAgo)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .map(t => ({
        text: `${t.description} (${formatCurrency(t.amount)})`,
        type: t.type
      }));
  }, [transactions]);

  const handleOpenModal = () => {
    if (isLoggedIn) {
      setEditingTransactionId(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        category: 'Infaq Jumat',
        amount: '',
        type: 'income',
        donation_item: ''
      });
      setCustomDescription('');
      setIsModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword === 'AlQol@m12') {
      setIsAuthModalOpen(false);
      setIsLoggedIn(true);
      setAuthPassword('');
    } else {
      alert('Password salah!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setFormData({
      date: t.date,
      description: t.description,
      category: t.category,
      amount: t.amount.toString(),
      type: t.type,
      donation_item: t.donation_item || ''
    });
    // If description is not in DONORS or predefined list, it might be 'Lain-lain'
    const predefined = [...DONORS, 'Infaq Jumat', 'Infaq Harian'];
    if (t.type === 'income' && !predefined.includes(t.description)) {
      setFormData(prev => ({ ...prev, description: 'Lain-lain' }));
      setCustomDescription(t.description);
    }
    setIsModalOpen(true);
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const formatData = (list: Transaction[], includeMonthColumn = false) => list.map(t => {
      const data: any = {
        'Tanggal': format(parseISO(t.date), 'eeee, dd/MM/yyyy', { locale: id }),
        'Keterangan': t.description,
        'Kategori': t.category,
      };

      if (includeMonthColumn) {
        const monthStr = format(parseISO(t.date), 'MMMM yyyy', { locale: id });
        data['Bulan'] = monthStr;
      }

      data['Tipe'] = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      data['Jumlah (IDR)'] = t.amount;
      
      return data;
    });

    const wscols = [
      { wch: 15 }, // Tanggal
      { wch: 40 }, // Keterangan
      { wch: 20 }, // Kategori
      { wch: 15 }, // Tipe
      { wch: 20 }, // Jumlah
    ];

    const wscolsWithMonth = [
      { wch: 15 }, // Tanggal
      { wch: 40 }, // Keterangan
      { wch: 20 }, // Kategori
      { wch: 45 }, // Bulan
      { wch: 15 }, // Tipe
      { wch: 20 }, // Jumlah
    ];

    // Sheet 1: Semua Periode
    const ws1 = XLSX.utils.json_to_sheet(formatData(transactions, true));
    ws1['!cols'] = wscolsWithMonth;
    XLSX.utils.book_append_sheet(workbook, ws1, "Semua Periode");

    // Sheet 2: Per Bulan (berdasarkan filterMonth saat ini)
    const monthTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      const start = startOfMonth(parseISO(`${filterMonth}-01`));
      const end = endOfMonth(start);
      return isWithinInterval(transactionDate, { start, end });
    });
    const ws2 = XLSX.utils.json_to_sheet(formatData(monthTransactions, true));
    ws2['!cols'] = wscolsWithMonth;
    XLSX.utils.book_append_sheet(workbook, ws2, "Per Bulan");

    // Sheet 3: Per Tanggal (berdasarkan filterDate saat ini)
    const dateTransactions = transactions.filter(t => t.date === filterDate);
    const ws3 = XLSX.utils.json_to_sheet(formatData(dateTransactions));
    ws3['!cols'] = wscols;
    XLSX.utils.book_append_sheet(workbook, ws3, "Per Tanggal");

    // Sheet 4: Per Keterangan (berdasarkan filterDescription & filterCategory saat ini)
    const descTransactions = transactions.filter(t => {
      const matchesDesc = t.description.toLowerCase().includes(filterDescription.toLowerCase());
      const matchesCat = filterCategory === 'Semua Kategori' || t.category === filterCategory;
      return matchesDesc && matchesCat;
    });
    const ws4 = XLSX.utils.json_to_sheet(formatData(descTransactions));
    ws4['!cols'] = wscols;
    XLSX.utils.book_append_sheet(workbook, ws4, "Per Keterangan");

    // Sheet 5: Berdasarkan Nama Penyumbang (Pemasukan)
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const ws5 = XLSX.utils.json_to_sheet(formatData(incomeTransactions));
    ws5['!cols'] = wscols;
    XLSX.utils.book_append_sheet(workbook, ws5, "Penyumbang");

    // Sheet 6: Pengeluaran
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const ws6 = XLSX.utils.json_to_sheet(formatData(expenseTransactions));
    ws6['!cols'] = wscols;
    XLSX.utils.book_append_sheet(workbook, ws6, "Pengeluaran");

    XLSX.writeFile(workbook, `Laporan_Keuangan_Musholla_Al_Qolam_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <img 
                src="https://i.imgur.com/QGokDzO.png" 
                alt="Logo Musholla Al Qolam" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 truncate">Musholla Al Qolam</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest truncate">SMA Negeri 12 Berau</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isLoggedIn ? (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-bold text-xs"
              >
                <LogIn size={16} className="text-indigo-600" />
                <span className="hidden md:inline">Login Admin</span>
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-xs"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-bold text-xs"
              title="Download Laporan Excel"
            >
              <FileSpreadsheet size={16} className="text-indigo-600" />
              <span className="hidden md:inline">Ekspor Excel</span>
            </button>
            {isLoggedIn && (
              <button 
                onClick={handleOpenModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Tambah Transaksi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="report-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header (Visible in Print/PDF) */}
        <div className="hidden print:flex print-only-pdf flex-col items-center text-center mb-10 border-b-2 border-slate-900 pb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://i.imgur.com/QGokDzO.png" 
              alt="Logo" 
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h1 className="text-2xl font-bold uppercase tracking-tight">Musholla Al Qolam</h1>
              <h2 className="text-xl font-bold text-indigo-700">SMA Negeri 12 Berau</h2>
              <p className="text-xs text-slate-500 font-medium italic">Jl. SMA Bangun, Bebanir, Kec. Sambaliung, Berau</p>
            </div>
          </div>
          <div className="w-full space-y-1">
            <h3 className="text-lg font-bold uppercase underline decoration-1 underline-offset-4">Laporan Keuangan Infaq</h3>
            <p className="text-sm font-medium text-slate-700">
              Periode: {
                filterMode === 'all' ? 'Semua Periode' : 
                filterMode === 'month' ? format(parseISO(`${filterMonth}-01`), 'MMMM yyyy') :
                format(parseISO(filterDate), 'eeee, dd/MM/yyyy', { locale: id })
              }
            </p>
          </div>
        </div>

        {/* Running Text & Real-time Clock */}
        <div className="mb-8 bg-white border-y border-slate-100 py-4 overflow-hidden whitespace-nowrap print:hidden no-print-pdf shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center px-4 gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-4 py-1.5 rounded-full mr-4 uppercase tracking-widest z-10 shadow-md shadow-emerald-100 shrink-0">
                INFORMASI TERBARU
              </span>
              
              <div className="flex-1 overflow-hidden">
                <div className="animate-marquee inline-block pl-[100%] font-bold text-sm sm:text-base">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <React.Fragment key={index}>
                        <span className={activity.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                          {activity.text}
                        </span>
                        {index < recentActivities.length - 1 && <span className="text-slate-300 mx-4">•</span>}
                      </React.Fragment>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Belum ada aktivitas dalam 30 hari terakhir</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
              <div className="bg-indigo-600 text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-2 shadow-md shadow-indigo-100">
                <Calendar size={14} />
                <span className="uppercase tracking-widest">
                  {format(currentTime, 'eeee, dd/MM/yyyy', { locale: id })}
                </span>
              </div>
              <div className="bg-slate-900 text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-2 shadow-md shadow-slate-200">
                <Clock size={14} className="text-indigo-400" />
                <span className="font-mono">
                  {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Saldo Akhir" 
            value={stats.balance} 
            icon={<Wallet className="text-indigo-600" />} 
            color="indigo"
          />
          <StatCard 
            title="Total Pemasukan" 
            value={stats.income} 
            icon={<TrendingUp className="text-emerald-600" />} 
            color="emerald"
          />
          <StatCard 
            title="Total Pengeluaran" 
            value={stats.expense} 
            icon={<TrendingDown className="text-rose-600" />} 
            color="rose"
          />
        </div>

        {/* Filters & Search - Hidden in Print */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 mb-10 flex flex-col gap-5 shadow-sm print:hidden no-print-pdf">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Calendar className="text-slate-300 hidden sm:block" size={20} />
              <select 
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Semua Periode</option>
                <option value="month">Per Bulan</option>
                <option value="date">Per Tanggal</option>
                <option value="description">Per Keterangan</option>
              </select>

              {filterMode === 'description' && (
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-48">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Ketik keterangan..."
                      value={filterDescription}
                      onChange={(e) => setFilterDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option>Semua Kategori</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {filterMode === 'month' && (
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 25 }).map((_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - 12 + i);
                      const val = format(d, 'yyyy-MM');
                      return <option key={val} value={val}>{format(d, 'MMMM yyyy')}</option>;
                    })}
                  </select>
                  <select 
                    value={filterDonor}
                    onChange={(e) => setFilterDonor(e.target.value)}
                    className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option>Semua Penyumbang</option>
                    {DONORS.map(donor => (
                      <option key={donor} value={donor}>{donor}</option>
                    ))}
                    <option value="Infaq Jumat">Infaq Jumat</option>
                    <option value="Infaq Harian">Infaq Harian</option>
                  </select>
                </div>
              )}

              {filterMode === 'date' && (
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all cursor-pointer"
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">
                  Rincian Transaksi - {
                    filterMode === 'all' ? 'Semua Periode' : 
                    filterMode === 'month' ? `${format(parseISO(`${filterMonth}-01`), 'MMMM yyyy')} ${filterDonor !== 'Semua Penyumbang' ? `(${filterDonor})` : ''}` :
                    filterMode === 'description' ? `Keterangan: "${filterDescription}" ${filterCategory !== 'Semua Kategori' ? `(${filterCategory})` : ''}` :
                    format(parseISO(filterDate), 'eeee, dd/MM/yyyy', { locale: id })
                  }
                </h3>
                <div className="flex items-center gap-2 print:hidden no-print-pdf">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    {filteredTransactions.length} Transaksi
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</th>
                      <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                      <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Jumlah</th>
                      {isLoggedIn && (
                        <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider text-center print:hidden">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {paginatedTransactions.map((t) => (
                        <motion.tr 
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className={cn(
                            "px-4 sm:px-6 py-4 text-xs sm:text-sm whitespace-nowrap font-medium",
                            t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {format(parseISO(t.date), 'eeee, dd/MM/yyyy', { locale: id })}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className={cn(
                              "text-xs sm:text-sm font-bold break-words min-w-[150px] max-w-[400px]",
                              t.type === 'income' ? "text-emerald-700" : "text-rose-700"
                            )}>
                              {t.description}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap",
                              t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {t.category}
                            </span>
                          </td>
                          <td className={cn(
                            "px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-right whitespace-nowrap",
                            t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {t.donation_item ? (
                              <span className="italic text-[10px] sm:text-xs">{t.donation_item}</span>
                            ) : (
                              <>
                                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                              </>
                            )}
                          </td>
                          {isLoggedIn && (
                            <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap print:hidden">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleEditClick(t)}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="Edit Transaksi"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(t.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredTransactions.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={isLoggedIn ? 5 : 4} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Calendar size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Tidak ada transaksi di periode ini</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  Menampilkan <span className="text-slate-900 font-bold">{filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> dari <span className="text-slate-900 font-bold">{filteredTransactions.length}</span> data
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 || 
                          pageNum === totalPages || 
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "w-9 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all",
                                currentPage === pageNum 
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 || 
                          pageNum === currentPage + 2
                        ) {
                          return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Charts */}
          <div className="space-y-6 no-print-pdf">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm break-inside-avoid">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">Perbandingan Bulanan</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="income" name="Pemasukan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm break-inside-avoid">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">Alokasi Pengeluaran</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {expenseCategoryData.length > 0 ? expenseCategoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-900 font-bold">{formatCurrency(item.value)}</span>
                  </div>
                )) : (
                  <p className="text-center text-xs text-slate-400">Tidak ada pengeluaran</p>
                )}
              </div>
            </div>

            {/* Informasi Rekening & Token */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm break-inside-avoid space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rekening Donasi/Infaq</h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="text-xl">🏦</div>
                    <div className="text-sm font-bold text-slate-800 leading-tight">
                      BPD KALIMANTAN TIMUR DAN KALIMANTAN UTARA
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-xl">💳</div>
                    <div className="text-sm font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      5000248818
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">✨</div>
                    <div className="text-xs font-medium text-slate-600">
                      A/N: MUSHOLLA AL QOLAM SMAN 12 BERAU
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Token Listrik Musholla</h4>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center gap-3">
                  <div className="text-xl">💡</div>
                  <div>
                    <div className="text-xs text-amber-700 font-medium">No. Meter:</div>
                    <div className="text-sm font-mono font-bold text-amber-900">2330-0080-3199</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="text-xl">📞</div>
                  <div className="text-xs">
                    <span className="font-bold block text-slate-800">Informasi dan Konfirmasi:</span>
                    <a 
                      href="https://wa.me/628115831245" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                    >
                      08115831245
                    </a> (Tresna Yulianti)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section (Visible in Print) */}
          <div className="hidden print:grid grid-cols-2 gap-20 mt-20 text-center">
            <div className="space-y-20">
              <div className="space-y-1">
                <p className="text-sm font-medium">Mengetahui,</p>
                <p className="text-sm font-bold uppercase">Ketua Takmir Musholla</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-slate-900 w-48 mx-auto"></div>
                <p className="text-xs font-medium text-slate-500">NIP. ...........................</p>
              </div>
            </div>
            <div className="space-y-20">
              <div className="space-y-1">
                <p className="text-sm font-medium">Berau, {format(new Date(), 'eeee, dd/MM/yyyy', { locale: id })}</p>
                <p className="text-sm font-bold uppercase">Bendahara</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-slate-900 w-48 mx-auto"></div>
                <p className="text-xs font-medium text-slate-500">NIP. ...........................</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 mt-8 print:hidden no-print-pdf">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img 
                  src="https://i.imgur.com/QGokDzO.png" 
                  alt="Logo Musholla Al Qolam" 
                  className="w-10 h-10 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-bold text-slate-900">Musholla Al Qolam</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SMA Negeri 12 Berau</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-slate-600">
                  <span className="text-lg">📍</span>
                  <p className="text-sm leading-relaxed">
                    Jl. SMA Bangun, Bebanir, Kec. Sambaliung, Kabupaten Berau, Kalimantan Timur 77352
                  </p>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="text-lg">🌐</span>
                  <a 
                    href="https://sman12berau.sch.id/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                  >
                    https://sman12berau.sch.id/
                  </a>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terhubung Dengan Kami</h4>
              <p className="text-sm text-slate-600">Ikuti perkembangan terbaru melalui media sosial resmi kami:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="https://instagram.com/sman12berau_id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📸</span>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-800 group-hover:text-indigo-600">Instagram</span>
                    @sman12berau_id
                  </div>
                </a>
                <a href="https://instagram.com/_osissmandalas" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">🎓</span>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-800 group-hover:text-indigo-600">OSIS Instagram</span>
                    @_osissmandalas
                  </div>
                </a>
                <a href="https://facebook.com/sman12berauID" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">👍</span>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-800 group-hover:text-indigo-600">Facebook</span>
                    sman12berauID
                  </div>
                </a>
                <a href="https://youtube.com/@SMANEGERI12BERAU" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">▶️</span>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-800 group-hover:text-indigo-600">YouTube</span>
                    SMA NEGERI 12 BERAU
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2024-{new Date().getFullYear()} Musholla Al Qolam SMAN 12 Berau. Dikelola dengan penuh amanah.</p>
          </div>
        </div>
      </footer>

      {/* Modal Verifikasi Password */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Wallet className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Verifikasi Akses</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bendahara Musholla</p>
                </div>
              </div>
              <form onSubmit={handleVerifyPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Keamanan</label>
                  <input 
                    type="password" 
                    autoFocus
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-mono text-lg tracking-widest"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setAuthPassword('');
                    }}
                    className="flex-1 py-3 sm:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                  >
                    Masuk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-rose-600" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Transaksi?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleDeleteTransaction(deleteConfirmId)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 transition-all active:scale-95"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Transaksi */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {editingTransactionId ? <Pencil size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight">
                      {editingTransactionId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {editingTransactionId ? 'Perbarui Data' : 'Input Data Baru'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 sm:p-8 space-y-5">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                      formData.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Pemasukan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                      formData.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Pengeluaran
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</label>
                  {formData.type === 'income' ? (
                    <div className="space-y-3">
                      <select
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none text-sm sm:text-base"
                      >
                        <option value="">Pilih Nama Penyumbang</option>
                        {DONORS.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        <option value="Infaq Jumat">Infaq Jumat</option>
                        <option value="Infaq Harian">Infaq Harian</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                      
                      {formData.description === 'Lain-lain' && (
                        <motion.input 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          type="text" 
                          required
                          placeholder="Masukkan nama penyumbang lainnya..."
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm sm:text-base"
                        />
                      )}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Pembelian Karpet"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm sm:text-base"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none text-sm sm:text-base"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {formData.type === 'income' && formData.description === 'Lain-lain' && formData.category === 'Lain-lain' ? 'Jenis Sumbangan' : 'Jumlah (IDR)'}
                  </label>
                  {formData.type === 'income' && formData.description === 'Lain-lain' && formData.category === 'Lain-lain' ? (
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: 10 Sak Semen"
                      value={formData.donation_item}
                      onChange={(e) => setFormData({ ...formData, donation_item: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                    />
                  ) : (
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                    />
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
                >
                  {editingTransactionId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: 'indigo' | 'emerald' | 'rose' }) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600"
  };

  const textColorClasses = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600"
  };

  return (
    <motion.div 
      whileHover={{ y: -6, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner", colorClasses[color])}>
          {icon}
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", textColorClasses[color])}>{title}</span>
      </div>
      <div className="flex flex-col">
        <span className={cn("text-3xl font-black tracking-tight", textColorClasses[color])}>
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(value)}
        </span>
        <div className="flex items-center gap-2 mt-2">
          <div className={cn("w-2 h-2 rounded-full", color === 'indigo' ? 'bg-indigo-400' : color === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400')} />
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", textColorClasses[color])}>Update Real-time</span>
        </div>
      </div>
    </motion.div>
  );
}
