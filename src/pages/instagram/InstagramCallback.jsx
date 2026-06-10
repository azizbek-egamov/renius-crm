import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { instagramService } from '../../services/instagram';
import { toast } from 'sonner';
import './InstagramStats.css';

const InstagramCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setErrorMsg(searchParams.get('error_description') || 'Avtorizatsiya bekor qilindi');
            toast.error('Instagram avtorizatsiya bekor qilindi');
            setTimeout(() => navigate('/instagram'), 3000);
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMsg('Avtorizatsiya kodi topilmadi');
            toast.error('Avtorizatsiya kodi topilmadi');
            setTimeout(() => navigate('/instagram'), 3000);
            return;
        }

        // Exchange code for token
        const exchangeCode = async () => {
            try {
                const redirectUri = `${window.location.origin}/instagram/callback`;
                const res = await instagramService.connectAccount(code, redirectUri);

                if (res.data.success) {
                    setStatus('success');
                    toast.success(`Instagram @${res.data.username} muvaffaqiyatli ulandi!`);
                    setTimeout(() => navigate('/instagram'), 1500);
                } else {
                    throw new Error(res.data.error || 'Noma\'lum xatolik');
                }
            } catch (err) {
                setStatus('error');
                const msg = err.response?.data?.error || err.message || 'Token olishda xatolik yuz berdi';
                setErrorMsg(msg);
                toast.error(msg);
                setTimeout(() => navigate('/instagram'), 4000);
            }
        };

        exchangeCode();
    }, [searchParams, navigate]);

    return (
        <div className="instagram-page">
            <div className="ig-connect-cta">
                {status === 'loading' && (
                    <>
                        <div className="ig-connect-icon">
                            <div className="spinner" style={{ width: 48, height: 48 }}></div>
                        </div>
                        <h2 className="ig-connect-title">Instagram ulanmoqda...</h2>
                        <p className="ig-connect-desc">
                            Iltimos kuting, akkauntingiz ulanmoqda.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="ig-connect-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 className="ig-connect-title">Muvaffaqiyatli ulandi!</h2>
                        <p className="ig-connect-desc">
                            Instagram akkauntingiz ulandi. Sahifaga yo'naltirilmoqda...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="ig-connect-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <h2 className="ig-connect-title">Xatolik yuz berdi</h2>
                        <p className="ig-connect-desc">{errorMsg}</p>
                        <p className="ig-connect-desc" style={{ fontSize: '13px', opacity: 0.7, marginTop: 8 }}>
                            Instagram sahifasiga qaytarilmoqda...
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default InstagramCallback;
