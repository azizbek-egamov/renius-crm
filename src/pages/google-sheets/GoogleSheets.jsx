import React, { useState, useEffect } from 'react';
import { getGlobalSyncConfig, updateGlobalSyncConfig, syncGoogleSheetsNow } from '../../services/googleSheets';
import { getMarketing } from '../../services/marketing';
import { toast } from 'sonner';
import { SaveIcon } from '../clients/ClientIcons';
import './GoogleSheets.css';

const PLATFORM_ICONS = {
    'Telegramda': <span title="Telegramda"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg></span>,
    'Instagramda': <span title="Instagramda"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></span>,
    'Facebookda': <span title="Facebookda"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></span>,
    'Influencer': <span title="Influencer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></span>,
    'Referral': <span title="Referral"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg></span>,
    'YouTubeda': <span title="YouTubeda"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></span>,
    'Odamlar orasida': <span title="Odamlar orasida"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>,
    'Xech qayerda': <span title="Xech qayerda"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg></span>,
};

const HEARD_SOURCE_OPTIONS = [
    'Telegramda', 'Instagramda', 'Facebookda', 'Influencer', 'Referral', 'YouTubeda', 'Odamlar orasida', 'Xech qayerda'
];

const GoogleSheets = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [marketingList, setMarketingList] = useState([]);
    const [configId, setConfigId] = useState(null);

    const [formData, setFormData] = useState({
        is_active: false,
        gsheet_configs: []
    });

    useEffect(() => {
        loadMarketing();
        loadConfig();
    }, []);

    const loadMarketing = async () => {
        try {
            const res = await getMarketing();
            setMarketingList(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error loading marketing:", error);
        }
    };

    const loadConfig = async () => {
        try {
            const res = await getGlobalSyncConfig();
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            if (data) {
                setConfigId(data.id);
                setFormData({
                    is_active: data.is_active || false,
                    gsheet_configs: Array.isArray(data.gsheet_configs) ? data.gsheet_configs : []
                });
            }
        } catch (error) {
            console.error("Error loading sync status:", error);
            toast.error("Ma'lumotlarni yuklab bo'lmadi");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        setSyncing(true);
        try {
            const res = await syncGoogleSheetsNow();
            toast.success(res.data.success || "Sinxronizatsiya yakunlandi");
        } catch (error) {
            console.error("Error syncing now:", error);
            toast.error(error.response?.data?.error || "Sinxronizatsiyada xatolik");
        } finally {
            setSyncing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (configId) {
                await updateGlobalSyncConfig(configId, formData);
            }
            toast.success("Sozlamalar saqlandi");
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error("Saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const addGSheet = () => {
        setFormData(prev => ({
            ...prev,
            gsheet_configs: [
                ...prev.gsheet_configs,
                { 
                    id: Date.now(), 
                    name: '', 
                    url: '', 
                    marketing_id: '',
                    tabs: [{ id: Date.now() + 1, name: 'Sheet1', gid: '0', phone_col: 'phone', name_col: 'name', notes_col: 'notes', source_col: '', source_mapping: {}, is_active: true }] 
                }
            ]
        }));
    };

    const removeGSheet = (index) => {
        const newConfigs = [...formData.gsheet_configs];
        newConfigs.splice(index, 1);
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const updateGSheet = (index, field, value) => {
        const newConfigs = [...formData.gsheet_configs];
        newConfigs[index][field] = value;
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const addTab = (sheetIndex) => {
        const newConfigs = [...formData.gsheet_configs];
        newConfigs[sheetIndex].tabs.push({ 
            id: Date.now(), 
            name: `Sheet${newConfigs[sheetIndex].tabs.length + 1}`, 
            gid: '0', 
            phone_col: 'phone', 
            name_col: 'name', 
            notes_col: 'notes', 
            source_col: '',
            source_mapping: {},
            is_active: true 
        });
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const removeTab = (sheetIndex, tabIndex) => {
        const newConfigs = [...formData.gsheet_configs];
        newConfigs[sheetIndex].tabs.splice(tabIndex, 1);
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const updateTab = (sheetIndex, tabIndex, field, value) => {
        const newConfigs = [...formData.gsheet_configs];
        newConfigs[sheetIndex].tabs[tabIndex][field] = value;
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const addMappingItem = (sheetIndex, tabIndex) => {
        const newConfigs = [...formData.gsheet_configs];
        const currentMapping = newConfigs[sheetIndex].tabs[tabIndex].source_mapping || {};
        newConfigs[sheetIndex].tabs[tabIndex].source_mapping = { ...currentMapping, '': 'Xech qayerda' };
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const updateMappingKey = (sheetIndex, tabIndex, oldKey, newKey) => {
        if (oldKey === newKey) return;
        const newConfigs = [...formData.gsheet_configs];
        const oldMapping = newConfigs[sheetIndex].tabs[tabIndex].source_mapping || {};
        const newMapping = {};
        Object.keys(oldMapping).forEach(k => {
            if (k === oldKey) newMapping[newKey] = oldMapping[oldKey];
            else newMapping[k] = oldMapping[k];
        });
        newConfigs[sheetIndex].tabs[tabIndex].source_mapping = newMapping;
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const updateMappingValue = (sheetIndex, tabIndex, key, newValue) => {
        const newConfigs = [...formData.gsheet_configs];
        newConfigs[sheetIndex].tabs[tabIndex].source_mapping = {
            ...newConfigs[sheetIndex].tabs[tabIndex].source_mapping,
            [key]: newValue
        };
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    const removeMappingItem = (sheetIndex, tabIndex, key) => {
        const newConfigs = [...formData.gsheet_configs];
        const mapping = { ...newConfigs[sheetIndex].tabs[tabIndex].source_mapping };
        delete mapping[key];
        newConfigs[sheetIndex].tabs[tabIndex].source_mapping = mapping;
        setFormData({ ...formData, gsheet_configs: newConfigs });
    };

    if (loading) {
        return (
            <div className="google-sheets-loading">
                <div className="spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="google-sheets-page animate-fadeIn">
            <div className="page-header">
                <div className="header-left">
                    <div className="header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="page-title">Google Sheets Dashbord</h1>
                        <p className="page-subtitle">Global sinxronizatsiya sozlamalari</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className={`btn-secondary btn-sync ${syncing ? 'syncing' : ''}`} 
                        onClick={handleSyncAll}
                        disabled={syncing}
                        style={{ marginRight: '10px' }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={syncing ? 'spin' : ''}>
                            <path d="M23 4v6h-6" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        {syncing ? 'Sinxronizatsiya...' : 'Hozir yangilash'}
                    </button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SaveIcon /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ padding: '20px' }}>
                <div className="form-section" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <div className="form-group">
                        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                            <input 
                                type="checkbox" 
                                checked={formData.is_active} 
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                            />
                            Sinxronizatsiya faol
                        </label>
                    </div>

                    <div className="multi-gsheet-container" style={{ marginTop: '20px' }}>
                        <div className="gsheet-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span className="gsheet-count" style={{ fontWeight: '600' }}>Google Sheets ({formData.gsheet_configs.length})</span>
                            <button type="button" className="btn-add-sheet" onClick={addGSheet} style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                                + Jadval qo'shish
                            </button>
                        </div>

                        {formData.gsheet_configs.map((sheet, sIdx) => (
                            <div key={sheet.id || sIdx} className="gsheet-card" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '16px', background: 'var(--bg-primary)', overflow: 'hidden' }}>
                                <div className="gsheet-card-header" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                    <div className="sheet-title-wrapper" style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            value={sheet.name} 
                                            onChange={(e) => updateGSheet(sIdx, 'name', e.target.value)} 
                                            placeholder="Jadval nomi"
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', marginRight: '16px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Marketing:</span>
                                            <select 
                                                value={sheet.marketing_id || ''} 
                                                onChange={(e) => updateGSheet(sIdx, 'marketing_id', e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                            >
                                                <option value="">Tanlang...</option>
                                                {marketingList.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeGSheet(sIdx)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer', padding: '4px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                </div>
                                <div className="gsheet-card-body" style={{ padding: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Google Sheet URL</label>
                                        <input 
                                            type="url" 
                                            value={sheet.url} 
                                            onChange={(e) => updateGSheet(sIdx, 'url', e.target.value)} 
                                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div className="tabs-container">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px' }}>Varaqlar (Tabs)</h4>
                                            <button type="button" onClick={() => addTab(sIdx)} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                                + Tab qo'shish
                                            </button>
                                        </div>
                                        
                                        {sheet.tabs.map((tab, tIdx) => (
                                            <div key={tab.id || tIdx} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                                                    <input 
                                                        type="text" 
                                                        value={tab.name} 
                                                        onChange={(e) => updateTab(sIdx, tIdx, 'name', e.target.value)} 
                                                        placeholder="Varaq nomi"
                                                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                    />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GID:</span>
                                                        <input 
                                                            type="text" 
                                                            value={tab.gid} 
                                                            onChange={(e) => updateTab(sIdx, tIdx, 'gid', e.target.value)} 
                                                            placeholder="0"
                                                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={tab.is_active} 
                                                            onChange={(e) => updateTab(sIdx, tIdx, 'is_active', e.target.checked)}
                                                        />
                                                        {tab.is_active ? 'Faol' : 'Nofaol'}
                                                    </label>
                                                    <button type="button" onClick={() => removeTab(sIdx, tIdx)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                    </button>
                                                </div>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Telefon (Col A)</label>
                                                        <input type="text" value={tab.phone_col} onChange={(e) => updateTab(sIdx, tIdx, 'phone_col', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Ism (Col B)</label>
                                                        <input type="text" value={tab.name_col} onChange={(e) => updateTab(sIdx, tIdx, 'name_col', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Izoh (Col C)</label>
                                                        <input type="text" value={tab.notes_col} onChange={(e) => updateTab(sIdx, tIdx, 'notes_col', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Manba (Col D)</label>
                                                        <input type="text" value={tab.source_col} onChange={(e) => updateTab(sIdx, tIdx, 'source_col', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                                    </div>
                                                </div>

                                                {tab.source_col && (
                                                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: '500' }}>Manba xaritalash (Mapping)</span>
                                                            <button type="button" onClick={() => addMappingItem(sIdx, tIdx)} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>+ Qo'shish</button>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {Object.entries(tab.source_mapping || {}).map(([key, val], idx) => (
                                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <input 
                                                                        type="text" 
                                                                        defaultValue={key}
                                                                        onBlur={(e) => updateMappingKey(sIdx, tIdx, key, e.target.value)}
                                                                        placeholder="Short code (masalan: ig)"
                                                                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                                                                    />
                                                                    <span>→</span>
                                                                    <select 
                                                                        value={val} 
                                                                        onChange={(e) => updateMappingValue(sIdx, tIdx, key, e.target.value)}
                                                                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                                                                    >
                                                                        {HEARD_SOURCE_OPTIONS.map(opt => (
                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button type="button" onClick={() => removeMappingItem(sIdx, tIdx, key)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleSheets;
