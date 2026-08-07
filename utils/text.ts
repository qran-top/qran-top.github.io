// This helper is used to normalize both user input and source text for consistent searching.
export const normalizeArabicText = (word: string | undefined): string => {
    if (!word) return '';
    
    let cleaned = word;

    // Normalize variations of Alif (أ, إ, آ, ٱ) to a plain Alif (ا).
    cleaned = cleaned.replace(/[أإآٱ]/g, 'ا');

    // Remove dagger alif and other non-letter marks that can affect matching.
    // U+0670 is Dagger Alif.
    cleaned = cleaned.replace(/[\u0670ٰ]/g, '');

    // Remove diacritics (Tashkeel) and other Quranic annotation marks.
    // This range covers most common diacritics.
    cleaned = cleaned.replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '');

    // Remove Tatweel (Kashida), which is used to stretch characters.
    cleaned = cleaned.replace(/ـ/g, '');

    return cleaned.trim();
};

// This helper cleans a surah name for clean display (e.g., for copying or UI titles).
export const formatSurahNameForDisplay = (name: string | undefined): string => {
    if (!name) return '';
    
    // First, remove all common Arabic diacritics (tashkeel), Shadda, and Quranic annotation marks.
    const diacriticsRegex = /[\u0617-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
    let cleaned = name.replace(diacriticsRegex, '').replace(/ـ/g, '').trim();

    // Replace Alif Wasla (ٱ) with plain Alif (ا)
    cleaned = cleaned.replace(/ٱ/g, 'ا');

    // Remove any leading "سورة" or "سوره" prefix
    cleaned = cleaned.replace(/^(سورة|سوره)\s*/i, '');

    return cleaned.trim();
};