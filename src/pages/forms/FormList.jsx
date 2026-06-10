import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import api from '../../services/api';
import { toast } from 'sonner';
import './Forms.css';

// Get base URL for public forms
const BASE_URL = window.location.origin;

// --- Icons ---
const LayoutIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
const FileTextIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const CheckCircleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const SearchIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const PlusIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const CopyIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const ExternalLinkIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);
const LinkIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);
const EyeIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const UsersIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const TrashIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const FolderIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);

// --- Stat Card Component ---
const StatCard = ({ label, value, icon: Icon, trend, iconClass }) => (
    <div className="stat-card">
        <div className="stat-card-content">
            <p className="stat-card-label">{label}</p>
            <h3 className="stat-card-value">{value}</h3>
            {trend !== undefined && (
                <p className={`stat-card-trend ${trend > 0 ? 'positive' : 'negative'}`}>
                    {trend > 0 ? '+' : ''}{trend}% o'tgan oyga nisbatan
                </p>
            )}
        </div>
        <div className={`stat-card-icon ${iconClass}`}>
            <Icon />
        </div>
    </div>
);

const FormList = () => {
    usePageTitle('Formalar');
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const res = await api.get('/forms/');
            if (Array.isArray(res.data)) {
                setForms(res.data);
            } else if (res.data && Array.isArray(res.data.results)) {
                setForms(res.data.results);
            } else {
                setForms([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const getPublicUrl = (form) => {
        return `${BASE_URL}/f/${form.uuid}`;
    };

    const copyToClipboard = (e, form) => {
        e.stopPropagation();
        const url = getPublicUrl(form);
        navigator.clipboard.writeText(url);
        setCopiedId(form.id);
        toast.success("Link nusxalandi!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openPublicForm = (e, form) => {
        e.stopPropagation();
        window.open(getPublicUrl(form), '_blank');
    };

    const handleDelete = async (e, form) => {
        e.stopPropagation();
        if (window.confirm(`"${form.title}" formasini o'chirishni istaysizmi?`)) {
            try {
                await api.delete(`/forms/${form.id}/`);
                setForms(forms.filter(f => f.id !== form.id));
                toast.success("Forma o'chirildi");
            } catch (error) {
                console.error(error);
                toast.error("O'chirishda xatolik yuz berdi");
            }
        }
    };

    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        (f.title_admin && f.title_admin.toLowerCase().includes(search.toLowerCase()))
    );

    const activeCount = forms.filter(f => f.is_active).length;
    const totalSubmissions = forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);

    return (
        <div className="forms-page animate-fadeIn">
            <div className="forms-container">

                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <h1 className="page-title">Formalar</h1>
                        <p className="page-subtitle">Yangi formalar yarating va natijalarni kuzatib boring.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-primary" onClick={() => navigate('/forms/new')}>
                            <PlusIcon />
                            <span>Forma yaratish</span>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="forms-stats-grid">
                    <StatCard
                        label="Jami formalar"
                        value={forms.length}
                        icon={LayoutIcon}
                        iconClass="purple"
                    />
                    <StatCard
                        label="Faol formalar"
                        value={activeCount}
                        icon={CheckCircleIcon}
                        iconClass="green"
                    />
                    <StatCard
                        label="Jami javoblar"
                        value={totalSubmissions}
                        icon={UsersIcon}
                        iconClass="blue"
                    />
                </div>

                {/* Search */}
                <div className="forms-search-bar">
                    <div className="search-input-wrapper">
                        <SearchIcon />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Qidirish (nomi)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="forms-skeleton-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="forms-skeleton-card"></div>
                        ))}
                    </div>
                ) : filteredForms.length === 0 ? (
                    <div className="forms-empty-state">
                        <div className="forms-empty-icon">
                            <SearchIcon />
                        </div>
                        <h3 className="forms-empty-title">
                            {search ? "Hech narsa topilmadi" : "Formalar mavjud emas"}
                        </h3>
                        <p className="forms-empty-text">
                            {search ? "Qidiruv so'zini o'zgartirib ko'ring." : "Yangi forma yarating va ishni boshlang."}
                        </p>
                        {!search && (
                            <button className="forms-empty-btn" onClick={() => navigate('/forms/new')}>
                                + Yaratish
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="forms-grid">
                        {filteredForms.map((form) => (
                            <div key={form.id} className="form-card">
                                {/* Card Header */}
                                <div className="form-card-header">
                                    <div className="form-card-icon">
                                        <FileTextIcon />
                                    </div>
                                    <span className={`form-card-status ${form.is_active ? 'active' : 'draft'}`}>
                                        {form.is_active ? 'Active' : 'Draft'}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="form-card-body">

                                    <h3
                                        className="form-card-title"
                                        onClick={() => navigate(`/forms/${form.id}/edit`)}
                                    >
                                        {form.title_admin}
                                    </h3>
                                    <div className="form-card-meta">
                                        <span className="form-card-id">ID: {form.id}</span>
                                        <span>•</span>
                                        <span>{new Date(form.created_at).toLocaleDateString()}</span>
                                        {form.submission_count > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="form-card-submissions">
                                                    <UsersIcon /> {form.submission_count} javob
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Public URL Section */}
                                <div className="form-card-url-section">
                                    <div className="form-card-url-label">
                                        <LinkIcon />
                                        <span>Public link:</span>
                                    </div>
                                    <div className="form-card-url-box">
                                        <input
                                            type="text"
                                            readOnly
                                            value={getPublicUrl(form)}
                                            className="form-card-url-input"
                                            onClick={(e) => e.target.select()}
                                        />
                                        <button
                                            className={`form-card-url-copy ${copiedId === form.id ? 'copied' : ''}`}
                                            onClick={(e) => copyToClipboard(e, form)}
                                            title="Nusxalash"
                                        >
                                            {copiedId === form.id ? '✓' : <CopyIcon />}
                                        </button>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="form-card-footer">
                                    <div className="form-card-actions">
                                        <button
                                            className="form-card-action-btn primary"
                                            onClick={(e) => openPublicForm(e, form)}
                                            title="Ko'rish"
                                        >
                                            <EyeIcon />
                                            <span>Ko'rish</span>
                                        </button>
                                        <button
                                            className="form-card-action-btn"
                                            onClick={() => navigate(`/forms/${form.id}/edit`)}
                                            title="Tahrirlash"
                                        >
                                            <EditIcon />
                                            <span>Tahrirlash</span>
                                        </button>
                                        <button
                                            className="form-card-action-btn"
                                            onClick={() => navigate(`/forms/${form.id}/submissions`)}
                                            title="Javoblar"
                                        >
                                            <UsersIcon />
                                            <span>Javoblar</span>
                                        </button>
                                        <button
                                            className="form-card-action-btn danger"
                                            onClick={(e) => handleDelete(e, form)}
                                            title="O'chirish"
                                        >
                                            <TrashIcon />
                                            <span>O'chirish</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormList;
