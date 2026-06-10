import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { studentService, schoolClassService } from '../../services/students';
import { formatDateInput, isValidDateStr, parseUIDateToApi } from '../../utils/dateFormatter';
import { formatApiPhoneToUI } from '../../utils/phoneFormatter';
import './Students.css';

const STATUS_OPTIONS = [
    { value: '', label: 'Barcha holatlar' },
    { value: 'active', label: 'Faol' },
    { value: 'inactive', label: 'Nofaol' },
    { value: 'expelled', label: 'Chetlatilgan' },
    { value: 'graduated', label: 'Bitirgan' },
    { value: 'on_leave', label: 'Vaqtincha ketgan' },
];

const STATUS_LABELS = {
    active: 'Faol',
    inactive: 'Nofaol',
    expelled: 'Chetlatilgan',
    graduated: 'Bitirgan',
    on_leave: 'Vaqtincha ketgan',
};

const formatMoney = (n) => {
    if (!n && n !== 0) return '—';
    return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
};

const StudentsList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [schoolClass, setSchoolClass] = useState('');
    const [debtorsOnly, setDebtorsOnly] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        birth_date: '',
        gender: '',
        phone: '',
        school_class: '',
        status: 'active',
    });

    useEffect(() => {
        schoolClassService.getAll({ active: 'true' }).then((res) => {
            setClasses(res.data.results || res.data || []);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const t = setTimeout(loadStudents, 300);
        return () => clearTimeout(t);
    }, [search, status, schoolClass, debtorsOnly]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (status) params.status = status;
            if (schoolClass) params.school_class = schoolClass;
            if (debtorsOnly) params.debtors = 'true';
            const res = await studentService.getAll(params);
            setStudents(res.data.results || res.data || []);
        } catch {
            toast.error("O'quvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (student) => {
        setDeleteModal({ open: true, student });
    };

    const confirmDelete = async (studentId) => {
        try {
            await studentService.delete(studentId);
            toast.success("O'quvchi o'chirildi");
            setDeleteModal({ open: false, student: null });
            loadStudents();
        } catch (err) {
            toast.error(err.response?.data?.detail || "O'chirishda xatolik yuz berdi. Bog'liq ma'lumotlar borligi sababli o'chirib bo'lmasligi mumkin.");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim()) {
            toast.error('Ism va familiya kiritilishi shart');
            return;
        }
        if (form.birth_date && !isValidDateStr(form.birth_date)) {
            toast.error("Tug'ilgan sana noto'g'ri. KK.OO.YYYY formatida kiriting (masalan: 12.12.2020)");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (payload.birth_date) {
                payload.birth_date = parseUIDateToApi(payload.birth_date);
            } else {
                delete payload.birth_date;
            }
            if (!payload.school_class) delete payload.school_class;
            if (!payload.gender) delete payload.gender;
            const res = await studentService.create(payload);
            toast.success("O'quvchi qo'shildi");
            setShowForm(false);
            navigate(`/students/${res.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="students-page animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">O'quvchilar</h1>
                    <p className="page-subtitle">Ro'yxat, filtr va qarzdorlik holati</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} />
                    Yangi o'quvchi
                </button>
            </div>

            <div className="content-card">
                <div className="filters-row">
                    <div className="search-box">
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            placeholder="Ism, raqam, telefon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <select className="filter-select" value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)}>
                        <option value="">Barcha sinflar</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <label className="checkbox-filter-label">
                        <input
                            type="checkbox"
                            checked={debtorsOnly}
                            onChange={(e) => setDebtorsOnly(e.target.checked)}
                        />
                        <AlertCircle size={16} />
                        Faqat qarzdorlar
                    </label>
                </div>

                {loading ? (
                    <div className="empty-state">Yuklanmoqda...</div>
                ) : students.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p>O'quvchilar topilmadi</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Raqam</th>
                                    <th>F.I.Sh.</th>
                                    <th>Sinf</th>
                                    <th>Holat</th>
                                    <th>Ota-ona tel.</th>
                                    <th>Qarzdorlik</th>
                                    <th>Qabul</th>
                                    <th style={{ textAlign: 'right' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.student_number}</td>
                                        <td><strong>{s.full_name}</strong></td>
                                        <td>{s.class_name || '—'}</td>
                                        <td>
                                            <span className={`status-badge ${s.status}`}>
                                                {STATUS_LABELS[s.status] || s.status}
                                            </span>
                                        </td>
                                        <td>{s.primary_parent_phone ? formatApiPhoneToUI(s.primary_parent_phone) : '—'}</td>
                                        <td>
                                            {s.has_contract ? (
                                                <span className={`debt-badge ${s.is_debtor ? '' : 'ok'}`}>
                                                    {s.is_debtor ? formatMoney(s.remaining_debt) : "To'langan"}
                                                </span>
                                            ) : (
                                                <span className="debt-badge none">
                                                    Shartnoma yo'q
                                                </span>
                                            )}
                                        </td>
                                        <td>{s.enrollment_date || '—'}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn-icon btn-edit" onClick={() => navigate(`/students/${s.id}`)} title="Tahrirlash">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn-icon btn-delete" onClick={() => handleDeleteClick(s)} title="O'chirish">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Yangi o'quvchi</h3>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label>Familiya *</label>
                                        <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Ism *</label>
                                        <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Otasining ismi</label>
                                        <input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Sinf</label>
                                        <select value={form.school_class} onChange={(e) => setForm({ ...form, school_class: e.target.value })}>
                                            <option value="">Tanlash</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tug'ilgan sana (KK.OO.YYYY)</label>
                                        <input 
                                            type="text" 
                                            placeholder="KK.OO.YYYY" 
                                            value={form.birth_date} 
                                            onChange={(e) => setForm({ ...form, birth_date: formatDateInput(e.target.value) })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Jins</label>
                                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                            <option value="">—</option>
                                            <option value="male">Erkak</option>
                                            <option value="female">Ayol</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Bekor</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModal.open && (
                <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, student: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">O'quvchini o'chirish</h3>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div className="modal-icon danger" style={{ margin: '0 auto 20px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-danger-light)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={24} />
                            </div>
                            <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                <strong>{deleteModal.student?.full_name}</strong> o'quvchisini o'chirishni xohlaysizmi?
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Bu o'quvchiga tegishli barcha shartnomalar, to'lovlar va davomatlar ham butunlay o'chib ketadi. Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, student: null })}>
                                Bekor qilish
                            </button>
                            <button className="btn-primary" style={{ background: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', boxShadow: '0 4px 12px var(--accent-danger-light)' }} onClick={() => confirmDelete(deleteModal.student.id)}>
                                O'chirish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsList;

