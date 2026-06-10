import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leads';
import { schoolClassService } from '../../services/students';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import { FormField, InfoNote } from '../../components/ui/ModalFormComponents';
import { formatPhoneInput, parsePhoneToApi, formatApiPhoneToUI } from '../../utils/phoneFormatter';
import { formatPrice, parsePrice } from '../../utils/priceFormatter';

const HEARD_SOURCES = [
    'Telegramda', 'Instagramda', 'Facebookda', 'Influencer', 'Referral',
    'YouTubeda', 'Odamlar orasida', 'Xech qayerda',
];

const EnrollStudentModal = ({ isOpen, onClose, lead, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        school_class: '',
        heard_source: '',
        parent_name: '',
        parent_phone: '',
        monthly_fee: '',
        term_months: 10,
    });

    useEffect(() => {
        if (isOpen && lead) {
            const parts = (lead.client_name || '').trim().split(/\s+/);
            setForm({
                first_name: parts[1] || parts[0] || '',
                last_name: parts[0] || '',
                middle_name: parts.slice(2).join(' ') || '',
                school_class: '',
                heard_source: lead.heard_source && lead.heard_source !== 'Xech qayerda' ? lead.heard_source : '',
                parent_name: lead.client_name || '',
                parent_phone: formatApiPhoneToUI(lead.phone_number || ''),
                monthly_fee: '',
                term_months: 10,
            });
            schoolClassService.getAll({ active: 'true' }).then((r) => {
                setClasses(r.data.results || r.data || []);
            });
        }
    }, [isOpen, lead]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!form.heard_source) {
            toast.error('Manbani tanlang');
            return;
        }
        if (!form.first_name.trim() || !form.last_name.trim()) {
            toast.error('Ism va familiya kerak');
            return;
        }

        setLoading(true);
        try {
            const res = await leadService.convertToStudent(lead.id, {
                ...form,
                parent_phone: parsePhoneToApi(form.parent_phone),
                school_class: form.school_class || null,
                monthly_fee: form.monthly_fee ? parsePrice(form.monthly_fee) : undefined,
            });
            toast.success("O'quvchi sifatida qabul qilindi");
            onSuccess?.(res.data);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="O'quvchi sifatida qabul qilish"
            size="md"
            footer={
                <>
                    <button type="button" className="btn-v2 btn-v2-secondary" onClick={onClose} disabled={loading}>
                        Bekor qilish
                    </button>
                    <button type="submit" className="btn-v2 btn-v2-primary" disabled={loading} onClick={handleSubmit}>
                        {loading ? 'Qabul qilinmoqda...' : 'Qabul qilish'}
                    </button>
                </>
            }
        >
            <InfoNote type="info">
                Lead maktab o'quvchisi sifatida ro'yxatga olinadi. Shartnoma ixtiyoriy.
            </InfoNote>
            <form onSubmit={handleSubmit}>
                <FormField label="Familiya" required>
                    <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                </FormField>
                <FormField label="Ism" required>
                    <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                </FormField>
                <FormField label="Otasining ismi">
                    <input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                </FormField>
                <FormField label="Sinf">
                    <select value={form.school_class} onChange={(e) => setForm({ ...form, school_class: e.target.value })}>
                        <option value="">Tanlash...</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </FormField>
                <FormField label="Qayerda eshitgan" required>
                    <select value={form.heard_source} onChange={(e) => setForm({ ...form, heard_source: e.target.value })} required>
                        <option value="">Tanlash...</option>
                        {HEARD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </FormField>
                <FormField label="Ota-ona ismi">
                    <input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
                </FormField>
                <FormField label="Ota-ona telefoni">
                    <input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: formatPhoneInput(e.target.value) })} />
                </FormField>
                <FormField label="Oylik to'lov (ixtiyoriy)">
                    <input type="text" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: formatPrice(e.target.value) })} placeholder="2 500 000" />
                </FormField>
            </form>
        </Modal>
    );
};

export default EnrollStudentModal;
