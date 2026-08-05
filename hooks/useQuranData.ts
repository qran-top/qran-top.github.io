import { useState, useEffect, useCallback, useRef } from 'react';
import type { SurahData, QuranEdition } from '../types';
import { normalizeArabicText } from '../utils/text';

const CORE_EDITIONS: QuranEdition[] = [
    { identifier: "quran-simple-clean", language: "ar", name: "المصحف المبسط", englishName: "Simple Clean", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" },
    { identifier: "quran-uthmani-quran-academy", language: "ar", name: "الرسم العثماني", englishName: "Uthmani (Quran Academy)", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" }
];

export const useQuranData = () => {
    const [allQuranData, setAllQuranData] = useState<{ [key: string]: SurahData[] } | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [loadingEditions, setLoadingEditions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [availableEditions, setAvailableEditions] = useState<QuranEdition[]>(CORE_EDITIONS);

    const getEditionUrl = useCallback((edition: QuranEdition): string => {
        const { identifier } = edition;
        return `https://api.alquran.cloud/v1/quran/${identifier}`;
    }, []);

    const getEditionFallbackUrls = useCallback((edition: QuranEdition): string[] => {
        const { identifier } = edition;
        return [
            `https://api.alquran.cloud/v1/quran/${identifier}`,
            `https://cdn.islamic.network/quran/api/v1/quran/${identifier}`,
            `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ar-${identifier}.json`
        ];
    }, []);

    const processApiData = (apiData: any): SurahData[] => {
        if (apiData.code === 200 && apiData.data && apiData.data.surahs) {
            const surahs: SurahData[] = apiData.data.surahs;

            // Bismillah cleaning logic
            const fatiha = surahs.find(s => s.number === 1);
            const definitiveBismillahText = fatiha?.ayahs[0]?.text || 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
            const normalizedBismillahFingerprint = normalizeArabicText(definitiveBismillahText).replace(/\s/g, '');
            const bismillahWordCount = definitiveBismillahText.split(' ').length;

            const cleanedSurahs = surahs.map(surah => {
                // Skip Al-Fatiha and At-Tawbah
                if (surah.number === 1 || surah.number === 9 || surah.ayahs.length === 0) {
                    return surah;
                }

                const firstAyah = surah.ayahs[0];
                if (!firstAyah.text) return surah;

                const normalizedFirstAyahFingerprint = normalizeArabicText(firstAyah.text).replace(/\s/g, '');

                if (normalizedFirstAyahFingerprint.startsWith(normalizedBismillahFingerprint)) {
                    const words = firstAyah.text.split(' ');
                    const newText = words.length > bismillahWordCount ? words.slice(bismillahWordCount).join(' ') : '';
                    
                    const newFirstAyah = { ...firstAyah, text: newText.trim() };
                    const newAyahs = [newFirstAyah, ...surah.ayahs.slice(1)];
                    
                    return { ...surah, ayahs: newAyahs };
                }

                return surah;
            });

            return cleanedSurahs;
        }
        throw new Error('Invalid or unexpected API data structure');
    };

    const fetchCustomEditionData = useCallback(async (editionIdentifier: string) => {
        if (allQuranData?.[editionIdentifier] || loadingEditions.includes(editionIdentifier)) {
            return;
        }
        
        setLoadingEditions(prev => [...prev, editionIdentifier]);
        setError(null);
        
        const editionToFetch = availableEditions.find(e => e.identifier === editionIdentifier);
        if (!editionToFetch) {
            console.warn(`Edition ${editionIdentifier} not found in availableEditions.`);
            setLoadingEditions(prev => prev.filter(id => id !== editionIdentifier));
            return;
        }
        
        const urls = getEditionFallbackUrls(editionToFetch);
        let successSurahs: SurahData[] | null = null;
        let lastError: any = null;

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Network response error ${response.status}`);
                const apiData = await response.json();
                successSurahs = processApiData(apiData);
                if (successSurahs && successSurahs.length > 0) {
                    break;
                }
            } catch (err) {
                console.warn(`Failed fetching edition from mirror: ${url}`, err);
                lastError = err;
            }
        }

        if (successSurahs) {
            setAllQuranData(prev => ({ ...prev, [editionIdentifier]: successSurahs! }));
        } else {
            console.error(`Failed all mirrors for edition ${editionIdentifier}:`, lastError);
            setError(`فشل تحميل بيانات المصحف الأساسية. تمت محاولة الاتصال بجميع الخوادم البديلة ولم تنجح. يُرجى التثبت من الاتصال بالشبكة.`);
        }

        setLoadingEditions(prev => prev.filter(id => id !== editionIdentifier));
    }, [availableEditions, getEditionFallbackUrls, allQuranData, loadingEditions]);

    const fetchCustomEditionDataRef = useRef(fetchCustomEditionData);
    useEffect(() => {
        fetchCustomEditionDataRef.current = fetchCustomEditionData;
    }, [fetchCustomEditionData]);

    useEffect(() => {
        const initializeApp = async () => {
            // Unblock UI immediately
            setIsInitialLoading(false);

            // Fetch essential data in the background
            setIsBackgroundLoading(true);
            await Promise.all([
                fetchCustomEditionDataRef.current('quran-simple-clean'),
                fetchCustomEditionDataRef.current('quran-uthmani-quran-academy'),
            ]);
            setIsBackgroundLoading(false);
        };
        initializeApp();
    }, []); // Empty dependency array ensures this effect runs only once on mount.

    return {
        allQuranData, isInitialLoading, isBackgroundLoading, loadingEditions, error,
        dataSourceStatus: 'primary' as const, availableEditions,
        fetchCustomEditionData, getEditionUrl,
    };
};