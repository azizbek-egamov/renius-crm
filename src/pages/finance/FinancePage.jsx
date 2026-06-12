import { useState, useEffect } from 'react';
import { 
    TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, 
    Search, Plus, Edit2, Trash2, Send, X, Briefcase, Info 
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { financeService } from '../../services/finance';
import api from '../../services/api';
import { toast } from 'sonner';
import './Finance.css';

const CHART_COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

const FinanceCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                backdropFilter: 'blur(8px)',
                minWidth: '160px'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', color: 'var(--text-secondary)' }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {payload.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.fill }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
                            <span style={{ fontWeight: 'bold', marginLeft: 'auto', color: 'var(--text-primary)' }}>
                                {Number(entry.value).toLocaleString('uz-UZ') + " so'm"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const FinancePage = () => {
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | expenses | debtors
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [debtors, setDebtors] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // Expense Search & Filters
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('');

    // Debtors Search & Filters
    const [debtorSearch, setDebtorSearch] = useState('');

    // Expense Modals
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [currentExpense, setCurrentExpense] = useState(null); // null for create, object for edit
    const [expenseForm, setExpenseForm] = useState({
        title: '',
        category: 'other',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    // SMS Modal for Debtors
    const [smsModalOpen, setSmsModalOpen] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [smsMessage, setSmsMessage] = useState('');
    const [sendingSms, setSendingSms] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, debtorsRes, expensesRes] = await Promise.all([
                financeService.getFinanceSummary(),
                financeService.getDebtors(),
                financeService.getExpenses()
            ]);
            setSummary(summaryRes.data);
            setDebtors(debtorsRes.data);
            setExpenses(expensesRes.data.results || expensesRes.data || []);
        } catch (error) {
            console.error("Moliya ma'lumotlarini yuklashda xatolik:", error);
            toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentExpense) {
                await financeService.updateExpense(currentExpense.id, expenseForm);
                toast.success("Xarajat muvaffaqiyatli tahrirlandi");
            } else {
                await financeService.createExpense(expenseForm);
                toast.success("Yangi xarajat qo'shildi");
            }
            setExpenseModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Xarajatni saqlashda xatolik yuz berdi");
        }
    };

    const handleExpenseDelete = async (id) => {
        if (!window.confirm("Haqiqatan ham bu xarajatni o'chirmoqchimisiz?")) return;
        try {
            await financeService.deleteExpense(id);
            toast.success("Xarajat o'chirildi");
            fetchData();
        } catch (error) {
            toast.error("Xarajatni o'chirishda xatolik yuz berdi");
        }
    };

    const handleOpenExpenseModal = (expense = null) => {
        if (expense) {
            setCurrentExpense(expense);
            setExpenseForm({
                title: expense.title,
                category: expense.category,
                amount: expense.amount,
                date: expense.date,
                note: expense.note || ''
            });
        } else {
            setCurrentExpense(null);
            setExpenseForm({
                title: '',
                category: 'other',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                note: ''
            });
        }
        setExpenseModalOpen(true);
    };

    const handleOpenSmsModal = (debtor) => {
        setSelectedDebtor(debtor);
        const parentName = debtor.parents?.[0]?.full_name || "Ota-ona";
        const text = `Hurmatli ${parentName}, farzandingiz ${debtor.student_name}ning maktab to'lovidan ${formatMoney(debtor.remaining_debt)} qarzdorligi mavjud. Iltimos, to'lovni o'z vaqtida amalga oshiring.`;
        setSmsMessage(text);
        setSmsModalOpen(true);
    };

    const handleSendSms = async () => {
        if (!smsMessage.trim()) return;
        setSendingSms(true);
        try {
            await api.post(`/students/${selectedDebtor.student_id}/send_sms/`, {
                message: smsMessage
            });
            toast.success("SMS eslatma navbatga qo'shildi");
            setSmsModalOpen(false);
        } catch (error) {
            console.error("SMS yuborishda xatolik:", error);
            toast.error("SMS yuborishda xatolik yuz berdi");
        } finally {
            setSendingSms(false);
        }
    };

    const formatMoney = (value) => {
        return Number(value).toLocaleString('uz-UZ') + " so'm";
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.title.toLowerCase().includes(expenseSearch.toLowerCase()) || 
                              (exp.note && exp.note.toLowerCase().includes(expenseSearch.toLowerCase()));
        const matchesCategory = expenseCategory === '' || exp.category === expenseCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredDebtors = debtors.filter(deb => {
        return deb.student_name.toLowerCase().includes(debtorSearch.toLowerCase()) || 
               deb.student_number.toLowerCase().includes(debtorSearch.toLowerCase()) ||
               deb.contract_number.toLowerCase().includes(debtorSearch.toLowerCase());
    });

    if (loading && !summary) {
        return (
            <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Moliyaviy ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="finance-page animate-fadeIn">
            <div className="finance-container">
                <header className="finance-header-area">
                    <div className="finance-header-content">
                        <h1>Moliya va Chiqimlar Boshqaruvi</h1>
                        <p>Daromadlar tahlili, qarzdorlar va maktab xarajatlari hisobi</p>
                    </div>
                    <div className="finance-tabs">
                        <button 
                            className={`finance-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <TrendingUp size={16} /> Moliya paneli
                        </button>
                        <button 
                            className={`finance-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('expenses')}
                        >
                            <Briefcase size={16} /> Chiqimlar (Xarajatlar)
                        </button>
                        <button 
                            className={`finance-tab-btn ${activeTab === 'debtors' ? 'active' : ''}`}
                            onClick={() => setActiveTab('debtors')}
                        >
                            <AlertCircle size={16} /> Qarzdorlar ({debtors.length})
                        </button>
                    </div>
                </header>

                {/* Metrics Cards */}
                <section className="finance-metrics-grid">
                    <div className="stat-card income">
                        <div className="stat-card-content">
                            <span className="stat-card-label">Jami Daromad</span>
                            <span className="stat-card-value">{formatMoney(summary?.metrics?.total_income || 0)}</span>
                            <span className="stat-card-trend positive" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingUp size={14} /> To'langan shartnomalar
                            </span>
                        </div>
                        <div className="stat-card-icon green" style={{ background: 'var(--accent-success-light)', color: 'var(--accent-success)' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>

                    <div className="stat-card expense">
                        <div className="stat-card-content">
                            <span className="stat-card-label">Jami Chiqim</span>
                            <span className="stat-card-value">{formatMoney(summary?.metrics?.total_expense || 0)}</span>
                            <span className="stat-card-trend" style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingDown size={14} /> Maktab xarajatlari
                            </span>
                        </div>
                        <div className="stat-card-icon red" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <TrendingDown size={24} />
                        </div>
                    </div>

                    <div className="stat-card debt">
                        <div className="stat-card-content">
                            <span className="stat-card-label">Kutilayotgan Qarzlar</span>
                            <span className="stat-card-value">{formatMoney(summary?.metrics?.total_debt || 0)}</span>
                            <span className="stat-card-trend" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={14} /> Faol qarzdorliklar
                            </span>
                        </div>
                        <div className="stat-card-icon warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <AlertCircle size={24} />
                        </div>
                    </div>

                    <div className="stat-card profit">
                        <div className="stat-card-content">
                            <span className="stat-card-label">Sof Foyda</span>
                            <span className="stat-card-value">{formatMoney(summary?.metrics?.net_profit || 0)}</span>
                            <span className="stat-card-trend positive" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingUp size={14} /> Daromad - Chiqim
                            </span>
                        </div>
                        <div className="stat-card-icon purple" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </section>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="animate-fadeIn">
                        <div className="finance-charts-grid">
                            <div className="finance-chart-card">
                                <div className="chart-title-area">
                                    <h3>Daromadlar va Chiqimlar Dinamikasi</h3>
                                    <p>Oylar kesimida moliyaviy oqimlar holati (oxirgi 6 oy)</p>
                                </div>
                                <div style={{ width: '100%', height: 350 }}>
                                    {(!summary?.charts?.monthly_flow || summary.charts.monthly_flow.length === 0) ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>Ma'lumot topilmadi</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={summary.charts.monthly_flow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} formatter={(val) => `${val / 1000000}M`} />
                                                <Tooltip content={<FinanceCustomTooltip />} />
                                                <Legend />
                                                <Area type="monotone" name="Daromad" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#incomeGrad)" />
                                                <Area type="monotone" name="Xarajat" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#expenseGrad)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            <div className="finance-chart-card">
                                <div className="chart-title-area">
                                    <h3>Xarajatlar Toifalari</h3>
                                    <p>Maktab chiqimlarining toifalar bo'yicha ulushi</p>
                                </div>
                                <div style={{ width: '100%', height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    {(!summary?.charts?.expense_categories || summary.charts.expense_categories.length === 0) ? (
                                        <div style={{ color: 'var(--text-tertiary)' }}>Xarajatlar mavjud emas</div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={230}>
                                                <PieChart>
                                                    <Pie
                                                        data={summary.charts.expense_categories}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="total"
                                                        nameKey="category_display"
                                                    >
                                                        {summary.charts.expense_categories.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<FinanceCustomTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '0 10px' }}>
                                                {summary.charts.expense_categories.map((cat, idx) => (
                                                    <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                                            {cat.category_display}
                                                        </span>
                                                        <span style={{ fontWeight: 'bold' }}>{formatMoney(cat.total)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="animate-fadeIn">
                        <div className="table-controls">
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
                                <div className="search-input-wrapper">
                                    <Search />
                                    <input 
                                        type="text" 
                                        placeholder="Chiqim nomini qidirish..." 
                                        value={expenseSearch} 
                                        onChange={(e) => setExpenseSearch(e.target.value)} 
                                        className="search-input"
                                    />
                                </div>
                                <select 
                                    value={expenseCategory} 
                                    onChange={(e) => setExpenseCategory(e.target.value)} 
                                    className="finance-select"
                                >
                                    <option value="">Barcha toifalar</option>
                                    <option value="salary">Maosh</option>
                                    <option value="rent">Ijara</option>
                                    <option value="utility">Kommunal to'lovlar</option>
                                    <option value="equipment">Uskunalar/Jihozlar</option>
                                    <option value="marketing">Marketing/Reklama</option>
                                    <option value="other">Boshqa xarajatlar</option>
                                </select>
                            </div>
                            <button className="btn-primary-action" onClick={() => handleOpenExpenseModal()}>
                                <Plus size={16} /> Xarajat qo'shish
                            </button>
                        </div>

                        <div className="finance-table-card">
                            <div className="finance-table-wrapper">
                                <table className="finance-table">
                                    <thead>
                                        <tr>
                                            <th>Sana</th>
                                            <th>Nomi</th>
                                            <th>Toifasi</th>
                                            <th>Summa</th>
                                            <th>Izoh</th>
                                            <th>Kiritdi</th>
                                            <th>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                    Xarajatlar topilmadi.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredExpenses.map((exp) => (
                                                <tr key={exp.id}>
                                                    <td>{new Date(exp.date).toLocaleDateString('uz-UZ')}</td>
                                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{exp.title}</td>
                                                    <td>
                                                        <span className={`finance-badge ${exp.category}`}>
                                                            {exp.category_display}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '700', color: '#ef4444' }}>
                                                        -{formatMoney(exp.amount)}
                                                    </td>
                                                    <td>{exp.note || "-"}</td>
                                                    <td>{exp.created_by_name}</td>
                                                    <td>
                                                        <div className="row-actions">
                                                            <button 
                                                                className="btn-row-action" 
                                                                onClick={() => handleOpenExpenseModal(exp)}
                                                                title="Tahrirlash"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button 
                                                                className="btn-row-action delete" 
                                                                onClick={() => handleExpenseDelete(exp.id)}
                                                                title="O'chirish"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Debtors Tab */}
                {activeTab === 'debtors' && (
                    <div className="animate-fadeIn">
                        <div className="table-controls">
                            <div className="search-input-wrapper">
                                <Search />
                                <input 
                                    type="text" 
                                    placeholder="O'quvchi yoki shartnomani qidirish..." 
                                    value={debtorSearch} 
                                    onChange={(e) => setDebtorSearch(e.target.value)} 
                                    className="search-input"
                                />
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={16} style={{ color: '#f59e0b' }} />
                                Qarzdorlar ro'yxati faol shartnomalar bo'yicha shakllanadi.
                            </div>
                        </div>

                        <div className="finance-table-card">
                            <div className="finance-table-wrapper">
                                <table className="finance-table">
                                    <thead>
                                        <tr>
                                            <th>Raqam</th>
                                            <th>O'quvchi</th>
                                            <th>Sinf</th>
                                            <th>Shartnoma</th>
                                            <th>Shartnoma Summa</th>
                                            <th>To'langan</th>
                                            <th>Qolgan Qarz</th>
                                            <th>Ota-ona / Tel</th>
                                            <th>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDebtors.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                                    Qarzdorlar topilmadi.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDebtors.map((deb) => (
                                                <tr key={deb.id}>
                                                    <td style={{ fontSize: '12px' }}>{deb.student_number}</td>
                                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{deb.student_name}</td>
                                                    <td>{deb.class_name}</td>
                                                    <td style={{ fontWeight: '500' }}>{deb.contract_number}</td>
                                                    <td>{formatMoney(deb.total_amount)}</td>
                                                    <td style={{ color: 'var(--accent-success)' }}>{formatMoney(deb.paid_amount)}</td>
                                                    <td style={{ fontWeight: '700', color: '#f59e0b' }}>
                                                        {formatMoney(deb.remaining_debt)}
                                                    </td>
                                                    <td style={{ fontSize: '13px' }}>
                                                        {deb.parents?.[0] ? (
                                                            <div>
                                                                <div>{deb.parents[0].full_name}</div>
                                                                <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                                                    {deb.parents[0].phone}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="row-actions">
                                                            <button 
                                                                className="btn-row-action sms" 
                                                                onClick={() => handleOpenSmsModal(deb)}
                                                                title="SMS eslatma yuborish"
                                                            >
                                                                <Send size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Expense Add/Edit Modal */}
            {expenseModalOpen && (
                <div className="finance-modal-backdrop" onClick={() => setExpenseModalOpen(false)}>
                    <div className="finance-modal animate-slideUp" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{currentExpense ? "Xarajatni Tahrirlash" : "Yangi Xarajat Qo'shish"}</h3>
                            <button className="btn-close-modal" onClick={() => setExpenseModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleExpenseSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Xarajat nomi / tavsifi *</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="finance-input"
                                        placeholder="Masalan: Uy-joy ijarasi yoki O'qituvchilar oyligi"
                                        value={expenseForm.title}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Xarajat toifasi *</label>
                                    <select 
                                        className="finance-input"
                                        value={expenseForm.category}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <option value="salary">Maosh</option>
                                        <option value="rent">Ijara</option>
                                        <option value="utility">Kommunal to'lovlar</option>
                                        <option value="equipment">Uskunalar/Jihozlar</option>
                                        <option value="marketing">Marketing/Reklama</option>
                                        <option value="other">Boshqa xarajatlar</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Summa (so'mda) *</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        className="finance-input"
                                        placeholder="Masalan: 12000000"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Sana *</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="finance-input"
                                        value={expenseForm.date}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Izoh</label>
                                    <textarea 
                                        className="finance-textarea"
                                        rows="3"
                                        placeholder="Qo'shimcha tafsilotlar..."
                                        value={expenseForm.note}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, note: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setExpenseModalOpen(false)}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn-primary-action">
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Send SMS Modal */}
            {smsModalOpen && selectedDebtor && (
                <div className="finance-modal-backdrop" onClick={() => setSmsModalOpen(false)}>
                    <div className="finance-modal animate-slideUp" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>SMS Eslatma Yuborish</h3>
                            <button className="btn-close-modal" onClick={() => setSmsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '16px', fontSize: '13px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div><strong>O'quvchi:</strong> {selectedDebtor.student_name} ({selectedDebtor.student_number})</div>
                                <div style={{ marginTop: '4px' }}><strong>Qarzdorlik:</strong> {formatMoney(selectedDebtor.remaining_debt)}</div>
                                <div style={{ marginTop: '4px' }}><strong>Ota-ona (SMS qabul qiluvchi):</strong> {selectedDebtor.parents?.[0]?.full_name || "Mavjud emas"} ({selectedDebtor.parents?.[0]?.phone || "Mavjud emas"})</div>
                            </div>
                            <div className="form-group">
                                <label>SMS matni</label>
                                <textarea 
                                    className="finance-textarea"
                                    rows="5"
                                    required
                                    value={smsMessage}
                                    onChange={(e) => setSmsMessage(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setSmsModalOpen(false)}>
                                Bekor qilish
                            </button>
                            <button 
                                type="button" 
                                className="btn-primary-action" 
                                onClick={handleSendSms}
                                disabled={sendingSms || !selectedDebtor.parents?.[0]}
                            >
                                <Send size={16} /> {sendingSms ? "Yuborilmoqda..." : "Yuborish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancePage;
