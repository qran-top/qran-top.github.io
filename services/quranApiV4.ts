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

/**
 * Normalizes text for clean matching between Uthmani and Simple/Imlai Quranic script
 */
export function normalizeForWordMatch(text: string): string {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u06E5\u06E6\u08F0-\u08FF]/g, '')
        .replace(/[أإآٱءؤئ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
}

function getLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Plays word audio using smart Uthmani-to-Simple alignment and sequential word audio indexing
 */
export async function playSmartWordAudio(
    surahNum: number,
    ayahNum: number,
    approxWordIndexOneBased: number,
    clickedWordText?: string
): Promise<void> {
    try {
        let audioUrl: string | null = null;

        if (surahNum && ayahNum) {
            const chapterVerses = await fetchChapterVersesV4(surahNum);
            const verse = chapterVerses.find(v => v.verse_number === ayahNum);

            if (verse && verse.words && verse.words.length > 0) {
                // Filter strictly for actual spoken words ('word') to match CDN sequential audio files
                const filteredV4Words = verse.words.filter(w => (w as any).char_type_name === 'word');

                if (filteredV4Words.length > 0) {
                    const cleanClicked = clickedWordText ? normalizeForWordMatch(clickedWordText) : '';
                    const approxZeroIdx = Math.max(0, approxWordIndexOneBased - 1);

                    let targetSeqIndex = Math.min(approxWordIndexOneBased, filteredV4Words.length);

                    if (cleanClicked) {
                        let bestVIdx = 0;
                        let bestScore = -999;

                        filteredV4Words.forEach((vWord, vIdx) => {
                            const vNorm = normalizeForWordMatch(vWord.text_uthmani);
                            let score = 0;

                            if (vNorm === cleanClicked) {
                                score += 100;
                            } else if (vNorm.includes(cleanClicked) || cleanClicked.includes(vNorm)) {
                                score += 75;
                            } else {
                                const dist = getLevenshteinDistance(cleanClicked, vNorm);
                                const maxLen = Math.max(cleanClicked.length, vNorm.length);
                                if (maxLen > 0) {
                                    score += ((maxLen - dist) / maxLen) * 60;
                                }
                            }

                            const idxDiff = vIdx - approxZeroIdx;
                            if (idxDiff === 0) score += 20;
                            else if (idxDiff === 1 || idxDiff === -1) score += 15;
                            else if (idxDiff > 1) score -= (idxDiff - 1) * 3;
                            else if (idxDiff < -1) score -= Math.abs(idxDiff) * 8;

                            if (score > bestScore) {
                                bestScore = score;
                                bestVIdx = vIdx;
                            }
                        });

                        targetSeqIndex = bestVIdx + 1;
                    }

                    const surahPadded = String(surahNum).padStart(3, '0');
                    const ayahPadded = String(ayahNum).padStart(3, '0');
                    const wordPadded = String(targetSeqIndex).padStart(3, '0');
                    audioUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
                }
            }
        }

        if (!audioUrl) {
            const surahPadded = String(surahNum).padStart(3, '0');
            const ayahPadded = String(ayahNum).padStart(3, '0');
            const wordPadded = String(approxWordIndexOneBased).padStart(3, '0');
            audioUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
        }

        const audio = new Audio(audioUrl);
        await audio.play();
    } catch (e) {
        const surahPadded = String(surahNum).padStart(3, '0');
        const ayahPadded = String(ayahNum).padStart(3, '0');
        const wordPadded = String(approxWordIndexOneBased).padStart(3, '0');
        const fallbackUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
        new Audio(fallbackUrl).play().catch(() => {});
    }
}

