'use client';

import React, { useState } from 'react';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import { FormField, InfoNote } from '../../components/ui/ModalFormComponents';

const HEARD_SOURCES = [
    'Telegramda',
    'Instagramda',
    'Facebookda',
    'Influencer',
    'Referral',
    'YouTubeda',
    'Odamlar orasida',
    'Xech qayerda'
];

const ConvertLeadModal = ({ isOpen, onClose, lead, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [heardSource, setHeardSource] = useState('');

    React.useEffect(() => {
        if (isOpen && lead) {
            setFullName(lead.client_name || '');
            
            // Set source from lead if it's set and valid and not "Xech qayerda"
            if (lead.heard_source && lead.heard_source !== 'Xech qayerda' && HEARD_SOURCES.includes(lead.heard_source)) {
                setHeardSource(lead.heard_source);
            } else {
                setHeardSource(''); // Default to empty (placeholder)
            }
        }
    }, [isOpen, lead]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!heardSource) {
            toast.error("Iltimos, manbani tanlang");
            return;
        }

        setLoading(true);
        try {
            await leadService.convert(lead.id, { 
                full_name: fullName,
                heard_source: heardSource
            });
            toast.success("Lead muvaffaqiyatli mijozga aylantirildi");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mijozga aylantirish"
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Bekor qilish
                    </button>
                    <button
                        type="submit"
                        className="btn-v2 btn-v2-primary"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading ? 'Aylantirilmoqda...' : 'Aylantirish'}
                    </button>
                </>
            }
        >
            <InfoNote type="info">
                Leadni mijozga aylantirish uchun mijozning to'liq ismini tasdiqlang.
            </InfoNote>

            <form onSubmit={handleSubmit}>
                <FormField label="Mijozning to'liq ismi" required>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="To'liq ismni kiriting"
                        required
                    />
                </FormField>

                <FormField label="Qayerda eshitgan" required>
                    <select
                        value={heardSource}
                        onChange={(e) => setHeardSource(e.target.value)}
                        required
                    >
                        <option value="">Tanlash...</option>
                        {HEARD_SOURCES.map(source => (
                            <option key={source} value={source}>
                                {source}
                            </option>
                        ))}
                    </select>
                </FormField>
            </form>
        </Modal>
    );
};

export default ConvertLeadModal;
