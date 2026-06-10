/**
 * Sana formatlash va validatsiya qilish uchun utility funksiyalar.
 * Barcha sana kiritish text inputlarida ishlatiladi.
 */

/**
 * Raqamlarni avtomatik ravishda dd.mm.yyyy ko'rinishida formatlaydi
 * @param {string} value - Kiritilgan qiymat
 * @returns {string} - Formatlangan sana
 */
export const formatDateInput = (value) => {
    // Faqat raqamlarni qoldiramiz va max 8 ta raqam olamiz
    const digits = value.replace(/\D/g, '').substring(0, 8);
    
    let formatted = '';
    if (digits.length > 0) {
        formatted += digits.substring(0, 2);
    }
    if (digits.length > 2) {
        formatted += '.' + digits.substring(2, 4);
    }
    if (digits.length > 4) {
        formatted += '.' + digits.substring(4, 8);
    }
    return formatted;
};

/**
 * Sana to'g'riligini va real taqvimga mosligini tekshiradi (dd.mm.yyyy)
 * @param {string} dateStr - Tekshiriluvchi sana
 * @returns {boolean} - true agar to'g'ri bo'lsa
 */
export const isValidDateStr = (dateStr) => {
    if (!dateStr) return true; // Bo'sh bo'lsa valid (agar required bo'lmasa o'zi form tekshiradi)
    
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (!regex.test(dateStr)) return false;
    
    const [, d, m, y] = dateStr.match(regex);
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;
    
    // Fevral 30 kabi xatoliklarni tekshirish
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

/**
 * dd.mm.yyyy formatidagi sanani API uchun yyyy-mm-dd formatga o'tkazadi
 * @param {string} dateStr - UI dagi sana
 * @returns {string} - API uchun sana
 */
export const parseUIDateToApi = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        if (day && month && year && year.length === 4) {
            return `${year}-${month}-${day}`;
        }
    }
    return dateStr;
};

/**
 * API dan kelgan yyyy-mm-dd formatdagi sanani UI uchun dd.mm.yyyy formatga o'tkazadi
 * @param {string} dateStr - API dan kelgan sana
 * @returns {string} - UI dagi sana
 */
export const formatApiDateToUI = (dateStr) => {
    if (!dateStr) return '';
    
    // Agar api dan kelgan sana allaqachon dd.mm.yyyy formatda bo'lsa, o'zgartirmaymiz
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        return dateStr;
    }
    
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}.${month}.${year}`;
    }
    return dateStr;
};
