import { useState, useEffect } from 'react';
import {
    Users, Eye, TrendingUp, Heart, MessageCircle, Bookmark,
    BarChart3, Image, Video, Link2, RefreshCw, ExternalLink,
    ArrowUpRight, ArrowDownRight, Minus, Share2, Clock, Calendar,
    Zap, Target, Activity, Award, Send, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart, RadialBarChart, RadialBar
} from 'recharts';
import { instagramService } from '../../services/instagram';
import { toast } from 'sonner';
import './InstagramStats.css';

const CHART_COLORS = ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888', '#8b5cf6'];
const GRADIENT_COLORS = {
    pink: { start: '#ec4899', end: '#db2777' },
    purple: { start: '#a855f7', end: '#7c3aed' },
    orange: { start: '#f97316', end: '#ea580c' },
    blue: { start: '#3b82f6', end: '#2563eb' },
    green: { start: '#10b981', end: '#059669' },
    red: { start: '#ef4444', end: '#dc2626' },
};

const InstagramStats = () => {
    // Descriptions for statistics
    const STAT_DESCRIPTIONS = {
        followers: "Tanlangan davr oralig'ida akkauntingizga qo'shilgan yangi obunachilar soni.",
        reach: "Profilingizni ko'rgan noyob foydalanuvchilar soni. Bitta odam 10 marta ko'rsa ham, reach 1 bo'lib hisoblanadi.",
        impressions: "Kontentingiz jami necha marta ko'rilgani. Bunga bir kishining bir necha marta ko'rishi ham kiradi.",
        profile_views: "Foydalanuvchilar sizning asosiy profilingizga necha marta kirganligi.",
        engagement_rate: "Obunachilaringizning kontentingizga bo'lgan qiziqishi (layklar va izohlar orqali hisoblanadi).",
        total_reach: "Belgilangan vaqt oralig'idagi barcha qamrovlar yig'indisi.",
        total_likes: "Barcha postlaringizga qo'yilgan umumiy layklar soni.",
        total_comments: "Barcha postlaringizga yozilgan umumiy izohlar soni.",
        best_time: "Postlaringiz eng ko'p layk va qiziqish to'playdigan kun vaqti.",
        best_day: "Haftaning qaysi kunida postlaringiz eng yaxshi natija ko'rsatishi.",
        performance: "Kontentingizning jalb qilish, barqarorlik va o'sish ko'rsatkichlari bo'yicha umumiy balli.",
        content_type: "Qaysi turdagi kontent (Rasm, Video, Reels) auditoriyangizga ko'proq yoqishini ko'rsatadi.",
        activity: "Hafta kunlari va soatlar bo'yicha postingiz qachon ko'proq natija berishini ko'rsatadi.",
        ff_ratio: "Obunachilar sonininig siz kuzatayotganlar soniga nisbati. Nisbat qancha yuqori bo'lsa, nufuz shuncha baland.",
        followers_total: "Sizni kuzatayotgan barcha foydalanuvchilar soni.",
        following_total: "Siz kuzatayotgan (podpiska tashlagan) akkauntlar soni.",
        posts_total: "Profilga joylangan barcha postlar (rasm, video, reels) soni.",
        engagement_dist: "Layklar ва izohlarning umumiy faollikdagi o'zaro ulushi.",
        reach_trend: "Vaqt davomida qamrov, taassurotlar va profil ko'rishlarining o'zgarish dinamikasi.",
        post_engagement: "Har bir post uchun alohida layk va izohlar ko'rsatkichi.",
        likes_trend: "Layklar sonining tanlangan vaqt oralig'idagi o'zgarishi.",
        audience_geo: "Obunachilaringiz asosiy qaysi davlatlar va shaharlarda yashashini ko'rsatadi.",
        audience_demographics: "Obunachilaringizning yoshi va jinsi bo'yicha taqsimoti.",
    };

    const StatInfo = ({ type }) => (
        <div className="ig-stat-info-wrap">
            <Info size={14} className="ig-stat-info-icon" />
            <div className="ig-stat-tooltip">
                {STAT_DESCRIPTIONS[type] || "Statistika haqida ma'lumot"}
            </div>
        </div>
    );
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [connected, setConnected] = useState(false);
    const [stats, setStats] = useState(null);
    const [media, setMedia] = useState([]);
    const [period, setPeriod] = useState('1_month');
    const [connecting, setConnecting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadInitial();
    }, []);

    useEffect(() => {
        if (selectedAccountId) {
            loadAllData();
        } else if (connected === false && accounts.length > 0) {
            // If we have accounts but none selected, select the first one
            setSelectedAccountId(accounts[0].id);
        }
    }, [selectedAccountId, period, accounts, connected]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedAccountId, period]);

    const loadInitial = async () => {
        try {
            setLoading(true);
            const res = await instagramService.getAccounts();
            const accountsList = res.data || [];
            setAccounts(accountsList);
            
            if (accountsList.length > 0) {
                setSelectedAccountId(accountsList[0].id);
            } else {
                setConnected(false);
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
            setLoading(false);
        }
    };

    const loadAllData = async () => {
        try {
            // First load profile to confirm connection
            const profileRes = await instagramService.getProfile(selectedAccountId);
            if (profileRes.data.connected) {
                setProfile(profileRes.data);
                setConnected(true);
                
                // Concurrently load stats and media
                await Promise.all([
                    loadStats(),
                    loadMedia()
                ]);
            } else {
                setConnected(false);
            }
        } catch (error) {
            console.error('Error loading account data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await instagramService.getStats(period, selectedAccountId);
            if (res.data.connected) {
                setStats(res.data.insights);
            }
        } catch (error) {
            console.error('Instagram stats error:', error);
        }
    };

    const loadMedia = async () => {
        try {
            // Fetch significantly more media for content browsing
            const mediaLimit = period === 'all_time' ? 1000 : period === '1_year' ? 500 : period === '6_month' ? 300 : period === '3_month' ? 150 : 100;
            const res = await instagramService.getMedia(mediaLimit, selectedAccountId);
            if (res.data.connected) {
                setMedia(res.data.media || []);
            }
        } catch (error) {
            console.error('Instagram media error:', error);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const redirectUri = `${window.location.origin}/instagram/callback`;
            const res = await instagramService.getAuthUrl(redirectUri);
            window.location.href = res.data.auth_url;
        } catch (error) {
            toast.error("Instagram ulanishda xatolik yuz berdi");
            setConnecting(false);
        }
    };

    const handleRefresh = async () => {
        toast.promise(
            loadAllData(),
            {
                loading: "Yangilanmoqda...",
                success: "Ma'lumotlar yangilandi!",
                error: "Xatolik yuz berdi",
            }
        );
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '—';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Prepare chart data from insights
    const getChartData = (metricName) => {
        if (!stats || !stats[metricName]) return [];
        return stats[metricName].map(item => ({
            date: new Date(item.end_time).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
            value: item.value,
        }));
    };

    // Get latest metric value
    const getLatestValue = (metricName) => {
        if (!stats || !stats[metricName] || stats[metricName].length === 0) return 0;
        const values = stats[metricName];
        return values[values.length - 1]?.value || 0;
    };

    // Get total metric value (sum of all values)
    const getTotalValue = (metricName) => {
        if (!stats || !stats[metricName]) return 0;
        return stats[metricName].reduce((sum, item) => sum + (item.value || 0), 0);
    };

    // Get trend (compare last 2 values)
    const getTrend = (metricName) => {
        if (!stats || !stats[metricName] || stats[metricName].length < 2) return 'neutral';
        const values = stats[metricName];
        const last = values[values.length - 1]?.value || 0;
        const prev = values[values.length - 2]?.value || 0;
        if (last > prev) return 'up';
        if (last < prev) return 'down';
        return 'neutral';
    };

    // Get trend percentage
    const getTrendPercentage = (metricName) => {
        if (!stats || !stats[metricName] || stats[metricName].length < 2) return 0;
        const values = stats[metricName];
        const last = values[values.length - 1]?.value || 0;
        const prev = values[values.length - 2]?.value || 1;
        return ((last - prev) / prev * 100).toFixed(1);
    };

    // Filter media based on selected period for engagement charts
    const getFilteredMedia = () => {
        if (!media.length) return [];
        if (period === 'all_time') return media;

        const now = new Date();
        let days = 30;
        if (period === '1_month') days = 30;
        else if (period === '3_month') days = 90;
        else if (period === '6_month') days = 180;
        else if (period === '1_year') days = 365;

        const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        const filtered = media.filter(m => new Date(m.timestamp) >= cutoff);
        return filtered;
    };

    const filteredMedia = getFilteredMedia();

    // Calculate engagement metrics from media
    const getEngagementRate = () => {
        if (!filteredMedia.length || !profile?.followers_count) return 0;
        const totalEngagement = filteredMedia.reduce((sum, m) => {
            return sum + (m.like_count || 0) + (m.comments_count || 0);
        }, 0);
        const avgEngagement = totalEngagement / filteredMedia.length;
        return ((avgEngagement / profile.followers_count) * 100).toFixed(2);
    };

    const getAvgLikes = () => {
        if (!filteredMedia.length) return 0;
        return Math.round(filteredMedia.reduce((sum, m) => sum + (m.like_count || 0), 0) / filteredMedia.length);
    };

    const getAvgComments = () => {
        if (!filteredMedia.length) return 0;
        return Math.round(filteredMedia.reduce((sum, m) => sum + (m.comments_count || 0), 0) / filteredMedia.length);
    };

    const getTotalLikes = () => filteredMedia.reduce((sum, m) => sum + (m.like_count || 0), 0);
    const getTotalComments = () => filteredMedia.reduce((sum, m) => sum + (m.comments_count || 0), 0);

    // Follower / Following ratio
    const getFollowerRatio = () => {
        if (!profile?.follows_count || profile.follows_count === 0) return 0;
        return (profile.followers_count / profile.follows_count).toFixed(2);
    };

    // Per-post engagement data for bar chart
    const getPostEngagementData = () => {
        return filteredMedia.slice(0, 15).map((post, i) => ({
            name: `#${i + 1}`,
            likes: post.like_count || 0,
            comments: post.comments_count || 0,
            caption: post.caption?.substring(0, 30) || `Post ${i + 1}`,
            date: formatDate(post.timestamp),
        })).reverse();
    };

    // Media type engagement comparison
    const getMediaTypeEngagement = () => {
        const typeMap = {};
        filteredMedia.forEach(m => {
            const type = m.media_type || 'OTHER';
            if (!typeMap[type]) typeMap[type] = { likes: 0, comments: 0, count: 0 };
            typeMap[type].likes += (m.like_count || 0);
            typeMap[type].comments += (m.comments_count || 0);
            typeMap[type].count += 1;
        });
        return Object.entries(typeMap).map(([type, data]) => ({
            name: type === 'IMAGE' ? 'Rasm' : type === 'VIDEO' ? 'Video' : type === 'CAROUSEL_ALBUM' ? 'Carousel' : type === 'REELS' ? 'Reels' : type,
            avgLikes: Math.round(data.likes / data.count),
            avgComments: Math.round(data.comments / data.count),
            totalPosts: data.count,
            engagementRate: profile?.followers_count ? ((data.likes + data.comments) / data.count / profile.followers_count * 100).toFixed(2) : 0,
        }));
    };

    // Posting activity by day of week
    const getPostingByDay = () => {
        const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const dayData = days.map(d => ({ name: d, posts: 0, avgLikes: 0, totalLikes: 0 }));
        filteredMedia.forEach(m => {
            if (m.timestamp) {
                const day = new Date(m.timestamp).getDay();
                dayData[day].posts += 1;
                dayData[day].totalLikes += (m.like_count || 0);
            }
        });
        dayData.forEach(d => {
            d.avgLikes = d.posts > 0 ? Math.round(d.totalLikes / d.posts) : 0;
        });
        return dayData;
    };

    // Posting activity by hour
    const getPostingByHour = () => {
        const hours = Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            posts: 0,
            avgLikes: 0,
            totalLikes: 0,
        }));
        filteredMedia.forEach(m => {
            if (m.timestamp) {
                const hour = new Date(m.timestamp).getHours();
                hours[hour].posts += 1;
                hours[hour].totalLikes += (m.like_count || 0);
            }
        });
        hours.forEach(h => {
            h.avgLikes = h.posts > 0 ? Math.round(h.totalLikes / h.posts) : 0;
        });
        return hours.filter(h => h.posts > 0);
    };

    // Best posting time
    const getBestPostingTime = () => {
        const hourData = getPostingByHour();
        if (!hourData.length) return null;
        return hourData.sort((a, b) => b.avgLikes - a.avgLikes)[0];
    };

    // Best posting day
    const getBestPostingDay = () => {
        const dayData = getPostingByDay();
        const best = dayData.filter(d => d.posts > 0).sort((a, b) => b.avgLikes - a.avgLikes)[0];
        return best || null;
    };

    // Likes trend over posts (timeline)
    const getLikesTrend = () => {
        return [...filteredMedia].reverse().map((post, i) => ({
            name: formatDate(post.timestamp),
            likes: post.like_count || 0,
            comments: post.comments_count || 0,
        }));
    };

    // Content performance radar
    const getContentPerformance = () => {
        if (!filteredMedia.length) return [];
        const maxLikes = Math.max(...filteredMedia.map(m => m.like_count || 0), 1);
        const maxComments = Math.max(...filteredMedia.map(m => m.comments_count || 0), 1);
        return [
            { metric: 'Engagement', value: Math.min(parseFloat(getEngagementRate()) * 20, 100) },
            { metric: 'Layklar', value: (getAvgLikes() / maxLikes) * 100 },
            { metric: 'Izohlar', value: (getAvgComments() / maxComments) * 100 },
            { metric: 'Barqarorlik', value: Math.min(media.length * 5, 100) },
            { metric: 'Faollik', value: Math.min((profile?.media_count || 0) / 10 * 100, 100) },
            { metric: 'Obuna nisbati', value: Math.min(parseFloat(getFollowerRatio()) * 10, 100) },
        ];
    };

    // Loading state
    if (loading) {
        return (
            <div className="instagram-page">
                <div className="ig-loading">
                    <div className="spinner"></div>
                    <p>Instagram ma'lumotlari yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    // Not connected — show beautiful CTA
    if (!connected) {
        return (
            <div className="instagram-page">
                <div className="ig-connect-cta">
                    <div className="ig-connect-icon">
                        <InstagramIcon />
                    </div>
                    <h2 className="ig-connect-title">Instagram Statistika</h2>
                    <p className="ig-connect-desc">
                        Instagram Business akkauntingizni ulang va postlar, obunachilar, 
                        reach va engagement statistikalarini real vaqtda kuzating.
                    </p>
                    <button
                        className="ig-connect-btn"
                        onClick={handleConnect}
                        disabled={connecting}
                    >
                        <InstagramIcon />
                        {connecting ? 'Ulanmoqda...' : 'Instagram ni ulash'}
                    </button>

                    <div className="ig-connect-features">
                        <div className="ig-connect-feature">
                            <div className="ig-connect-feature-icon">
                                <Users size={20} />
                            </div>
                            <span className="ig-connect-feature-text">Obunachilar tahlili</span>
                        </div>
                        <div className="ig-connect-feature">
                            <div className="ig-connect-feature-icon">
                                <Eye size={20} />
                            </div>
                            <span className="ig-connect-feature-text">Reach & Impressions</span>
                        </div>
                        <div className="ig-connect-feature">
                            <div className="ig-connect-feature-icon">
                                <Heart size={20} />
                            </div>
                            <span className="ig-connect-feature-text">Engagement metrikalari</span>
                        </div>
                        <div className="ig-connect-feature">
                            <div className="ig-connect-feature-icon">
                                <BarChart3 size={20} />
                            </div>
                            <span className="ig-connect-feature-text">Post statistikasi</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Build engagement data for pie chart
    const engagementData = [
        { name: 'Layklar', value: getAvgLikes(), color: '#ef4444' },
        { name: 'Izohlar', value: getAvgComments(), color: '#3b82f6' },
    ];

    // Media type distribution
    const mediaTypes = filteredMedia.reduce((acc, m) => {
        const type = m.media_type || 'OTHER';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    const mediaTypeData = Object.entries(mediaTypes).map(([name, value], i) => ({
        name: name === 'IMAGE' ? 'Rasm' : name === 'VIDEO' ? 'Video' : name === 'CAROUSEL_ALBUM' ? 'Carousel' : name === 'REELS' ? 'Reels' : name,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    // displayMedia should use ALL fetched media for the "Barcha Postlar" section, 
    // but can stay filtered for overview if we want. Let's make it ALL for content tab.
    const displayMedia = [...(activeTab === 'content' ? media : filteredMedia)]
        .sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)));

    const reachData = getChartData('reach');
    const impressionsData = getChartData('impressions');
    const profileViewsData = getChartData('profile_views');

    // Merge reach and impressions into one chart dataset
    const trendData = reachData.map((item, i) => ({
        date: item.date,
        reach: item.value,
        impressions: impressionsData[i]?.value || 0,
        profileViews: profileViewsData[i]?.value || 0,
    }));

    const bestTime = getBestPostingTime();
    const bestDay = getBestPostingDay();

    const customTooltipStyle = {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        fontSize: '12px',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-lg)',
    };

    return (
        <div className="instagram-page animate-fadeIn">
            {/* Header */}
            <div className="ig-header">
                <div className="ig-header-left">
                    <h1>
                        <InstagramIcon />
                        <span className="ig-gradient-text">Instagram Statistika</span>
                    </h1>
                    <p>Akkaunt va postlar statistikasi</p>
                </div>
                <div className="ig-header-right">
                    {accounts.length > 0 && (
                        <div className="ig-account-switcher">
                            <select 
                                className="ig-account-select"
                                value={selectedAccountId || ''}
                                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        @{acc.username}
                                    </option>
                                ))}
                            </select>
                            <button 
                                className="ig-add-account-btn"
                                onClick={handleConnect}
                                title="Yangi akkaunt qo'shish"
                            >
                                <Zap size={14} />
                                +
                            </button>
                        </div>
                    )}
                    <div className="ig-tab-group">
                        <button className={`ig-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                            <Activity size={14} />
                            Umumiy
                        </button>
                        <button className={`ig-tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
                            <Image size={14} />
                            Kontent
                        </button>
                        <button className={`ig-tab ${activeTab === 'audience' ? 'active' : ''}`} onClick={() => setActiveTab('audience')}>
                            <Users size={14} />
                            Auditoriya
                        </button>
                    </div>
                    <select
                        className="ig-period-select"
                        value={period}
                        onChange={(e) => { setPeriod(e.target.value); }}
                    >
                        <option value="1_month">1 oy</option>
                        <option value="3_month">3 oy</option>
                        <option value="6_month">6 oy</option>
                        <option value="1_year">1 yil</option>
                        <option value="all_time">Barcha vaqt</option>
                    </select>
                    <button className="ig-btn ig-btn-outline" onClick={handleRefresh}>
                        <RefreshCw size={16} />
                        Yangilash
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="ig-profile-card">
                {profile?.profile_picture_url ? (
                    <img
                        className="ig-profile-avatar"
                        src={profile.profile_picture_url}
                        alt={profile.username}
                    />
                ) : (
                    <div className="ig-profile-avatar-placeholder">
                        {profile?.username?.charAt(0)?.toUpperCase() || 'I'}
                    </div>
                )}
                <div className="ig-profile-info">
                    <h2 className="ig-profile-username">@{profile?.username || 'instagram'}</h2>
                    {profile?.name && (
                        <p className="ig-profile-name">{profile.name}</p>
                    )}
                    {profile?.biography && (
                        <p className="ig-profile-bio">{profile.biography}</p>
                    )}
                    <div className="ig-profile-stats">
                        <div className="ig-profile-stat">
                            <span className="ig-profile-stat-value">{formatNumber(profile?.followers_count)}</span>
                            <div className="ig-profile-stat-label-wrap">
                                <span className="ig-profile-stat-label">Obunachilar</span>
                                <StatInfo type="followers_total" />
                            </div>
                        </div>
                        <div className="ig-profile-stat">
                            <span className="ig-profile-stat-value">{formatNumber(profile?.follows_count)}</span>
                            <div className="ig-profile-stat-label-wrap">
                                <span className="ig-profile-stat-label">Obuna</span>
                                <StatInfo type="following_total" />
                            </div>
                        </div>
                        <div className="ig-profile-stat">
                            <span className="ig-profile-stat-value">{formatNumber(profile?.media_count)}</span>
                            <div className="ig-profile-stat-label-wrap">
                                <span className="ig-profile-stat-label">Postlar</span>
                                <StatInfo type="posts_total" />
                            </div>
                        </div>
                        <div className="ig-profile-stat">
                            <span className="ig-profile-stat-value">{getFollowerRatio()}</span>
                            <div className="ig-profile-stat-label-wrap">
                                <span className="ig-profile-stat-label">F/F Nisbat</span>
                                <StatInfo type="ff_ratio" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ig-profile-actions">
                    {profile?.connected_at && (
                        <span className="ig-connected-badge">
                            <span className="ig-connected-dot"></span>
                            Ulangan: {formatDate(profile.connected_at)}
                        </span>
                    )}
                </div>
            </div>

            {/* ==================== OVERVIEW TAB ==================== */}
            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards */}
                    <div className="ig-kpi-grid">
                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Yangi obunachilar</span>
                                    <StatInfo type="followers" />
                                </div>
                                <div className="ig-kpi-icon purple">
                                    <Users size={18} />
                                </div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(getLatestValue('follower_count'))}</div>
                            <div className={`ig-kpi-trend ${getTrend('follower_count')}`}>
                                {getTrend('follower_count') === 'up' ? <ArrowUpRight size={14} /> :
                                 getTrend('follower_count') === 'down' ? <ArrowDownRight size={14} /> :
                                 <Minus size={14} />}
                                {getTrendPercentage('follower_count') !== 0 ? `${getTrendPercentage('follower_count')}%` : 
                                 getTrend('follower_count') === 'up' ? "O'sish" : "Barqaror"}
                            </div>
                        </div>

                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Reach</span>
                                    <StatInfo type="reach" />
                                </div>
                                <div className="ig-kpi-icon pink">
                                    <Eye size={18} />
                                </div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(getLatestValue('reach'))}</div>
                            <div className={`ig-kpi-trend ${getTrend('reach')}`}>
                                {getTrend('reach') === 'up' ? <ArrowUpRight size={14} /> :
                                 getTrend('reach') === 'down' ? <ArrowDownRight size={14} /> :
                                 <Minus size={14} />}
                                {getTrendPercentage('reach') !== 0 ? `${getTrendPercentage('reach')}%` : 
                                 getTrend('reach') === 'up' ? "O'sish" : getTrend('reach') === 'down' ? 'Kamayish' : 'Barqaror'}
                            </div>
                        </div>

                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Impressions</span>
                                    <StatInfo type="impressions" />
                                </div>
                                <div className="ig-kpi-icon orange">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(getLatestValue('impressions'))}</div>
                            <div className={`ig-kpi-trend ${getTrend('impressions')}`}>
                                {getTrend('impressions') === 'up' ? <ArrowUpRight size={14} /> :
                                 getTrend('impressions') === 'down' ? <ArrowDownRight size={14} /> :
                                 <Minus size={14} />}
                                {getTrendPercentage('impressions') !== 0 ? `${getTrendPercentage('impressions')}%` : 'Barqaror'}
                            </div>
                        </div>

                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Profil ko'rishlari</span>
                                    <StatInfo type="profile_views" />
                                </div>
                                <div className="ig-kpi-icon blue">
                                    <BarChart3 size={18} />
                                </div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(getLatestValue('profile_views'))}</div>
                            <div className={`ig-kpi-trend ${getTrend('profile_views')}`}>
                                {getTrend('profile_views') === 'up' ? <ArrowUpRight size={14} /> :
                                 getTrend('profile_views') === 'down' ? <ArrowDownRight size={14} /> :
                                 <Minus size={14} />}
                                {getTrendPercentage('profile_views') !== 0 ? `${getTrendPercentage('profile_views')}%` : 'Barqaror'}
                            </div>
                        </div>

                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Engagement Rate</span>
                                    <StatInfo type="engagement_rate" />
                                </div>
                                <div className="ig-kpi-icon green">
                                    <Zap size={18} />
                                </div>
                            </div>
                            <div className="ig-kpi-value">{getEngagementRate()}%</div>
                            <div className="ig-kpi-trend neutral">
                                <Target size={14} />
                                O'rtacha post bo'yicha
                            </div>
                        </div>

                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Jami Reach</span>
                                    <StatInfo type="total_reach" />
                                </div>
                                <div className="ig-kpi-icon pink">
                                    <Activity size={18} />
                                </div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(getTotalValue('reach'))}</div>
                            <div className="ig-kpi-trend neutral">
                                <Calendar size={14} />
                                Tanlangan davr uchun
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards Row */}
                    <div className="ig-summary-row">
                        <div className="ig-summary-card likes">
                            <div className="ig-summary-line-wrapper">
                                <div className="ig-summary-line" />
                            </div>
                            <div className="ig-summary-icon">
                                <Heart size={22} />
                            </div>
                            <div className="ig-summary-data">
                                <span className="ig-summary-value">{formatNumber(getTotalLikes())}</span>
                                <div className="ig-summary-label-wrap">
                                    <span className="ig-summary-label">Jami Layklar</span>
                                    <StatInfo type="total_likes" />
                                </div>
                            </div>
                            <div className="ig-summary-avg">
                                O'rtacha: {formatNumber(getAvgLikes())} / post
                            </div>
                        </div>
                        <div className="ig-summary-card comments">
                            <div className="ig-summary-line-wrapper">
                                <div className="ig-summary-line" />
                            </div>
                            <div className="ig-summary-icon">
                                <MessageCircle size={22} />
                            </div>
                            <div className="ig-summary-data">
                                <span className="ig-summary-value">{formatNumber(getTotalComments())}</span>
                                <div className="ig-summary-label-wrap">
                                    <span className="ig-summary-label">Jami Izohlar</span>
                                    <StatInfo type="total_comments" />
                                </div>
                            </div>
                            <div className="ig-summary-avg">
                                O'rtacha: {formatNumber(getAvgComments())} / post
                            </div>
                        </div>
                        <div className="ig-summary-card best-time">
                            <div className="ig-summary-line-wrapper">
                                <div className="ig-summary-line" />
                            </div>
                            <div className="ig-summary-icon">
                                <Clock size={22} />
                            </div>
                            <div className="ig-summary-data">
                                <span className="ig-summary-value">{bestTime ? bestTime.name : '—'}</span>
                                <div className="ig-summary-label-wrap">
                                    <span className="ig-summary-label">Eng yaxshi vaqt</span>
                                    <StatInfo type="best_time" />
                                </div>
                            </div>
                            <div className="ig-summary-avg">
                                O'rtacha: {bestTime ? formatNumber(bestTime.avgLikes) : 0} layk
                            </div>
                        </div>
                        <div className="ig-summary-card best-day">
                            <div className="ig-summary-line-wrapper">
                                <div className="ig-summary-line" />
                            </div>
                            <div className="ig-summary-icon">
                                <Calendar size={22} />
                            </div>
                            <div className="ig-summary-data">
                                <span className="ig-summary-value">{bestDay ? bestDay.name : '—'}</span>
                                <div className="ig-summary-label-wrap">
                                    <span className="ig-summary-label">Eng yaxshi kun</span>
                                    <StatInfo type="best_day" />
                                </div>
                            </div>
                            <div className="ig-summary-avg">
                                O'rtacha: {bestDay ? formatNumber(bestDay.avgLikes) : 0} layk
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="ig-charts-grid">
                        {/* Reach, Impressions & Profile Views Trend */}
                        <div className="ig-chart-card wide">
                            <div className="ig-chart-header">
                                <h3>Reach, Impressions & Profil ko'rishlari</h3>
                                <StatInfo type="reach_trend" />
                                <span className="ig-chart-badge">{
                                    period === '1_month' ? '1 oy' : 
                                    period === '3_month' ? '3 oy' : 
                                    period === '6_month' ? '6 oy' : '1 yil'
                                }</span>
                            </div>
                            {!trendData || trendData.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="igReachGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc2743" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#dc2743" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="igImpGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f09433" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f09433" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="reach" name="Reach" stroke="#dc2743" strokeWidth={2.5} fill="url(#igReachGrad)" />
                                        <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#f09433" strokeWidth={2.5} fill="url(#igImpGrad)" />
                                        <Line type="monotone" dataKey="profileViews" name="Profil ko'rishlari" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Engagement Pie */}
                        <div className="ig-chart-card">
                            <div className="ig-chart-header">
                                <h3>Engagement taqsimoti</h3>
                                <StatInfo type="engagement_dist" />
                            </div>
                            {!engagementData || engagementData.length === 0 || (getAvgLikes() === 0 && getAvgComments() === 0) ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={engagementData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {engagementData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={customTooltipStyle}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(val) => [formatNumber(val), "O'rtacha"]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Content Performance Radar */}
                        <div className="ig-chart-card">
                            <div className="ig-chart-header">
                                <h3>Kontent samaradorligi</h3>
                                <StatInfo type="performance" />
                            </div>
                            {!getContentPerformance() || getContentPerformance().length === 0 || filteredMedia.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadarChart data={getContentPerformance()}>
                                        <PolarGrid stroke="var(--border-color)" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <PolarRadiusAxis tick={false} axisLine={false} />
                                        <Radar name="Ball" dataKey="value" stroke="#dc2743" fill="#dc2743" fillOpacity={0.2} strokeWidth={2} />
                                        <Tooltip contentStyle={customTooltipStyle} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ==================== CONTENT TAB ==================== */}
            {activeTab === 'content' && (
                <>
                    {/* Post Engagement Bar Chart */}
                    <div className="ig-charts-grid">
                        <div className="ig-chart-card wide animate-fadeIn">
                            <div className="ig-chart-header">
                                <h3>Postlar bo'yicha engagement</h3>
                                <StatInfo type="post_engagement" />
                                <span className="ig-chart-badge">Oxirgi {Math.min(15, media.length)} post</span>
                            </div>
                            {!getPostEngagementData() || getPostEngagementData().length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={getPostEngagementData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip
                                            contentStyle={customTooltipStyle}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                                        />
                                        <Legend />
                                        <Bar dataKey="likes" name="Layklar" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="comments" name="Izohlar" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Likes Trend Line */}
                        <div className="ig-chart-card wide animate-fadeIn">
                            <div className="ig-chart-header">
                                <h3>Layklar dinamikasi</h3>
                                <StatInfo type="likes_trend" />
                                <span className="ig-chart-badge">Vaqt bo'yicha</span>
                            </div>
                            {!filteredMedia || filteredMedia.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={getLikesTrend()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="likesTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="commentsTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="likes" name="Layklar" stroke="#ef4444" strokeWidth={2} fill="url(#likesTrendGrad)" />
                                        <Area type="monotone" dataKey="comments" name="Izohlar" stroke="#3b82f6" strokeWidth={2} fill="url(#commentsTrendGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Media Type Engagement Comparison */}
                        <div className="ig-chart-card">
                            <div className="ig-chart-header">
                                <h3>Kontent turi bo'yicha o'rtacha</h3>
                                <StatInfo type="content_type" />
                            </div>
                            {!filteredMedia || filteredMedia.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={getMediaTypeEngagement()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} />
                                        <Legend />
                                        <Bar dataKey="avgLikes" name="O'rt. Layk" fill="#f09433" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="avgComments" name="O'rt. Izoh" fill="#cc2366" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Media Types Pie */}
                        <div className="ig-chart-card">
                            <div className="ig-chart-header">
                                <h3>Kontent turlari</h3>
                                <StatInfo type="media_types" />
                            </div>
                            {!filteredMedia || filteredMedia.length === 0 || mediaTypeData.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={mediaTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {mediaTypeData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Media Type Stats Table */}
                    <div className="ig-table-card">
                        <div className="ig-chart-header">
                            <h3>Kontent turi statistikasi</h3>
                            <StatInfo type="content_table" />
                        </div>
                        <div className="ig-table-wrapper">
                            <table className="ig-table">
                                <thead>
                                    <tr>
                                        <th>Turi</th>
                                        <th>Postlar</th>
                                        <th>O'rt. Layk</th>
                                        <th>O'rt. Izoh</th>
                                        <th>Engagement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getMediaTypeEngagement().map((type, i) => (
                                        <tr key={i}>
                                            <td>
                                                <span className="ig-table-type-badge" style={{ background: CHART_COLORS[i % CHART_COLORS.length] + '20', color: CHART_COLORS[i % CHART_COLORS.length] }}>
                                                    {type.name}
                                                </span>
                                            </td>
                                            <td>{type.totalPosts}</td>
                                            <td>{formatNumber(type.avgLikes)}</td>
                                            <td>{formatNumber(type.avgComments)}</td>
                                            <td>
                                                <span className={`ig-table-engagement ${parseFloat(type.engagementRate) > 3 ? 'high' : parseFloat(type.engagementRate) > 1 ? 'medium' : 'low'}`}>
                                                    {type.engagementRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Media Grid — Top Posts */}
                    <div className="ig-media-section">
                        <h2>
                            <Image size={22} />
                            Barcha Postlar
                        </h2>
                        <div className="ig-media-grid">
                            {displayMedia.slice((currentPage - 1) * 12, currentPage * 12).map((post, i) => (
                                <div key={post.id} className="ig-media-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="ig-media-img-wrap">
                                        <img
                                            src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                                            alt={post.caption?.substring(0, 50) || 'Instagram post'}
                                            loading="lazy"
                                        />
                                        <span className="ig-media-type-badge">
                                            {post.media_type === 'VIDEO' ? <Video size={12} /> : <Image size={12} />}
                                            {' '}{post.media_type === 'IMAGE' ? 'Rasm' : post.media_type === 'VIDEO' ? 'Video' : post.media_type === 'REELS' ? 'Reels' : 'Carousel'}
                                        </span>
                                        {((currentPage - 1) * 12 + i) < 3 && <span className="ig-media-rank-badge">#{(currentPage - 1) * 12 + i + 1}</span>}
                                    </div>
                                    <div className="ig-media-body">
                                        {post.caption && (
                                            <p className="ig-media-caption">{post.caption}</p>
                                        )}
                                        <div className="ig-media-metrics">
                                            <div className="ig-media-metric">
                                                <Heart size={14} />
                                                <span className="metric-value">{formatNumber(post.like_count)}</span>
                                            </div>
                                            <div className="ig-media-metric">
                                                <MessageCircle size={14} />
                                                <span className="metric-value">{formatNumber(post.comments_count)}</span>
                                            </div>
                                            {post.insights?.reach && (
                                                <div className="ig-media-metric">
                                                    <Eye size={14} />
                                                    <span className="metric-value">{formatNumber(post.insights.reach)}</span>
                                                </div>
                                            )}
                                            {post.insights?.saved && (
                                                <div className="ig-media-metric">
                                                    <Bookmark size={14} />
                                                    <span className="metric-value">{formatNumber(post.insights.saved)}</span>
                                                </div>
                                            )}
                                            {post.insights?.shares && (
                                                <div className="ig-media-metric">
                                                    <Share2 size={14} />
                                                    <span className="metric-value">{formatNumber(post.insights.shares)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ig-media-date">
                                            {formatDate(post.timestamp)}
                                            {post.permalink && (
                                                <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                                                   style={{ marginLeft: '8px', color: 'var(--accent-primary)' }}>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {displayMedia.length > 12 && (
                            <div className="ig-pagination">
                                <button 
                                    className="ig-page-btn"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                
                                {Array.from({ length: Math.min(5, Math.ceil(displayMedia.length / 12)) }, (_, i) => {
                                    const totalPages = Math.ceil(displayMedia.length / 12);
                                    let pageNum;
                                    
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`ig-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                
                                <button 
                                    className="ig-page-btn"
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(displayMedia.length / 12), p + 1))}
                                    disabled={currentPage === Math.ceil(displayMedia.length / 12)}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ==================== AUDIENCE TAB ==================== */}
            {activeTab === 'audience' && (
                <>
                    {/* Audience KPI */}
                    <div className="ig-kpi-grid">
                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Obunachilar</span>
                                    <StatInfo type="followers_total" />
                                </div>
                                <div className="ig-kpi-icon purple"><Users size={18} /></div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(profile?.followers_count)}</div>
                            <div className="ig-kpi-progress">
                                <div className="ig-kpi-progress-bar" style={{ width: '100%', background: 'linear-gradient(90deg, #a855f7, #7c3aed)' }}></div>
                            </div>
                        </div>
                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Obuna</span>
                                    <StatInfo type="following_total" />
                                </div>
                                <div className="ig-kpi-icon blue"><Send size={18} /></div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(profile?.follows_count)}</div>
                            <div className="ig-kpi-progress">
                                <div className="ig-kpi-progress-bar" style={{
                                    width: `${Math.min((profile?.follows_count / (profile?.followers_count || 1)) * 100, 100)}%`,
                                    background: 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                }}></div>
                            </div>
                        </div>
                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">F/F Nisbat</span>
                                    <StatInfo type="ff_ratio" />
                                </div>
                                <div className="ig-kpi-icon green"><Target size={18} /></div>
                            </div>
                            <div className="ig-kpi-value">{getFollowerRatio()}</div>
                            <div className="ig-kpi-trend neutral">
                                {parseFloat(getFollowerRatio()) > 1 ? '✅ Yaxshi nisbat' : '⚠️ Yaxshilash kerak'}
                            </div>
                        </div>
                        <div className="ig-kpi-card">
                            <div className="ig-kpi-header">
                                <div className="ig-kpi-label-wrap">
                                    <span className="ig-kpi-label">Jami Impressions</span>
                                    <StatInfo type="impressions" />
                                </div>
                                <div className="ig-kpi-icon orange"><TrendingUp size={18} /></div>
                            </div>
                            <div className="ig-kpi-value">{formatNumber(getTotalValue('impressions'))}</div>
                            <div className="ig-kpi-trend neutral">
                                <Calendar size={14} />
                                Tanlangan davr
                            </div>
                        </div>
                    </div>

                    <div className="ig-charts-grid">
                        {/* Posting by Day of Week */}
                        <div className="ig-chart-card">
                            <div className="ig-chart-header">
                                <h3>Hafta kunlari bo'yicha faollik</h3>
                                <StatInfo type="activity" />
                            </div>
                            {!filteredMedia || filteredMedia.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={getPostingByDay()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip
                                            contentStyle={customTooltipStyle}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(val, name) => [val, name === 'posts' ? 'Postlar' : "O'rt. Layk"]}
                                        />
                                        <Legend formatter={(value) => value === 'posts' ? 'Postlar' : "O'rt. Layk"} />
                                        <Bar dataKey="posts" name="posts" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={25} />
                                        <Bar dataKey="avgLikes" name="avgLikes" fill="#f09433" radius={[4, 4, 0, 0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Posting by Hour */}
                        <div className="ig-chart-card">
                            <div className="ig-chart-header">
                                <h3>Soat bo'yicha faollik</h3>
                                <StatInfo type="hourly_activity" />
                            </div>
                            {!filteredMedia || filteredMedia.length === 0 || getPostingByHour().length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={getPostingByHour()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip
                                            contentStyle={customTooltipStyle}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                        <Legend formatter={(value) => value === 'posts' ? 'Postlar' : "O'rt. Layk"} />
                                        <Bar dataKey="posts" name="posts" fill="#dc2743" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="avgLikes" name="avgLikes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Profile Views Dedicated Chart */}
                        <div className="ig-chart-card wide">
                            <div className="ig-chart-header">
                                <h3>Profil ko'rishlari dinamikasi</h3>
                                <StatInfo type="profile_views" />
                                <span className="ig-chart-badge">Detallashtirilgan</span>
                            </div>
                            {!profileViewsData || profileViewsData.length === 0 ? (
                                <div className="chart-no-data">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={profileViewsData.map(d => ({ ...d, name: d.date }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="profileViewsGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                        <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} />
                                        <Area type="monotone" dataKey="value" name="Profil ko'rishlari" stroke="#8b5cf6" strokeWidth={3} fill="url(#profileViewsGrad)" dot={{ r: 4, fill: '#8b5cf6' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Follower Demographics if available */}
                    {stats?.follower_demographics && (
                        <div className="ig-table-card">
                            <div className="ig-chart-header">
                                <h3>Auditoriya geografiyasi</h3>
                                <StatInfo type="audience_geo" />
                            </div>
                            <div className="ig-table-wrapper">
                                <table className="ig-table">
                                    <thead>
                                        <tr>
                                            <th>Shahar / Davlat / Hudud</th>
                                            <th>Obunachilar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Combined results from city/country metrics */}
                                        {(stats.follower_demographics.find(d => d.name === 'audience_city')?.total_value?.breakdowns?.[0]?.results || 
                                          stats.follower_demographics[0]?.total_value?.breakdowns?.[0]?.results || [])
                                            ?.sort((a, b) => b.value - a.value)
                                            ?.slice(0, 10)
                                            ?.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.dimension_values?.[0] || '—'}</td>
                                                    <td>{formatNumber(item.value)}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Custom Instagram SVG Icon
const InstagramIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

export default InstagramStats;
