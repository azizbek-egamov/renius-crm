import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import './Forms.css';

// Icons
const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const GripVerticalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
    </svg>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const ChevronUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
);

const ChevronDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const FIELD_TYPES = [
    { value: 'text', label: 'Matn (Text)' },
    { value: 'phone', label: 'Telefon raqam' },
    { value: 'email', label: 'Email' },
    { value: 'textarea', label: 'Katta matn' },
    { value: 'select', label: 'Tanlash (Dropdown)' },
    { value: 'checkbox', label: 'Belgilash (Checkbox)' },
    { value: 'date', label: 'Sana' },
];

const FormBuilder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);


    const [form, setForm] = useState({
        title: '',
        title_admin: '',
        description: '',
        is_active: true
    });

    const [fields, setFields] = useState([]);

    useEffect(() => {
        if (isEdit) {
            loadForm();
        } else {
            setFields([
                { id: Date.now(), key: 'name', label: 'Ismingiz', type: 'text', placeholder: 'Ismingizni kiriting', required: true, order: 0, is_active: true },
                { id: Date.now() + 1, key: 'phone', label: 'Telefon raqamingiz', type: 'phone', placeholder: '+998', required: true, order: 1, is_active: true }
            ]);
        }
    }, [id]);



    const loadForm = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/forms/${id}/`);
            const { title, title_admin, description, is_active, fields: formFields } = res.data;
            setForm({ title, title_admin: title_admin || '', description, is_active });
            setFields(formFields.map((f, idx) => ({ ...f, id: f.id || Date.now() + idx })));
        } catch (error) {
            toast.error("Formani yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addField = () => {
        setFields([...fields, {
            id: Date.now(),
            key: '',
            label: 'Yangi maydon',
            type: 'text',
            placeholder: '',
            required: false,
            order: fields.length,
            is_active: true,
            options: []
        }]);
    };

    const removeField = (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const updateField = (index, key, value) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        if (key === 'label' && !newFields[index].key) {
            newFields[index].key = slugify(value);
        }
        setFields(newFields);
    };

    const slugify = (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '_')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const moveField = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === fields.length - 1)) return;
        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[index + direction];
        newFields[index + direction] = temp;
        newFields.forEach((f, i) => f.order = i);
        setFields(newFields);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (fields.length === 0) return toast.error("Kamida bitta maydon qo'shing");

        const keys = fields.map(f => f.key);
        if (new Set(keys).size !== keys.length) return toast.error("Kalitlar takrorlanmasligi kerak");
        if (keys.some(k => !k)) return toast.error("Kalitlar bo'sh bo'lmasligi kerak");

        setLoading(true);
        try {
            const data = { ...form, fields: fields.map(({ id, ...rest }) => rest) };
            if (isEdit) {
                await api.put(`/forms/${id}/`, data);
                toast.success("Forma yangilandi");
            } else {
                await api.post('/forms/', data);
                toast.success("Forma yaratildi");
            }
            navigate('/forms');
        } catch (error) {
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit && !form.title) {
        return (
            <div className="form-builder-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="form-builder-page">
            {/* Header */}
            <div className="form-builder-header">
                <div className="form-builder-header-inner">
                    <div className="form-builder-header-left">
                        <button className="form-builder-back-btn" onClick={() => navigate('/forms')}>
                            <ChevronLeftIcon />
                        </button>
                        <div className="form-builder-divider"></div>
                        <h1 className="form-builder-title">
                            {isEdit ? "Formani Tahrirlash" : "Yangi Forma"}
                        </h1>
                    </div>
                    <div className="form-builder-header-actions">
                        <button className="btn-cancel" onClick={() => navigate('/forms')}>
                            Bekor qilish
                        </button>
                        <button className="btn-save" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="form-builder-content">
                <div className="form-builder-grid">

                    {/* Settings */}
                    <div className="form-settings-section">
                        <h3 className="form-settings-title">Sozlamalar</h3>
                        <div className="form-settings-card">
                            <div className="form-settings-group">
                                <label className="form-settings-label">Nomi</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleFormChange}
                                    className="form-settings-input"
                                    placeholder="Forma nomi"
                                />
                            </div>
                            <div className="form-settings-group">
                                <label className="form-settings-label">Forma nomi (Admin uchun)</label>
                                <input
                                    type="text"
                                    name="title_admin"
                                    value={form.title_admin}
                                    onChange={handleFormChange}
                                    className="form-settings-input"
                                    placeholder="Forma nomi (Admin uchun)"
                                />
                            </div>

                            <div className="form-settings-group">
                                <label className="form-settings-label">Tavsif</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    className="form-settings-textarea"
                                    placeholder="Qo'shimcha ma'lumot..."
                                />
                            </div>
                            <div className="form-settings-checkbox-group">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    checked={form.is_active}
                                    onChange={handleFormChange}
                                    className="form-settings-checkbox"
                                />
                                <label htmlFor="is_active" className="form-settings-checkbox-label">
                                    Faol (Active)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="form-fields-section">
                        <div className="form-fields-header">
                            <h3 className="form-fields-title">Maydonlar ({fields.length})</h3>
                            <button className="btn-add-field" onClick={addField}>
                                <PlusIcon />
                                Qo'shish
                            </button>
                        </div>

                        <div className="form-fields-list">
                            {fields.map((field, index) => (
                                <div key={field.id} className="field-card">
                                    <div className="field-card-inner">
                                        <div className="field-drag-handle">
                                            <GripVerticalIcon />
                                        </div>

                                        <div className="field-card-content">
                                            {/* Row 1: Label & Type */}
                                            <div className="field-row">
                                                <div className="field-group">
                                                    <label className="field-label">Label</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                                        className="field-input"
                                                        placeholder="Label"
                                                    />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">Type</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(index, 'type', e.target.value)}
                                                        className="field-select"
                                                    >
                                                        {FIELD_TYPES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Row 2: Key & Placeholder */}
                                            <div className="field-row">
                                                <div className="field-group">
                                                    <label className="field-label">Key (API)</label>
                                                    <input
                                                        type="text"
                                                        value={field.key}
                                                        onChange={(e) => updateField(index, 'key', e.target.value)}
                                                        className="field-input mono"
                                                        placeholder="key"
                                                    />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">Placeholder</label>
                                                    <input
                                                        type="text"
                                                        value={field.placeholder || ''}
                                                        onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                                                        className="field-input"
                                                        placeholder="..."
                                                    />
                                                </div>
                                            </div>

                                            {/* Options for select */}
                                            {field.type === 'select' && (
                                                <div className="field-row" style={{ gridTemplateColumns: '1fr' }}>
                                                    <div className="field-group">
                                                        <label className="field-label">Options (comma separated)</label>
                                                        <input
                                                            type="text"
                                                            value={Array.isArray(field.options) ? field.options.join(', ') : field.options}
                                                            onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                            className="field-input"
                                                            placeholder="Option 1, Option 2"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="field-footer">
                                                <div className="field-toggles">
                                                    <div className="field-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                        />
                                                        <span>Majburiy</span>
                                                    </div>
                                                    <div className="field-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.is_active !== false}
                                                            onChange={(e) => updateField(index, 'is_active', e.target.checked)}
                                                        />
                                                        <span>Faol</span>
                                                    </div>
                                                </div>

                                                <div className="field-actions">
                                                    <button
                                                        className="field-action-btn"
                                                        onClick={() => moveField(index, -1)}
                                                        disabled={index === 0}
                                                    >
                                                        <ChevronUpIcon />
                                                    </button>
                                                    <button
                                                        className="field-action-btn"
                                                        onClick={() => moveField(index, 1)}
                                                        disabled={index === fields.length - 1}
                                                    >
                                                        <ChevronDownIcon />
                                                    </button>
                                                    <div className="field-actions-divider"></div>
                                                    <button
                                                        className="field-action-btn delete"
                                                        onClick={() => removeField(index)}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className="btn-add-field-bottom" onClick={addField}>
                                <PlusIcon />
                                Add New Field
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormBuilder;
