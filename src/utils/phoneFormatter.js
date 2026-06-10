/**
 * Telefon raqamlarini formatlash va tozalash uchun utility funksiyalar.
 * Barcha telefon kiritish inputlarida ishlatiladi.
 */

/**
 * Raqamni kiritish davomida avtomatik ravishda +998 XX XXX XX XX ko'rinishida formatlaydi
 * @param {string} value - Kiritilgan qiymat
 * @returns {string} - Formatlangan telefon raqami
 */
export const formatPhoneInput = (value) => {
    if (!value) return '';
    
    // Faqat raqamlarni olamiz
    let digits = value.replace(/\D/g, '');
    
    // Agar raqam 998 bilan boshlansa, kesamiz
    if (digits.startsWith('998')) {
        digits = digits.substring(3);
    }
    
    // Agar operator kodi va qolgan raqamlar yozilmagan bo'lsa, bo'sh qaytaramiz (default +998 yozilmaydi)
    if (digits.length === 0) {
        return '';
    }
    
    // Maksimal 9 ta raqam
    digits = digits.substring(0, 9);
    
    let formatted = '+998';
    if (digits.length > 0) {
        formatted += ' ' + digits.substring(0, 2);
    }
    if (digits.length > 2) {
        formatted += ' ' + digits.substring(2, 5);
    }
    if (digits.length > 5) {
        formatted += ' ' + digits.substring(5, 7);
    }
    if (digits.length > 7) {
        formatted += ' ' + digits.substring(7, 9);
    }
    return formatted;
};

/**
 * Formatlangan telefon raqamidan bo'shliqlarni olib tashlaydi (API uchun)
 * @param {string} value - UI dagi formatlangan raqam
 * @returns {string} - API uchun raqam (+998XXXXXXXXX)
 */
export const parsePhoneToApi = (value) => {
    if (!value) return '';
    return value.replace(/\s/g, '');
};

/**
 * API dan kelgan raqamni UI da chiroyli ko'rsatish uchun formatlaydi
 * @param {string} value - API dan kelgan raqam
 * @returns {string} - UI dagi raqam
 */
export const formatApiPhoneToUI = (value) => {
    return formatPhoneInput(value);
};
