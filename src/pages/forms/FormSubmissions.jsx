import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import api from '../../services/api';
import { toast } from 'sonner';

// Inline styles for premium design
const styles = {
    page: {
        minHeight: '100vh',
        background: "var(--bg-primary)",
        color: '#e2e8f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '32px',
    },
    container: {
        maxWidth: '1600px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        marginBottom: '32px',
    },
    breadcrumb: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
    },
    separator: {
        color: '#475569',
    },
    formTitle: {
        color: '#94a3b8',
        fontSize: '14px',
    },
    pageTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#ffffff',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    badge: {
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
        color: '#a78bfa',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 12px',
        borderRadius: '20px',
        border: '1px solid rgba(167, 139, 250, 0.3)',
    },
    refreshButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    tableCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
    },
    tableHead: {
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    th: {
        padding: '16px 20px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
    },
    thCenter: {
        textAlign: 'center',
        width: '60px',
    },
    tr: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'background 0.2s ease',
    },
    trHover: {
        background: 'rgba(255, 255, 255, 0.03)',
    },
    td: {
        padding: '16px 20px',
        fontSize: '14px',
        color: '#cbd5e1',
        whiteSpace: 'nowrap',
    },
    tdCenter: {
        textAlign: 'center',
        color: '#64748b',
        fontFamily: 'monospace',
        fontSize: '12px',
    },
    tdMono: {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#64748b',
    },
    link: {
        color: '#818cf8',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'color 0.2s ease',
    },
    emptyCell: {
        color: '#475569',
        fontStyle: 'italic',
    },
    badgeYes: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        background: 'rgba(34, 197, 94, 0.15)',
        color: '#4ade80',
        border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    badgeNo: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        background: 'rgba(244, 63, 94, 0.15)',
        color: '#fb7185',
        border: '1px solid rgba(244, 63, 94, 0.3)',
    },
    emptyState: {
        padding: '80px 20px',
        textAlign: 'center',
    },
    emptyIcon: {
        width: '64px',
        height: '64px',
        margin: '0 auto 16px auto',
        background: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748b',
        fontSize: '16px',
    },
    loadingWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(99, 102, 241, 0.2)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    errorState: {
        padding: '48px',
        textAlign: 'center',
        color: '#f87171',
        fontSize: '16px',
    },
    truncate: {
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

const keyframesStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

const FormSubmissions = () => {
    usePageTitle('Javoblar');
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [isRefreshHovered, setIsRefreshHovered] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [formRes, subRes] = await Promise.all([
                api.get(`/forms/${id}/`),
                api.get(`/forms/${id}/submissions/`)
            ]);
            setForm(formRes.data);
            setSubmissions(subRes.data.results || subRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <>
            <style>{keyframesStyle}</style>
            <div style={styles.loadingWrapper}>
                <div style={styles.spinner}></div>
            </div>
        </>
    );

    if (!form) return (
        <>
            <style>{keyframesStyle}</style>
            <div style={styles.loadingWrapper}>
                <div style={styles.errorState}>Forma topilmadi</div>
            </div>
        </>
    );

    const columns = form.fields || [];

    return (
        <>
            <style>{keyframesStyle}</style>
            <div style={styles.page}>
                <div style={styles.container}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div>
                            <div style={styles.breadcrumb}>
                                <button
                                    onClick={() => navigate('/forms')}
                                    onMouseEnter={() => setIsBackHovered(true)}
                                    onMouseLeave={() => setIsBackHovered(false)}
                                    style={{
                                        ...styles.backButton,
                                        color: isBackHovered ? '#ffffff' : '#64748b',
                                        background: isBackHovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span style={styles.separator}>/</span>
                                <span style={styles.formTitle}>{form.title}</span>
                            </div>
                            <h1 style={styles.pageTitle}>
                                Javoblar
                                <span style={styles.badge}>{submissions.length} ta</span>
                            </h1>
                        </div>
                        <button
                            onClick={loadData}
                            onMouseEnter={() => setIsRefreshHovered(true)}
                            onMouseLeave={() => setIsRefreshHovered(false)}
                            style={{
                                ...styles.refreshButton,
                                background: isRefreshHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                                borderColor: isRefreshHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                            </svg>
                            Yangilash
                        </button>
                    </div>

                    {/* Table */}
                    <div style={styles.tableCard}>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead style={styles.tableHead}>
                                    <tr>
                                        <th style={{ ...styles.th, ...styles.thCenter }}>#</th>
                                        <th style={styles.th}>Sana</th>
                                        <th style={styles.th}>Lead</th>
                                        {columns.map(col => (
                                            <th key={col.key} style={{ ...styles.th, minWidth: '150px' }}>
                                                {col.label}
                                            </th>
                                        ))}
                                        <th style={styles.th}>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length + 4} style={styles.emptyState}>
                                                <div style={styles.emptyIcon}>
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="9" y1="15" x2="15" y2="15"></line>
                                                    </svg>
                                                </div>
                                                <p style={styles.emptyText}>Hozircha javoblar yo'q</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.map((sub, idx) => (
                                            <tr
                                                key={sub.id}
                                                style={{
                                                    ...styles.tr,
                                                    ...(hoveredRow === idx ? styles.trHover : {}),
                                                }}
                                                onMouseEnter={() => setHoveredRow(idx)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                            >
                                                <td style={{ ...styles.td, ...styles.tdCenter }}>
                                                    {idx + 1}
                                                </td>
                                                <td style={styles.td}>
                                                    {new Date(sub.created_at).toLocaleString('uz-UZ', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td style={styles.td}>
                                                    {sub.lead ? (
                                                        <a
                                                            href={`/leads?id=${sub.lead}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={styles.link}
                                                        >
                                                            Ko'rish
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                                            </svg>
                                                        </a>
                                                    ) : (
                                                        <span style={styles.emptyCell}>—</span>
                                                    )}
                                                </td>
                                                {columns.map(col => (
                                                    <td key={col.key} style={styles.td}>
                                                        {typeof sub.data?.[col.key] === 'boolean'
                                                            ? (sub.data[col.key] ? (
                                                                <span style={styles.badgeYes}>Ha</span>
                                                            ) : (
                                                                <span style={styles.badgeNo}>Yo'q</span>
                                                            ))
                                                            : (
                                                                <div style={styles.truncate} title={sub.data?.[col.key]?.toString()}>
                                                                    {sub.data?.[col.key] || <span style={styles.emptyCell}>—</span>}
                                                                </div>
                                                            )}
                                                    </td>
                                                ))}
                                                <td style={{ ...styles.td, ...styles.tdMono }}>
                                                    {sub.ip_address}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FormSubmissions;
