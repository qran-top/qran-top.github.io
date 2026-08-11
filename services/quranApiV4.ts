export interface QuranV4Word {
    id: number;
    position: number;
    audio_url?: string;
    text_uthmani: string;
    text_tajweed?: string;
    location: string;
    translation?: {
        text: string;
        language_name?: string;
    };
    transliteration?: {
        text: string;
    };
}

export interface QuranV4Verse {
    id: number;
    verse_number: number;
    verse_key: string;
    text_uthmani: string;
    text_tajweed?: string;
    words: QuranV4Word[];
}

export interface QuranV4TajweedVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani_tajweed: string;
}

const CACHE_KEY_PREFIX = 'quran_v4_chapter_';
const TAJWEED_CACHE_PREFIX = 'quran_v4_tajweed_';

const memoryCache = new Map<number, QuranV4Verse[]>();
const tajweedMemoryCache = new Map<number, QuranV4TajweedVerse[]>();

/**
 * Fetch verses with word-by-word data from Quran.com API v4
 */
export async function fetchChapterVersesV4(chapterNumber: number): Promise<QuranV4Verse[]> {
    if (memoryCache.has(chapterNumber)) {
        return memoryCache.get(chapterNumber)!;
    }

    try {
        const localCached = localStorage.getItem(`${CACHE_KEY_PREFIX}${chapterNumber}`);
        if (localCached) {
            const parsed = JSON.parse(localCached);
            memoryCache.set(chapterNumber, parsed);
            return parsed;
        }

        const url = `https://api.quran.com/api/v4/verses/by_chapter/${chapterNumber}?words=true&word_fields=text_uthmani,location,audio_url&per_page=300`;
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`API response error: ${res.status}`);
        }

        const data = await res.json();
        if (data.verses && data.verses.length > 0) {
            memoryCache.set(chapterNumber, data.verses);
            try {
                localStorage.setItem(`${CACHE_KEY_PREFIX}${chapterNumber}`, JSON.stringify(data.verses));
            } catch (e) {
                // Storage limit exceeded
            }
            return data.verses;
        }
        return [];
    } catch (error) {
        console.warn(`[QuranApiV4] Failed to fetch chapter ${chapterNumber} from Quran.com API v4:`, error);
        return [];
    }
}

/**
 * Fetch Tajweed-formatted text (with HTML rule classes) from Quran.com API v4
 */
export async function fetchChapterTajweedVerses(chapterNumber: number): Promise<QuranV4TajweedVerse[]> {
    if (tajweedMemoryCache.has(chapterNumber)) {
        return tajweedMemoryCache.get(chapterNumber)!;
    }

    try {
        const localCached = localStorage.getItem(`${TAJWEED_CACHE_PREFIX}${chapterNumber}`);
        if (localCached) {
            const parsed = JSON.parse(localCached);
            tajweedMemoryCache.set(chapterNumber, parsed);
            return parsed;
        }

        const url = `https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${chapterNumber}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`API response error: ${res.status}`);
        }

        const data = await res.json();
        if (data.verses && Array.isArray(data.verses)) {
            const result: QuranV4TajweedVerse[] = data.verses.map((v: any) => {
                const parts = (v.verse_key || '').split(':');
                const vNum = parts.length > 1 ? parseInt(parts[1], 10) : v.id;
                return {
                    id: v.id,
                    verse_key: v.verse_key,
                    verse_number: vNum,
                    text_uthmani_tajweed: v.text_uthmani_tajweed || ''
                };
            });

            tajweedMemoryCache.set(chapterNumber, result);
            try {
                localStorage.setItem(`${TAJWEED_CACHE_PREFIX}${chapterNumber}`, JSON.stringify(result));
            } catch (e) {
                // Storage limit
            }
            return result;
        }
        return [];
    } catch (error) {
        console.warn(`[QuranApiV4] Failed to fetch tajweed for chapter ${chapterNumber}:`, error);
        return [];
    }
}

/**
 * Resolve relative audio url for word-by-word pronunciation
 */
export function getWordAudioUrl(relativeAudioUrl: string): string {
    if (!relativeAudioUrl) return '';
    if (relativeAudioUrl.startsWith('http://') || relativeAudioUrl.startsWith('https://')) {
        return relativeAudioUrl;
    }
    const cleanPath = relativeAudioUrl.startsWith('/') ? relativeAudioUrl.substring(1) : relativeAudioUrl;
    return `https://audio.qurancdn.com/${cleanPath}`;
}
