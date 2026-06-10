import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { schoolClassService, attendanceService } from '../../services/students';
import { formatDateInput, isValidDateStr, parseUIDateToApi, formatApiDateToUI } from '../../utils/dateFormatter';
import '../students/Students.css';

const STATUS_OPTIONS = [
    { value: 'present', label: 'Keldi' },
    { value: 'absent', label: 'Kelmadi' },
    { value: 'late', label: 'Kechikdi' },
    { value: 'excused', label: 'Sababli' },
];

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
    const [searchParams] = useSearchParams();
    const [classes, setClasses] = useState([]);
    const [classId, setClassId] = useState(searchParams.get('class') || '');
    const [date, setDate] = useState(formatApiDateToUI(today()));
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        schoolClassService.getAll({ active: 'true' }).then((r) => {
            const list = r.data.results || r.data || [];
            setClasses(list);
            if (!classId && list.length) setClassId(String(list[0].id));
        });
    }, []);

    useEffect(() => {
        const uiDate = date && date.includes('-') ? formatApiDateToUI(date) : date;
        if (classId && uiDate && isValidDateStr(uiDate)) loadDaily();
    }, [classId, date]);

    const loadDaily = async () => {
        const apiDate = date.includes('-') ? date : parseUIDateToApi(date);
        setLoading(true);
        try {
            const [dailyRes, summaryRes] = await Promise.all([
                attendanceService.getDaily(classId, apiDate),
                attendanceService.getSummary(classId, apiDate),
            ]);
            setRecords(dailyRes.data.records || []);
            setSummary(summaryRes.data);
        } catch {
            toast.error('Davomat yuklanmadi');
        } finally {
            setLoading(false);
        }
    };

    const setStatus = (studentId, status) => {
        setRecords((prev) => prev.map((r) => (
            r.student_id === studentId ? { ...r, status } : r
        )));
    };

    const handleSave = async () => {
        const apiDate = date.includes('-') ? date : parseUIDateToApi(date);
        setSaving(true);
        try {
            await attendanceService.bulkSave({
                school_class: parseInt(classId, 10),
                date: apiDate,
                records: records.map((r) => ({
                    student_id: r.student_id,
                    status: r.status,
                    note: r.note || '',
                })),
            });
            toast.success('Davomat saqlandi');
            loadDaily();
        } catch {
            toast.error('Saqlashda xatolik');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="students-page attendance-page animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Davomat</h1>
                    <p className="page-subtitle">Kunlik davomat — o'qituvchi interfeysi</p>
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={saving || !classId}>
                    <Save size={18} />
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>

            <div className="content-card" style={{ padding: 20, marginBottom: 20 }}>
                <div className="filters-row" style={{ border: 'none', padding: 0 }}>
                    <select className="filter-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                        <option value="">Sinf tanlang</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="search-box" style={{ maxWidth: 200 }}>
                        <Calendar size={16} />
                        <input 
                            type="text" 
                            placeholder="KK.OO.YYYY"
                            value={date ? (date.includes('-') ? formatApiDateToUI(date) : date) : ''} 
                            onChange={(e) => setDate(formatDateInput(e.target.value))} 
                        />
                    </div>
                </div>
            </div>

            {summary && (
                <div className="summary-cards">
                    <div className="summary-card">
                        <div className="val" style={{ color: 'var(--accent-success)' }}>{summary.present}</div>
                        <div className="lbl">Keldi</div>
                    </div>
                    <div className="summary-card">
                        <div className="val" style={{ color: 'var(--accent-danger)' }}>{summary.absent}</div>
                        <div className="lbl">Kelmadi</div>
                    </div>
                    <div className="summary-card">
                        <div className="val" style={{ color: 'var(--accent-warning)' }}>{summary.late}</div>
                        <div className="lbl">Kechikdi</div>
                    </div>
                    <div className="summary-card">
                        <div className="val" style={{ color: 'var(--accent-info)' }}>{summary.excused}</div>
                        <div className="lbl">Sababli</div>
                    </div>
                </div>
            )}

            <div className="content-card" style={{ padding: 20 }}>
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <span className="loading-text">Davomat yuklanmoqda...</span>
                    </div>
                ) : !classId ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <h3>Sinf tanlanmagan</h3>
                        <p>Davomat ko'rish uchun sinf tanlang</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>O'quvchilar yo'q</h3>
                        <p>Bu sinfda faol o'quvchilar topilmadi</p>
                    </div>
                ) : (
                    <div className="attendance-grid">
                        {records.map((r) => (
                            <div key={r.student_id} className="attendance-row">
                                <div>
                                    <strong>{r.full_name}</strong>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.student_number}</div>
                                </div>
                                <div className="status-btns">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`status-btn ${r.status === opt.value ? `active ${opt.value}` : ''}`}
                                            onClick={() => setStatus(r.student_id, opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendancePage;
