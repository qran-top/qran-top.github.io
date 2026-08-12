// FIX: Import useEffect from 'react' to resolve 'Cannot find name' error.
import { useState, useMemo, useCallback, useEffect, useDeferredValue } from 'react';
import type { Ayah } from '../types';
import { normalizeArabicText, formatSurahNameForDisplay } from '../utils/text';
import { safeLocalStorage } from '../utils/storage';

const EXPORT_TEMPLATE_KEY = 'qran_app_export_template';
const DEFAULT_EXPORT_TEMPLATE = `ملخص البحث عن: "{{query}}"
- عدد الآيات المطابقة: {{ayah_count}}
- إجمالي التكرارات: {{general_occurrences}}
- المطابقات التامة: {{exact_occurrences}}
- خيار التطابق: {{exact_match_status}}

====================================

{{#results}}
"{{ayah_text}}" (سورة {{surah_name}} - الآية {{ayah_number_in_surah}})

---

{{/results}}
`;

// Helper to get normalized text with lazy caching to avoid heavy regex overhead
const getNormalizedText = (ayah: any): string => {
    if (ayah.normalizedText !== undefined) return ayah.normalizedText;
    if (ayah._normalizedText === undefined) {
        ayah._normalizedText = normalizeArabicText(ayah.text);
    }
    return ayah._normalizedText;
};

const getNormalizedWords = (ayah: any): string[] => {
    if (ayah._normalizedWords === undefined) {
        ayah._normalizedWords = getNormalizedText(ayah).split(/\s+/).filter(Boolean);
    }
    return ayah._normalizedWords;
};

const findNeighboringWords = (results: Ayah[], query: string): string[] => {
    const normalizedQueryWords = normalizeArabicText(query).trim().split(' ').filter(w => w.length > 0);
    const numQueryWords = normalizedQueryWords.length;

    if (numQueryWords === 0 || numQueryWords > 6) {
        return [];
    }

    const freq: { [key: string]: number } = {};
    const addNeighbor = (neighbor: string) => {
        if (neighbor && neighbor.length > 1 && !normalizedQueryWords.includes(neighbor)) {
            freq[neighbor] = (freq[neighbor] || 0) + 1;
        }
    };

    results.forEach(ayah => {
        const ayahWords = getNormalizedWords(ayah);
        const numAyahWords = ayahWords.length;

        if (numQueryWords === 1) {
            const queryWord = normalizedQueryWords[0];
            ayahWords.forEach((word, index) => {
                if (word === queryWord) {
                    if (index > 0) addNeighbor(ayahWords[index - 1]);
                    if (index < numAyahWords - 1) addNeighbor(ayahWords[index + 1]);
                }
            });
        } else {
            for (let i = 0; i <= numAyahWords - numQueryWords; i++) {
                let match = true;
                for (let j = 0; j < numQueryWords; j++) {
                    if (ayahWords[i + j] !== normalizedQueryWords[j]) {
                        match = false;
                        break;
                    }
                }
                if (match && i + numQueryWords < numAyahWords) {
                    addNeighbor(ayahWords[i + numQueryWords]);
                }
            }
        }
    });

    return Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30)
        .map(([word]) => word);
};

const getAyahMatchTier = (ayah: Ayah, queryWords: string[]): number => {
    if (!queryWords || queryWords.length === 0) return 0;
    const words = getNormalizedWords(ayah);
    if (words.length === 0) return 2;
    
    const fullQuery = queryWords.join(' ');
    
    // Tier 0: Exact word match in the ayah
    const hasExactWord = words.some(w => w === fullQuery || queryWords.includes(w));
    if (hasExactWord) return 0;

    // Tier 1: Match at the start of a word (word begins with search query word)
    const hasStartsWith = words.some(w => queryWords.some(q => q && w.startsWith(q)));
    if (hasStartsWith) return 1;

    // Tier 2: Match in the middle or end of a word
    return 2;
};


export const useSearchLogic = (
    query: string, 
    correctedQuery: string | undefined, 
    results: Ayah[], 
    searchType: 'text' | 'number',
    simpleCleanData: any[],
    isRootSearch?: boolean
) => {
    const [exactMatch, setExactMatch] = useState(false);
    const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState(7);
    const [activePhraseFilter, setActivePhraseFilter] = useState('all');

    const queryWords = useMemo(() => {
        const finalQuery = correctedQuery || query;
        return finalQuery.trim().replace(/"/g, '').split(/\s+/).filter(Boolean).map(normalizeArabicText);
    }, [query, correctedQuery]);

    const isSingleWordSearch = queryWords.length === 1;

    const activeResults = results;
    const deferredResults = useDeferredValue(results);

    const phraseFilters = useMemo(() => {
        if (searchType === 'number') {
            return [];
        }
        
        if (isRootSearch) {
            const uniqueWords = Array.from(new Set(queryWords));
            const wordCounts: { phrase: string; count: number }[] = [];
            
            uniqueWords.forEach(word => {
                const count = deferredResults.filter(ayah => {
                    const ayahWords = getNormalizedWords(ayah);
                    return ayahWords.includes(word);
                }).length;
                if (count > 0) {
                    wordCounts.push({ phrase: word, count });
                }
            });
            
            wordCounts.sort((a, b) => b.count - a.count);
            return wordCounts;
        }

        if (queryWords.length < 2) {
            return [];
        }
        
        const currentResults = deferredResults;
        const phrasesToConsider = new Set<string>();
        currentResults.forEach(ayah => {
            const ayahWords = getNormalizedWords(ayah);
            const indices: number[] = [];
            ayahWords.forEach((word, index) => {
                if (queryWords.includes(word)) {
                    indices.push(index);
                }
            });
            
            if (indices.length >= queryWords.length) {
                const minIndex = Math.min(...indices);
                const maxIndex = Math.max(...indices);
                if (maxIndex - minIndex < queryWords.length + 3) {
                    const phrase = ayahWords.slice(minIndex, maxIndex + 1).join(' ');
                    phrasesToConsider.add(phrase);
                }
            }
        });

        const userQueryPhrase = queryWords.join(' ');
        phrasesToConsider.add(userQueryPhrase);

        const allPhraseCounts: { phrase: string, count: number }[] = [];
        phrasesToConsider.forEach(phrase => {
            const count = currentResults.filter(ayah => getNormalizedText(ayah).includes(phrase)).length;
            allPhraseCounts.push({ phrase, count });
        });

        const userPhraseObj = allPhraseCounts.find(p => p.phrase === userQueryPhrase);
        const otherPhrases = allPhraseCounts.filter(p => p.phrase !== userQueryPhrase);

        otherPhrases.sort((a, b) => b.count - a.count || a.phrase.length - b.phrase.length);
        
        const topPhrases = otherPhrases.slice(0, 9);
        
        const finalFilters = userPhraseObj ? [userPhraseObj, ...topPhrases] : topPhrases;

        return finalFilters.sort((a, b) => b.count - a.count || a.phrase.length - b.phrase.length);
    }, [deferredResults, queryWords, searchType, isRootSearch]);

    const displayedResults = useMemo(() => {
        let baseResults = activeResults;
        
        // Exact match applies to Text Mode only
        if (searchType === 'text' && exactMatch && isSingleWordSearch && !isRootSearch) {
            const normalizedQuery = queryWords.join(' ');
            const regex = new RegExp(`(^|\\s)${normalizedQuery}(\\s|$)`);
            baseResults = baseResults.filter(ayah => regex.test(getNormalizedText(ayah)));
        }
        
        let filtered = baseResults;
        if (activePhraseFilter !== 'all' && activePhraseFilter.trim() !== '') {
            const filters = activePhraseFilter.split(',').map(f => f.trim()).filter(Boolean);
            if (filters.length > 0) {
                if (isRootSearch) {
                    filtered = baseResults.filter(ayah => {
                        const ayahWords = getNormalizedText(ayah).split(/\s+/);
                        return filters.some(f => ayahWords.includes(f));
                    });
                } else {
                    filtered = baseResults.filter(ayah => {
                        const ayahNorm = getNormalizedText(ayah);
                        return filters.some(f => ayahNorm.includes(f));
                    });
                }
            }
        }

        if (searchType === 'text' && queryWords.length > 0) {
            return [...filtered].sort((a, b) => {
                const tierA = getAyahMatchTier(a, queryWords);
                const tierB = getAyahMatchTier(b, queryWords);
                return tierA - tierB;
            });
        }

        return filtered;
    }, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, isSingleWordSearch, isRootSearch]);

    const occurrencesMap = useMemo(() => {
        if (searchType === 'number' || !query) return [];
        
        const transformedQuery = normalizeArabicText(correctedQuery || query).replace(/"/g, '');
        if (!transformedQuery) return [];

        const occurrences: { itemIndex: number; wordIndex: number; }[] = [];
        const searchTerms = transformedQuery.split(' ');

        displayedResults.forEach((resultAyah, itemIndex) => {
            const ayahWords = getNormalizedWords(resultAyah);
            
            for (let i = 0; i <= ayahWords.length - searchTerms.length; i++) {
                const slice = ayahWords.slice(i, i + searchTerms.length);
                if (slice.join(' ') === searchTerms.join(' ')) {
                    occurrences.push({ itemIndex, wordIndex: i });
                }
            }
        });
        return occurrences;
    }, [displayedResults, query, correctedQuery, searchType]);

    const totalOccurrences = occurrencesMap.length;

    const generalOccurrences = useMemo(() => {
        if (searchType === 'number' || queryWords.length === 0) return 0;
        let count = 0;
        const nWords = queryWords.length;
        for (let i = 0; i < deferredResults.length; i++) {
            const ayahText = getNormalizedText(deferredResults[i]);
            for (let w = 0; w < nWords; w++) {
                const word = queryWords[w];
                let idx = ayahText.indexOf(word);
                while (idx !== -1) {
                    count++;
                    idx = ayahText.indexOf(word, idx + word.length);
                }
            }
        }
        return count;
    }, [deferredResults, queryWords, searchType]);

    const exactOccurrences = useMemo(() => {
        if (searchType === 'number' || queryWords.length === 0) return 0;
        let count = 0;
        const wordSet = new Set(queryWords);
        for (let i = 0; i < deferredResults.length; i++) {
            const ayahWords = getNormalizedWords(deferredResults[i]);
            for (let j = 0; j < ayahWords.length; j++) {
                if (wordSet.has(ayahWords[j])) {
                    count++;
                }
            }
        }
        return count;
    }, [deferredResults, queryWords, searchType]);

    const neighboringWords = useMemo(() => {
        if (searchType === 'number' || !isSingleWordSearch) return [];
        return findNeighboringWords(deferredResults, correctedQuery || query);
    }, [deferredResults, query, correctedQuery, searchType, isSingleWordSearch]);
    
    const handleShowMore = () => setVisibleSuggestionsCount(prev => prev + 7);

    const formatResultsForExport = useCallback((displayEditionData: any[]): string => {
        if (displayedResults.length === 0) return 'لم يتم العثور على نتائج.';

        const savedTemplate = safeLocalStorage.getItem(EXPORT_TEMPLATE_KEY);
        const isTextSearch = searchType === 'text';
        const queryToExport = correctedQuery || query;

        const defaultTemplateForNumber = `ملخص البحث عن الآيات رقم: "{{query}}"
- عدد الآيات التي تم العثور عليها: {{ayah_count}}

====================================

{{#results}}
"{{ayah_text}}" (سورة {{surah_name}} - الآية {{ayah_number_in_surah}})
---
{{/results}}
`;

        const defaultTemplate = isTextSearch ? DEFAULT_EXPORT_TEMPLATE : defaultTemplateForNumber;
        let template = savedTemplate || defaultTemplate;

        template = template.replace(/{{query}}/g, queryToExport);
        template = template.replace(/{{ayah_count}}/g, String(displayedResults.length));

        if (isTextSearch) {
            template = template.replace(/{{general_occurrences}}/g, String(generalOccurrences));
            template = template.replace(/{{exact_occurrences}}/g, String(exactOccurrences));
            template = template.replace(/{{exact_match_status}}/g, exactMatch ? 'مفعل' : 'غير مفعل');
        } else {
            template = template.replace(/-\\s*إجمالي التكرارات:.*?\\n/g, '');
            template = template.replace(/-\\s*المطابقات التامة:.*?\\n/g, '');
            template = template.replace(/-\\s*خيار التطابق:.*?\\n/g, '');
        }

        const resultsRegex = /{{#results}}(.*){{\/results}}/s;
        const match = template.match(resultsRegex);

        if (match && match[1]) {
            const itemTemplate = match[1];
            const allResultsString = displayedResults.map(resultAyah => {
                let itemString = itemTemplate;
                const displaySurah = displayEditionData.find(s => s.number === resultAyah.surah!.number);
                const displayAyah = displaySurah?.ayahs.find(a => a.numberInSurah === resultAyah.numberInSurah);
                const textToExport = displayAyah?.text || resultAyah.text || '';

                const rawSurahName = resultAyah.surah?.name || displaySurah?.name || '';
                const cleanSurahName = formatSurahNameForDisplay(rawSurahName);

                itemString = itemString.replace(/{{ayah_text}}/g, textToExport);
                itemString = itemString.replace(/{{surah_name}}/g, cleanSurahName || rawSurahName);
                itemString = itemString.replace(/{{ayah_number_in_surah}}/g, String(resultAyah.numberInSurah));
                return itemString;
            }).join('');
            
            template = template.replace(resultsRegex, allResultsString);
        }

        return template.trim();
    }, [displayedResults, searchType, correctedQuery, query, generalOccurrences, exactOccurrences, exactMatch]);
    
    // Reset filters when query or mode changes
    useEffect(() => {
        setActivePhraseFilter('all');
        setExactMatch(false);
        setVisibleSuggestionsCount(7);
    }, [query, correctedQuery, isRootSearch]);

    return {
        exactMatch, setExactMatch,
        visibleSuggestionsCount, handleShowMore,
        activePhraseFilter, setActivePhraseFilter,
        queryWords, isSingleWordSearch,
        phraseFilters,
        displayedResults,
        occurrencesMap, totalOccurrences,
        generalOccurrences, exactOccurrences,
        neighboringWords,
        formatResultsForExport,
    };
};