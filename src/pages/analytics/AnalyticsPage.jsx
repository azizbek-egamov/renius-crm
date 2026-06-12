import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
    Users, Phone, TrendingUp, Calendar, Filter, Download,
    CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';

// amCharts 5 Imports
import { Root, Tooltip, Legend, color, percent } from "@amcharts/amcharts5";
import { XYChart, DateAxis, AxisRendererX, AxisRendererY, ValueAxis, LineSeries, CategoryAxis, ColumnSeries } from "@amcharts/amcharts5/xy";
import { PieChart, PieSeries, SlicedChart, FunnelSeries } from "@amcharts/amcharts5/percent";
import { PieChart as RePieChart, Pie as RePie, Cell as ReCell, BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis, CartesianGrid as ReCartesianGrid, Tooltip as ReTooltip, Legend as ReLegend, ResponsiveContainer as ReResponsiveContainer, LineChart as ReLineChart, Line as ReLine } from 'recharts';
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";

import AnalyticsFilterDrawer from './components/AnalyticsFilterDrawer';
import { getAnalytics, analyticsService } from '../../services/analytics';
import { getUsers } from '../../services/users';
import { toast } from 'sonner';
import { formatDateInput, isValidDateStr, parseUIDateToApi, formatApiDateToUI } from '../../utils/dateFormatter';
import './Analytics.css';
import api from '../../services/api';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <div className="tooltip-header">{label}</div>
                <div className="tooltip-body">
                    {payload.map((entry, index) => (
                        <div className="tooltip-row" key={index}>
                            <span className="tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }} />
                            <span className="tooltip-name">{entry.name}:</span>
                            <span className="tooltip-value">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [formalarData, setFormalarData] = useState(null);
    const [marketingData, setMarketingData] = useState(null);
    const [studentData, setStudentData] = useState(null);

    const [filterOpen, setFilterOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leads'); // leads | sales | students
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [hiddenStages, setHiddenStages] = useState([]); // Track hidden stage names for filtering

    // Filter State
    const [filters, setFilters] = useState({
        start_date: formatApiDateToUI(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]),
        end_date: formatApiDateToUI(new Date().toISOString().split('T')[0]),
        operator: '',

        stage: '',
        call_status: ''
    });

    // Reference data for filters
    const [operators, setOperators] = useState([]);

    const [stages, setStages] = useState([]);

    useEffect(() => {
        loadReferenceData();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const loadReferenceData = async () => {
        try {
            const [usersRes, stagesRes] = await Promise.all([
                api.get('/users/'),
                api.get('/lead-stages/')
            ]);
            setOperators(usersRes.data.results || usersRes.data || []);
            setStages(stagesRes.data.results || stagesRes.data || []);
        } catch (e) {
        }
    };

    const fetchAnalytics = async () => {
        const uiStart = filters.start_date && filters.start_date.includes('-') ? formatApiDateToUI(filters.start_date) : filters.start_date;
        const uiEnd = filters.end_date && filters.end_date.includes('-') ? formatApiDateToUI(filters.end_date) : filters.end_date;
        if (uiStart && !isValidDateStr(uiStart)) return;
        if (uiEnd && !isValidDateStr(uiEnd)) return;

        setLoading(true);
        try {
            const apiStart = filters.start_date && filters.start_date.includes('-') ? filters.start_date : parseUIDateToApi(filters.start_date);
            const apiEnd = filters.end_date && filters.end_date.includes('-') ? filters.end_date : parseUIDateToApi(filters.end_date);

            const [res, formalarRes, marketingRes, studentRes] = await Promise.all([
                analyticsService.getStats({
                    start_date: apiStart,
                    end_date: apiEnd,
                    stage: filters.stage || undefined,
                    operator: filters.operator || undefined
                }),
                analyticsService.getFormalarStats({
                    start_date: apiStart,
                    end_date: apiEnd
                }),
                analyticsService.getMarketingStats({
                    start_date: apiStart,
                    end_date: apiEnd
                }),
                api.get('/analytics/student_stats/', {
                    params: {
                        start_date: apiStart,
                        end_date: apiEnd
                    }
                })
            ]);

            setData(res.data);
            setFormalarData(formalarRes.data);
            setMarketingData(marketingRes.data);
            setStudentData(studentRes.data);
        } catch (error) {
            console.error("fetchAnalytics error details:", error);
            toast.error("Analitika ma'lumotlarini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };


    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };

    // amCharts Helper function to create root and apply themes
    const createRoot = (id) => {
        const el = typeof id === 'string' ? document.getElementById(id) : id;
        if (!el) return null;
        if (el._amchartsRoot) {
            el._amchartsRoot.dispose();
        }
        const root = Root.new(el);
        el._amchartsRoot = root;
        root.setThemes([
            am5themes_Animated.new(root),
            am5themes_Dark.new(root)
        ]);
        // Remove amCharts trademark if allowed/needed
        if (root._logo) root._logo.dispose();
        return root;
    };

    // 1. Daily Leads Trend (Area Chart)
    useLayoutEffect(() => {
        if (!data?.daily_leads || data.daily_leads.length === 0 || loading) return;
        if (!document.getElementById("trend-chart-div")) return;

        let root = createRoot("trend-chart-div");
        if (!root) return;
        let chart = root.container.children.push(XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            pinchZoomX: true
        }));

        let xAxis = chart.xAxes.push(DateAxis.new(root, {
            maxDeviation: 0.1,
            baseInterval: { timeUnit: "day", count: 1 },
            renderer: AxisRendererX.new(root, {
                minGridDistance: 50
            }),
            tooltip: Tooltip.new(root, {})
        }));

        let yAxis = chart.yAxes.push(ValueAxis.new(root, {
            renderer: AxisRendererY.new(root, {})
        }));

        let series = chart.series.push(LineSeries.new(root, {
            name: "Leadlar",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "count",
            valueXField: "date",
            tooltip: Tooltip.new(root, {
                labelText: "{valueY} ta lead"
            }),
            fill: color(0x6366f1),
            stroke: color(0x6366f1)
        }));

        series.fills.template.setAll({
            fillOpacity: 0.2,
            visible: true
        });

        series.data.setAll(data.daily_leads.map(item => ({
            date: new Date(item.date).getTime(),
            count: item.count
        })));

        series.appear(1000);
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [data?.daily_leads, loading, activeTab]);

    // 2. Stage Distribution (Funnel Chart)
    useLayoutEffect(() => {
        if (!data?.stage_distribution || data.stage_distribution.length === 0 || loading) return;
        if (!document.getElementById("stage-chart-div")) return;

        let root = createRoot("stage-chart-div");
        if (!root) return;
        let chart = root.container.children.push(SlicedChart.new(root, {
            layout: root.verticalLayout,
            paddingRight: 200
        }));

        let series = chart.series.push(FunnelSeries.new(root, {
            alignLabels: true,
            orientation: "vertical",
            valueField: "_size",
            categoryField: "stage_name",
            bottomRatio: 1
        }));

        series.slices.template.setAll({
            strokeOpacity: 0.2,
            stroke: color(0x1a1a2e),
            strokeWidth: 2,
            fillOpacity: 0.92
        });

        series.slices.template.adapters.add("fill", (fill, target) => {
            const dataItem = target.dataItem.dataContext;
            return color(dataItem.stage_color || 0x6366f1);
        });

        // Show real count in labels via adapter
        series.labels.template.setAll({
            fontSize: 11,
            fill: color(0xffffff),
            oversizedBehavior: "truncate",
            maxWidth: 190,
            paddingLeft: 10
        });
        series.labels.template.adapters.add("text", (text, target) => {
            const ctx = target.dataItem?.dataContext;
            return ctx ? `${ctx.stage_name}: [bold]${ctx.real_count}[/]` : text;
        });

        series.ticks.template.setAll({
            stroke: color(0xffffff),
            strokeOpacity: 0.3,
            strokeDasharray: [4, 3],
            strokeWidth: 1
        });

        series.links.template.setAll({
            fill: color(0x1e293b),
            fillOpacity: 1,
            height: 5
        });

        const excludedStages = ["Ko'tarmadi", "Ko\`tarmadi", "Xato raqamlar", "Yangi leadlar"];
        const baseFilteredData = data.stage_distribution.filter(st => !excludedStages.includes(st.stage_name));
        const totalLeads = data?.conversion_stats?.total || data.stage_distribution.reduce((acc, curr) => acc + curr.count, 0);

        const rawData = [
            { stage_name: "Jami leads", count: totalLeads, stage_color: "#6366f1" },
            ...baseFilteredData
        ];

        // Normalize: squared decay for smooth tapering sides like reference photo
        const normalizedData = rawData.map((item, i) => ({
            ...item,
            real_count: item.count,
            _size: Math.pow(rawData.length - i, 2) + 2
        }));

        series.data.setAll(normalizedData);

        // Legend showing real counts
        let legend = chart.children.push(Legend.new(root, {
            centerX: percent(50),
            x: percent(50),
            marginTop: 15,
            marginBottom: 15,
            layout: root.gridLayout
        }));
        legend.labels.template.adapters.add("text", (text, target) => {
            const ctx = target.dataItem?.dataItem?.dataContext;
            return ctx ? ctx.stage_name : text;
        });
        legend.valueLabels.template.adapters.add("text", (text, target) => {
            const ctx = target.dataItem?.dataItem?.dataContext;
            return ctx ? `${ctx.real_count}` : text;
        });
        legend.data.setAll(series.dataItems);

        series.appear();
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [data?.stage_distribution, loading, activeTab]);

    // 3. Call Status (Pie Chart)
    useLayoutEffect(() => {
        if (!data?.call_status_distribution || data.call_status_distribution.length === 0 || loading) return;
        if (!document.getElementById("call-status-chart-div")) return;

        let root = createRoot("call-status-chart-div");
        if (!root) return;
        let chart = root.container.children.push(PieChart.new(root, {
            layout: root.verticalLayout,
            innerRadius: percent(50)
        }));

        let series = chart.series.push(PieSeries.new(root, {
            valueField: "value",
            categoryField: "name",
            alignLabels: false
        }));

        series.labels.template.setAll({
            forceHidden: true
        });

        series.slices.template.adapters.add("fill", (fill, target) => {
            const dataItem = target.dataItem.dataContext;
            return color(dataItem.color || 0x6366f1);
        });

        series.data.setAll(data.call_status_distribution);

        let legend = chart.children.push(Legend.new(root, {
            centerX: percent(50),
            x: percent(50),
            marginTop: 15,
            marginBottom: 15
        }));
        legend.data.setAll(series.dataItems);

        series.appear(1000, 100);

        return () => root.dispose();
    }, [data?.call_status_distribution, loading, activeTab]);

    // 4. Operator Performance (Funnel Chart)
    useLayoutEffect(() => {
        if (!data?.leads_by_operator?.length || loading) return;
        const el = document.getElementById("op-performance-chart-div");
        if (!el) return;

        let root = createRoot("op-performance-chart-div");
        if (!root) return;
        let chart = root.container.children.push(SlicedChart.new(root, {
            layout: root.verticalLayout,
            paddingRight: 200
        }));

        let series = chart.series.push(FunnelSeries.new(root, {
            alignLabels: true,
            orientation: "vertical",
            valueField: "_size",
            categoryField: "operator_name",
            bottomRatio: 1
        }));

        series.slices.template.setAll({
            strokeOpacity: 0.2,
            stroke: color(0x1a1a2e),
            strokeWidth: 2,
            fillOpacity: 0.92
        });

        series.labels.template.setAll({
            fontSize: 11,
            fill: color(0xffffff),
            oversizedBehavior: "truncate",
            maxWidth: 190,
            paddingLeft: 10
        });
        series.labels.template.adapters.add("text", (text, target) => {
            const ctx = target.dataItem?.dataContext;
            return ctx ? `${ctx.operator_name}: [bold]${ctx.real_count}[/]` : text;
        });

        series.ticks.template.setAll({
            stroke: color(0xffffff),
            strokeOpacity: 0.3,
            strokeDasharray: [4, 3],
            strokeWidth: 1
        });

        series.links.template.setAll({
            fill: color(0x1e293b),
            fillOpacity: 1,
            height: 5
        });

        // Normalize data for even visual distribution
        const normalizedOps = data.leads_by_operator.map((item, i) => ({
            ...item,
            real_count: item.count,
            _size: Math.pow(data.leads_by_operator.length - i, 2) + 2
        }));

        series.data.setAll(normalizedOps);

        series.slices.template.events.on("click", (ev) => {
            const op = ev.target.dataItem.dataContext;
            setSelectedOperator(prev => prev?.operator_id === op.operator_id ? null : op);
        });

        series.appear();
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [data?.leads_by_operator, loading, activeTab]);

    // 5. Selected Operator Detail Funnel
    useLayoutEffect(() => {
        if (!selectedOperator?.stages || selectedOperator.stages.length === 0) return;
        const el = document.getElementById("detail-funnel-chart-div");
        if (!el) return;
        
        const excludedStages = ["Ko'tarmadi", "Ko\`tarmadi", "Xato raqamlar", "Yangi leadlar"];
        const baseFilteredData = selectedOperator.stages.filter(st =>
            !hiddenStages.includes(st.stage_name) && !excludedStages.includes(st.stage_name)
        );

        const rawData = [
            { stage_name: "Jami leads", count: selectedOperator.count || 0, stage_color: "#6366f1" },
            ...baseFilteredData
        ];

        // Normalize for even visual distribution
        const normalizedData = rawData.map((item, i) => ({
            ...item,
            real_count: item.count,
            _size: Math.pow(rawData.length - i, 2) + 2
        }));

        let root = createRoot("detail-funnel-chart-div");
        if (!root) return;
        let chart = root.container.children.push(SlicedChart.new(root, {
            layout: root.verticalLayout,
            paddingRight: 180
        }));

        let series = chart.series.push(FunnelSeries.new(root, {
            alignLabels: true,
            orientation: "vertical",
            valueField: "_size",
            categoryField: "stage_name",
            bottomRatio: 1
        }));

        series.slices.template.setAll({
            strokeOpacity: 0.2,
            stroke: color(0x1a1a2e),
            strokeWidth: 2,
            fillOpacity: 0.92
        });

        series.slices.template.adapters.add("fill", (fill, target) => {
            const dataItem = target.dataItem.dataContext;
            return color(dataItem.stage_color || 0x6366f1);
        });

        series.labels.template.setAll({
            fontSize: 10,
            fill: color(0xffffff),
            oversizedBehavior: "truncate",
            maxWidth: 170,
            paddingLeft: 8
        });
        series.labels.template.adapters.add("text", (text, target) => {
            const ctx = target.dataItem?.dataContext;
            return ctx ? `${ctx.stage_name}: [bold]${ctx.real_count}[/]` : text;
        });

        series.ticks.template.setAll({
            stroke: color(0xffffff),
            strokeOpacity: 0.3,
            strokeDasharray: [4, 3],
            strokeWidth: 1
        });

        series.links.template.setAll({
            fill: color(0x1e293b),
            fillOpacity: 1,
            height: 5
        });

        series.data.setAll(normalizedData);

        series.appear();
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [selectedOperator, hiddenStages, activeTab]);

    // 6. Source Distribution (Pie Chart)
    useLayoutEffect(() => {
        if (!data?.source_distribution || data.source_distribution.length === 0 || loading) return;
        if (!document.getElementById("source-chart-div")) return;

        let root = createRoot("source-chart-div");
        if (!root) return;
        let chart = root.container.children.push(PieChart.new(root, {
            layout: root.verticalLayout
        }));

        let series = chart.series.push(PieSeries.new(root, {
            valueField: "count",
            categoryField: "source",
            alignLabels: false
        }));

        series.labels.template.setAll({
            forceHidden: true
        });

        series.data.setAll(data.source_distribution);

        let legend = chart.children.push(Legend.new(root, {
            centerX: percent(50),
            x: percent(50),
            marginTop: 15,
            marginBottom: 15
        }));
        legend.data.setAll(series.dataItems);

        series.appear(1000, 100);

        return () => root.dispose();
    }, [data?.source_distribution, loading, activeTab]);

    // 7. Formalar Bar Chart
    useLayoutEffect(() => {
        if (!formalarData?.operators || formalarData.operators.length === 0 || loading) return;
        if (!document.getElementById("formalar-chart-div")) return;

        let root = createRoot("formalar-chart-div");
        if (!root) return;
        let chart = root.container.children.push(XYChart.new(root, {
            panX: false,
            panY: false,
            layout: root.verticalLayout
        }));

        let xAxis = chart.xAxes.push(CategoryAxis.new(root, {
            categoryField: "operator_name",
            renderer: AxisRendererX.new(root, {
                minGridDistance: 30
            })
        }));

        xAxis.data.setAll(formalarData.operators);

        let yAxis = chart.yAxes.push(ValueAxis.new(root, {
            renderer: AxisRendererY.new(root, {})
        }));

        let series = chart.series.push(ColumnSeries.new(root, {
            name: "Ko'chirilgan leadlar",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "moved_count",
            categoryXField: "operator_name",
            tooltip: Tooltip.new(root, {
                labelText: "{valueY} ta lead"
            })
        }));

        series.columns.template.setAll({
            cornerRadiusTL: 5,
            cornerRadiusTR: 5,
            strokeOpacity: 0,
            fillOpacity: 0.8
        });

        series.columns.template.set("fill", color(0x6366f1));

        series.data.setAll(formalarData.operators);
        series.appear();
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [formalarData?.operators, loading, activeTab]);

    // 8. Marketing Lead Distribution (Donut Chart)
    useLayoutEffect(() => {
        if (!marketingData || marketingData.length === 0 || loading || activeTab !== 'marketing') return;
        if (!document.getElementById("marketing-lead-chart-div")) return;

        let root = createRoot("marketing-lead-chart-div");
        if (!root) return;
        let chart = root.container.children.push(PieChart.new(root, {
            innerRadius: percent(60)
        }));

        let series = chart.series.push(PieSeries.new(root, {
            valueField: "leads_count",
            categoryField: "name",
            alignLabels: false
        }));

        series.labels.template.setAll({
            forceHidden: true
        });

        series.data.setAll(marketingData);

        let legend = chart.children.push(Legend.new(root, {
            centerX: percent(50),
            x: percent(50),
            marginTop: 15,
            marginBottom: 15,
            layout: root.gridLayout
        }));
        legend.data.setAll(series.dataItems);

        series.appear(1000, 100);
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [marketingData, loading, activeTab]);

    // 9. Marketing Performance Comparison (Bar Chart)
    useLayoutEffect(() => {
        if (!marketingData || marketingData.length === 0 || loading || activeTab !== 'marketing') return;
        if (!document.getElementById("marketing-perf-chart-div")) return;

        let root = createRoot("marketing-perf-chart-div");
        if (!root) return;
        let chart = root.container.children.push(XYChart.new(root, {
            panX: false,
            panY: false,
            wheelX: "none",
            wheelY: "none",
            layout: root.verticalLayout
        }));

        let xRenderer = AxisRendererX.new(root, { minGridDistance: 30 });
        let xAxis = chart.xAxes.push(CategoryAxis.new(root, {
            categoryField: "name",
            renderer: xRenderer,
            tooltip: Tooltip.new(root, {})
        }));

        xAxis.data.setAll(marketingData);

        let yAxis = chart.yAxes.push(ValueAxis.new(root, {
            renderer: AxisRendererY.new(root, {})
        }));

        let series = chart.series.push(ColumnSeries.new(root, {
            name: "Leadlar",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "leads_count",
            categoryXField: "name",
            tooltip: Tooltip.new(root, {
                labelText: "{valueY} ta lead"
            })
        }));

        series.columns.template.setAll({
            cornerRadiusTL: 10,
            cornerRadiusTR: 10,
            fillOpacity: 0.8,
            strokeOpacity: 0
        });

        series.columns.template.adapters.add("fill", (fill, target) => {
            return chart.get("colors").getIndex(series.columns.indexOf(target));
        });

        series.data.setAll(marketingData);
        series.appear(1000);
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [marketingData, loading, activeTab]);

    if (loading && !data) {
        return (
            <div className="analytics-page loading-state">
                <div className="spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="analytics-page animate-fadeIn">
            <div className="analytics-header">
                <div className="header-left">
                    <h1>Analitika va Hisobotlar</h1>
                    <p>KPI ko'rsatkichlari va savdo dinamikasi</p>
                </div>
                <div className="header-right">
                    <div className="header-actions">
                        <div className="header-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
                                onClick={() => setActiveTab('leads')}
                            >
                                Leadlar
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'marketing' ? 'active' : ''}`}
                                onClick={() => setActiveTab('marketing')}
                            >
                                Marketing
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                                onClick={() => setActiveTab('students')}
                            >
                                O'quvchilar
                            </button>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--bg-secondary)', padding: '6px 12px',
                            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)'
                        }}>
                            <Calendar size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="KK.OO.YYYY"
                                value={filters.start_date ? (filters.start_date.includes('-') ? formatApiDateToUI(filters.start_date) : filters.start_date) : ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, start_date: formatDateInput(e.target.value) }))}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                    fontSize: '13px', fontWeight: 600, outline: 'none', width: '100px'
                                }}
                            />
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
                            <input
                                type="text"
                                placeholder="KK.OO.YYYY"
                                value={filters.end_date ? (filters.end_date.includes('-') ? formatApiDateToUI(filters.end_date) : filters.end_date) : ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, end_date: formatDateInput(e.target.value) }))}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                    fontSize: '13px', fontWeight: 600, outline: 'none', width: '100px'
                                }}
                            />
                        </div>
                        <button className={`btn-filter-trigger ${filterOpen ? 'active' : ''}`} onClick={() => setFilterOpen(true)}>
                            <Filter size={18} />
                            <span>Filterlash</span>
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'leads' && (
                <>
            {/* KPI Cards */}
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="kpi-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Jami Leadlar</span>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px', borderRadius: '8px', color: '#6366f1' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {data?.conversion_stats?.total || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={14} /> Tanlangan davrda
                    </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Faol Leadlar</span>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '8px', color: '#f59e0b' }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {data?.conversion_stats?.active || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                        Ishlov jarayonida
                    </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Konversiya</span>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {data?.conversion_stats?.converted || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>
                        {data?.conversion_stats?.rate}% muvaffaqiyat
                    </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Follow-up</span>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {data?.conversion_stats?.follow_up_total || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: data?.conversion_stats?.follow_up_overdue > 0 ? '#ef4444' : 'var(--text-tertiary)', marginTop: '5px' }}>
                        {data?.conversion_stats?.follow_up_overdue || 0} ta muddati o'tgan
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Daily Leads Trend */}
                <div className="chart-card wide">
                    <div className="chart-card-header">
                        <span className="chart-number">Trend</span>
                        <h4>Kunlik Leadlar Dinamikasi</h4>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        {!data?.daily_leads || data.daily_leads.length === 0 ? (
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        ) : (
                            <div id="trend-chart-div" style={{ width: '100%', height: '100%' }}></div>
                        )}
                    </div>
                </div>

                {/* Stage Distribution */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <span className="chart-number">Voronka</span>
                        <h4>Bosqichlar bo'yicha</h4>
                    </div>
                    <div className="chart-body" style={{ height: '550px' }}>
                        {!data?.stage_distribution || data.stage_distribution.length === 0 ? (
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        ) : (
                            <div id="stage-chart-div" style={{ width: '100%', height: '100%' }}></div>
                        )}
                    </div>
                </div>

                {/* Call Status */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <span className="chart-number">Qo'ng'iroqlar</span>
                        <h4>Aloqa Sifati</h4>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        {!data?.call_status_distribution || data.call_status_distribution.length === 0 ? (
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        ) : (
                            <div id="call-status-chart-div" style={{ width: '100%', height: '100%' }}></div>
                        )}
                    </div>
                </div>

                {/* Operator Performance - Funnel with Inline Detail */}
                <div className="chart-card wide">
                    <div className="chart-card-header">
                        <span className="chart-number">Voronka</span>
                        <h4>Operatorlar Samaradorligi</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '0', minHeight: '450px' }}>
                        {/* Left: Main Funnel */}
                        <div style={{
                            flex: selectedOperator ? '0 0 50%' : '1',
                            transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            padding: '16px',
                            borderRight: selectedOperator ? '1px solid var(--border-color)' : 'none'
                        }}>
                            <div style={{ height: '400px', position: 'relative' }}>
                                {!data?.leads_by_operator || data.leads_by_operator.length === 0 ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <div id="op-performance-chart-div" style={{ width: '100%', height: '100%' }}></div>
                                )}
                            </div>
                            {/* Operator list pills */}
                            {data?.leads_by_operator?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 4px', marginTop: '8px' }}>
                                    {data.leads_by_operator.map((op, i) => (
                                        <button
                                            key={op.operator_id}
                                            onClick={() => setSelectedOperator(
                                                selectedOperator?.operator_id === op.operator_id ? null : op
                                            )}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                                background: selectedOperator?.operator_id === op.operator_id
                                                    ? `rgba(99, 102, 241, 0.15)`
                                                    : 'rgba(255,255,255,0.04)',
                                                color: selectedOperator?.operator_id === op.operator_id
                                                    ? '#818cf8'
                                                    : 'var(--text-secondary)',
                                                border: selectedOperator?.operator_id === op.operator_id
                                                    ? `1px solid rgba(99, 102, 241, 0.3)`
                                                    : '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: '#6366f1'
                                            }} />
                                            {op.operator_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Selected Operator Funnel Detail */}
                        <div className={`operator-inline-panel ${selectedOperator ? 'open' : ''}`}>
                            {selectedOperator && (
                                <div className="operator-inline-content">
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                background: 'linear-gradient(135deg, #6366f122, #6366f144)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#6366f1', fontWeight: 700, fontSize: '15px'
                                            }}>
                                                {selectedOperator.operator_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                                                    {selectedOperator.operator_name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                    Voronka statistikasi
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="operator-funnel-close-btn"
                                            onClick={() => setSelectedOperator(null)}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* KPI row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                        <div className="operator-funnel-kpi">
                                            <div className="operator-funnel-kpi-value" style={{ color: '#6366f1' }}>{selectedOperator.count}</div>
                                            <div className="operator-funnel-kpi-label">Jami</div>
                                        </div>
                                        <div className="operator-funnel-kpi">
                                            <div className="operator-funnel-kpi-value" style={{ color: '#10b981' }}>{selectedOperator.converted}</div>
                                            <div className="operator-funnel-kpi-label">Sotuvlar</div>
                                        </div>
                                        <div className="operator-funnel-kpi">
                                            <div className="operator-funnel-kpi-value" style={{ color: '#f59e0b' }}>{selectedOperator.conversion_rate}%</div>
                                            <div className="operator-funnel-kpi-label">Konversiya</div>
                                        </div>
                                        <div className="operator-funnel-kpi">
                                            <div className="operator-funnel-kpi-value" style={{ color: '#8b5cf6' }}>{selectedOperator.avg_reaction_time}</div>
                                            <div className="operator-funnel-kpi-label">O'rt. reaksiya</div>
                                        </div>
                                    </div>

                                    {/* Funnel Chart */}
                                    <div style={{ height: '420px' }}>
                                        {!selectedOperator.stages || selectedOperator.stages.length === 0 ? (
                                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                                        ) : (
                                            <div id="detail-funnel-chart-div" style={{ width: '100%', height: '100%' }}></div>
                                        )}
                                    </div>

                                    {/* Stage pills */}
                                    {selectedOperator.stages?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                            {selectedOperator.stages
                                                .filter(st => !["Ko'tarmadi", "Ko`tarmadi", "Xato raqamlar", "Yangi leadlar"].includes(st.stage_name))
                                                .map((st, si) => {
                                                    const isHidden = hiddenStages.includes(st.stage_name);
                                                    return (
                                                        <button
                                                            key={si}
                                                            onClick={() => {
                                                                setHiddenStages(prev =>
                                                                    isHidden
                                                                        ? prev.filter(name => name !== st.stage_name)
                                                                        : [...prev, st.stage_name]
                                                                );
                                                            }}
                                                            className={`stage-pill-btn ${isHidden ? 'hidden' : ''}`}
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                                                background: isHidden ? 'rgba(255,255,255,0.02)' : `${st.stage_color || '#6366f1'}15`,
                                                                color: isHidden ? 'var(--text-tertiary)' : st.stage_color || '#6366f1',
                                                                border: `1px solid ${isHidden ? 'var(--border-color)' : (st.stage_color || '#6366f1') + '30'}`,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                opacity: isHidden ? 0.6 : 1,
                                                                textDecoration: isHidden ? 'line-through' : 'none'
                                                            }}
                                                        >
                                                            <span style={{
                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                background: isHidden ? 'var(--text-tertiary)' : st.stage_color || '#6366f1',
                                                                opacity: isHidden ? 0.5 : 1
                                                            }} />
                                                            {st.stage_name}: <b>{st.count}</b>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Source Distribution */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <span className="chart-number">Manbalar</span>
                        <h4>Mijozlar Manbasi (Sotuvlar)</h4>
                    </div>
                    <div className="chart-body" style={{ height: '350px' }}>
                        {!data?.source_distribution || data.source_distribution.length === 0 ? (
                            <div className="chart-no-data">Ma'lumot topilmadi</div>
                        ) : (
                            <div id="source-chart-div" style={{ width: '100%', height: '100%' }}></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Operator Formalar Statistics Section */}
            {formalarData && (
                <div className="formalar-section">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '32px 0 20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                            📋 Formalardan Ko'chirilganlar
                        </h2>
                        <span style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            Jami: {formalarData.total_moved} ta
                        </span>
                    </div>

                    {formalarData.operators?.length > 0 ? (
                        <>
                            {/* Bar Chart */}
                            <div className="chart-card wide" style={{ marginBottom: '20px' }}>
                                <div className="chart-card-header">
                                    <span className="chart-number">Operatorlar</span>
                                    <h4>Formalardan nechta lead ko'chirildi</h4>
                                </div>
                                <div className="chart-body" style={{ height: '350px' }}>
                                    {!formalarData?.operators || formalarData.operators.length === 0 ? (
                                        <div className="chart-no-data">Ma'lumot topilmadi</div>
                                    ) : (
                                        <div id="formalar-chart-div" style={{ width: '100%', height: '100%' }}></div>
                                    )}
                                </div>
                            </div>

                            {/* Detailed Table */}
                            <div className="chart-card wide">
                                <div className="chart-card-header">
                                    <span className="chart-number">Jadval</span>
                                    <h4>Operator ko'chirish tafsilotlari</h4>
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    <table className="formalar-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Operator</th>
                                                <th>Ko'chirilgan</th>
                                                <th>Qayerga ko'chirildi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formalarData.operators.map((op, i) => (
                                                <tr key={op.operator_id} className={i === 0 ? 'top-operator' : ''}>
                                                    <td>
                                                        {i === 0 ? (
                                                            <span className="rank-badge gold">🥇</span>
                                                        ) : i === 1 ? (
                                                            <span className="rank-badge silver">🥈</span>
                                                        ) : i === 2 ? (
                                                            <span className="rank-badge bronze">🥉</span>
                                                        ) : (
                                                            <span className="rank-number">{i + 1}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '10px',
                                                                background: `linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.4))`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#818cf8',
                                                                fontWeight: '700',
                                                                fontSize: '14px'
                                                            }}>
                                                                {op.operator_name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                                {op.operator_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            background: 'rgba(99, 102, 241, 0.12)',
                                                            color: '#818cf8',
                                                            padding: '4px 14px',
                                                            borderRadius: '20px',
                                                            fontWeight: '700',
                                                            fontSize: '14px'
                                                        }}>
                                                            {op.moved_count}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {op.destinations?.map((dest, j) => (
                                                                <span key={j} style={{
                                                                    background: `rgba(99, 102, 241, 0.1)`,
                                                                    color: '#818cf8',
                                                                    padding: '3px 10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500'
                                                                }}>
                                                                    {dest.stage_name}: {dest.count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="chart-card wide" style={{ padding: '40px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                Tanlangan davrda formalardan ko'chirilgan leadlar topilmadi
                            </p>
                        </div>
                    )}
                </div>
            )}
            </>
            )}

            {/* Marketing Statistics Section */}
            {activeTab === 'marketing' && marketingData && (
                <div className="marketing-section" style={{ marginTop: '32px' }}>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                            📈 Marketing Statistikasi
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Leadlar Ulushi</span>
                                <h4>Mutaxassislar bo'yicha taqsimot</h4>
                            </div>
                            {!marketingData || marketingData.length === 0 ? (
                                <div className="chart-body" style={{ height: "300px" }}>
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                </div>
                            ) : (
                                <div id="marketing-lead-chart-div" style={{ width: "100%", height: "300px" }}></div>
                            )}
                        </div>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Samaradorlik</span>
                                <h4>Leadlar soni bo'yicha taqqoslash</h4>
                            </div>
                            {!marketingData || marketingData.length === 0 ? (
                                <div className="chart-body" style={{ height: "300px" }}>
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                </div>
                            ) : (
                                <div id="marketing-perf-chart-div" style={{ width: "100%", height: "300px" }}></div>
                            )}
                        </div>
                    </div>

                    {/* Marketing Specialist Stats - Cards */}
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                            👤 Marketing mutaxassislari samaradorligi
                        </h2>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                        {marketingData.map((m) => (
                            <div key={m.id} className="chart-card" style={{ 
                                padding: '24px', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(30, 41, 59, 0.4)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                height: 'fit-content'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '18px',
                                        background: 'linear-gradient(135deg, #10b981, #34d399)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: '20px', fontWeight: '800',
                                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
                                    }}>
                                        {m.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{m.name}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Mutaxassis</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Jadvallar</div>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>{m.sheets_count} ta</div>
                                    </div>
                                </div>

                                <div style={{ 
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))', 
                                    padding: '20px', 
                                    borderRadius: '20px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    border: '1px solid rgba(99, 102, 241, 0.15)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Jami Leadlar</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: '1.2' }}>{m.leads_count}</div>
                                    </div>
                                    <div style={{ 
                                        width: '44px', height: '44px', borderRadius: '12px', 
                                        background: 'rgba(99, 102, 241, 0.2)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '24px'
                                    }}>
                                        🚀
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                </div>
            )}

            {activeTab === 'students' && (
                <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
                    {/* Charts Grid 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        {/* Admissions Trend */}
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Admissions Trend</span>
                                <h4>Yangi qabul qilingan o'quvchilar dinamikasi</h4>
                            </div>
                            <div className="chart-body" style={{ height: "300px" }}>
                                {(!studentData?.admissions_chart || studentData.admissions_chart.length === 0) ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <ReResponsiveContainer width="100%" height="100%">
                                        <ReLineChart data={studentData.admissions_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <ReCartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <ReXAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <ReYAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <ReTooltip content={<CustomTooltip />} />
                                            <ReLine type="monotone" name="O'quvchilar" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: 'var(--bg-secondary)' }} />
                                        </ReLineChart>
                                    </ReResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Gender Distribution */}
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Gender Split</span>
                                <h4>O'quvchilar jins taqsimoti</h4>
                            </div>
                            <div className="chart-body" style={{ height: "300px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {(!studentData?.gender_distribution || studentData.gender_distribution.length === 0) ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <>
                                        <ReResponsiveContainer width="100%" height={180}>
                                            <RePieChart>
                                                <RePie
                                                    data={studentData.gender_distribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="gender_display"
                                                >
                                                    {studentData.gender_distribution.map((entry, index) => (
                                                        <ReCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </RePie>
                                                <ReTooltip content={<CustomTooltip />} />
                                            </RePieChart>
                                        </ReResponsiveContainer>
                                        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                                            {studentData.gender_distribution.map((item, idx) => (
                                                <div key={item.gender} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                                    <span>{item.gender_display}: <strong>{item.count}</strong></span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Class Occupancy */}
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Class Occupancy</span>
                                <h4>Sinflarning to'lish ko'rsatkichi</h4>
                            </div>
                            <div className="chart-body" style={{ height: "300px" }}>
                                {(!studentData?.class_occupancy || studentData.class_occupancy.length === 0) ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <ReResponsiveContainer width="100%" height="100%">
                                        <ReBarChart data={studentData.class_occupancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <ReCartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <ReXAxis dataKey="class_name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <ReYAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <ReTooltip content={<CustomTooltip />} />
                                            <ReBar name="O'quvchilar soni" dataKey="active_students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <ReBar name="To'ldirilganlik (%)" dataKey="occupancy_rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </ReBarChart>
                                    </ReResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Age Distribution */}
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Age Distribution</span>
                                <h4>O'quvchilar yosh taqsimoti</h4>
                            </div>
                            <div className="chart-body" style={{ height: "300px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {(!studentData?.age_distribution || studentData.age_distribution.length === 0) ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <>
                                        <ReResponsiveContainer width="100%" height={180}>
                                            <RePieChart>
                                                <RePie
                                                    data={studentData.age_distribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="range"
                                                >
                                                    {studentData.age_distribution.map((entry, index) => (
                                                        <ReCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </RePie>
                                                <ReTooltip content={<CustomTooltip />} />
                                            </RePieChart>
                                        </ReResponsiveContainer>
                                        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px', maxHeight: '80px', overflowY: 'auto' }}>
                                            {studentData.age_distribution.map((item, idx) => (
                                                <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                                    <span>{item.range}: <strong>{item.count}</strong></span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid 3 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Status Distribution */}
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Student Status</span>
                                <h4>O'quvchilar holatlari bo'yicha taqsimot</h4>
                            </div>
                            <div className="chart-body" style={{ height: "300px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {(!studentData?.status_distribution || studentData.status_distribution.length === 0) ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <>
                                        <ReResponsiveContainer width="100%" height={180}>
                                            <RePieChart>
                                                <RePie
                                                    data={studentData.status_distribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="status_display"
                                                >
                                                    {studentData.status_distribution.map((entry, index) => (
                                                        <ReCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </RePie>
                                                <ReTooltip content={<CustomTooltip />} />
                                            </RePieChart>
                                        </ReResponsiveContainer>
                                        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                                            {studentData.status_distribution.map((item, idx) => (
                                                <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                                    <span>{item.status_display}: <strong>{item.count}</strong></span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Referral Source */}
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <span className="chart-number">Heard Sources</span>
                                <h4>O'quvchilar kelish manbalari tahlili</h4>
                            </div>
                            <div className="chart-body" style={{ height: "300px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {(!studentData?.heard_distribution || studentData.heard_distribution.length === 0) ? (
                                    <div className="chart-no-data">Ma'lumot topilmadi</div>
                                ) : (
                                    <>
                                        <ReResponsiveContainer width="100%" height={180}>
                                            <RePieChart>
                                                <RePie
                                                    data={studentData.heard_distribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="source_display"
                                                >
                                                    {studentData.heard_distribution.map((entry, index) => (
                                                        <ReCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </RePie>
                                                <ReTooltip content={<CustomTooltip />} />
                                            </RePieChart>
                                        </ReResponsiveContainer>
                                        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px', maxHeight: '80px', overflowY: 'auto' }}>
                                            {studentData.heard_distribution.map((item, idx) => (
                                                <div key={item.source} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                                    <span>{item.source_display}: <strong>{item.count}</strong></span>
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



            {/* Filter Drawer */}
            <AnalyticsFilterDrawer
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                onFilter={handleFilter}
                activeTab={activeTab}
                initialFilters={filters}
                cities={[]} // Not used for leads yet
                buildings={[]} // Not used for leads yet
                stages={stages}

                operators={operators.filter(u => u.role === 'operator' || u.role === 'sales_manager')}
            />
        </div>
    );
};

export default AnalyticsPage;
