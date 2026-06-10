import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await analyticsService.getSummary();
            setSummary(res.data);
        } catch (error) {
            console.error("Dashboard stats error:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: "O'quvchilar", value: summary?.counts?.students || '0', color: 'primary', icon: 'users' },
        { label: 'Yangi qabul (oy)', value: summary?.counts?.new_students_month || '0', color: 'success', icon: 'check-circle' },
        { label: 'Qarzdorlar', value: summary?.counts?.debtor_students || '0', color: 'warning', icon: 'briefcase' },
        { label: 'Konversiya', value: (summary?.counts?.conversion_rate || '0') + '%', color: 'cyan', icon: 'trending-up' },
    ];

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

    const getSourceLabel = (source) => {
        if (!source || source === 'null' || source === 'undefined') return 'Kiritilmagan / Boshqa';
        const mappings = {
            'Telegramda': 'Telegram',
            'Instagramda': 'Instagram',
            'YouTubeda': 'YouTube',
            'Odamlar orasida': 'Odamlar orasida',
            'Xech qayerda': 'Tavsiya / Boshqa'
        };
        return mappings[source] || source;
    };

    const processedSourceDistribution = (summary?.charts?.source_distribution || []).map(item => ({
        ...item,
        displaySource: getSourceLabel(item.source)
    }));

    const getDateInfo = () => {
        const date = new Date();
        const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return {
            weekday: weekdays[date.getDay()],
            formatted: `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`
        };
    };

    const dateInfo = getDateInfo();

    if (loading && !summary) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-content animate-fadeIn">
            <header className="dashboard-header">
                <div className="header-info">
                    <p className="greeting">Xush kelibsiz,</p>
                    <h1 className="title">
                        {user?.first_name || user?.username || 'Admin'} <span>👋</span>
                    </h1>
                </div>
                <div className="date-box">
                    <CalendarIcon />
                    <div>
                        <span className="date-label">{dateInfo.weekday}</span>
                        <span className="date-value">{dateInfo.formatted}</span>
                    </div>
                </div>
            </header>

            {/* Counts Section */}
            <section className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className={`stat-card stat-${stat.color}`}>
                        <div className="stat-icon">
                            <StatIcon type={stat.icon} />
                        </div>
                        <div className="stat-info-box">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Charts Section */}
            <section className="charts-grid-layout">
                {/* Leads Growth */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Oylik Leadlar o'sishi</h3>
                    </div>
                    <div className="chart-container">
                        {!summary?.charts?.leads_growth || summary.charts.leads_growth.length === 0 ? (
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={summary?.charts?.leads_growth || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: 'var(--text-primary)',
                                            boxShadow: 'var(--shadow-lg)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        labelStyle={{ color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}
                                        formatter={(value) => [value, "Leadlar soni"]}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Lead Stages */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Leadlar bosqichlari</h3>
                    </div>
                    <div className="chart-container">
                        {!summary?.charts?.stage_distribution || summary.charts.stage_distribution.length === 0 ? (
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={summary?.charts?.stage_distribution || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: 'var(--text-primary)',
                                            boxShadow: 'var(--shadow-lg)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        labelStyle={{ color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={32}>
                                        {(summary?.charts?.stage_distribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Lead Sources */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Mijozlar manbasi</h3>
                    </div>
                    {processedSourceDistribution.length === 0 ? (
                        <div className="chart-container">
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        </div>
                    ) : (
                        <>
                            <div className="chart-container pie-chart-container">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={processedSourceDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="displaySource"
                                            stroke="none"
                                        >
                                            {processedSourceDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            wrapperStyle={{ zIndex: 1000 }}
                                            contentStyle={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                color: 'var(--text-primary)',
                                                boxShadow: 'var(--shadow-lg)',
                                                padding: '10px 14px'
                                            }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            labelStyle={{ color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Custom Legend */}
                            <div className="custom-pie-legend">
                                {processedSourceDistribution.map((item, index) => (
                                    <div key={index} className="legend-item">
                                        <span
                                            className="legend-dot"
                                            style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                                        ></span>
                                        <span className="legend-text">{item.displaySource}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Top Operators */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Top Operatorlar</h3>
                    </div>
                    <div className="chart-container">
                        <div className="operators-list">
                            {summary?.top_operators?.length > 0 ? (
                                summary.top_operators.map((op, idx) => (
                                    <div key={idx} className="operator-item">
                                        <div className="operator-info">
                                            <div className="operator-avatar">
                                                {op.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="operator-details">
                                                <span className="operator-name">{op.full_name}</span>
                                                <span className="operator-leads">{op.lead_count} lead</span>
                                            </div>
                                        </div>
                                        <div className="operator-performance">
                                            <div className="performance-bar">
                                                <div
                                                    className="performance-fill"
                                                    style={{ width: `${Math.min(op.success_rate, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="performance-text">{op.success_rate}% samaradorlik</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-text">Ma'lumot mavjud emas</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// Icons
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

const StatIcon = ({ type }) => {
    if (type === 'users') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
    if (type === 'check-circle') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    if (type === 'briefcase') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    if (type === 'trending-up') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>;
};

export default Dashboard;
