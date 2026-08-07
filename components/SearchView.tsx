import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '../types';
import { SearchIcon, ClearIcon, DocumentDuplicateIcon } from './icons';
import { normalizeArabicText, formatSurahNameForDisplay } from '../utils/text';
import { useSearchLogic } from '../hooks/useSearchLogic';
import { useSettingsContext } from '../contexts/SettingsContext';
import { ALL_AUDIO_EDITIONS } from '../data/audioEditions';

import AyahActionPopover from './AyahActionPopover';
import SearchResultItem from './SearchResultItem';
import SearchResultsHeader from './search/SearchResultsHeader';
import SearchResultsToolbar from './search/SearchResultsToolbar';
import PhraseFilters from './search/PhraseFilters';
import NeighboringWords from './search/NeighboringWords';


interface SearchViewProps {
  query: string;
  results: Ayah[];
  onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean) => void;
  onSearchByAyahNumber: (ayahNumber: number) => void;
  onSearchComplete: () => void;
  autoOpenDiscussion?: boolean;
  displayEditionData: SurahData[];
  searchEdition: string;
  position?: { surah: number, ayah: number, wordIndex: number };
  simpleCleanData: SurahData[];
  onSaveAyah: (item: SavedAyahItem) => void;
  onSaveSearch: (item: SavedSearchItem) => void;
  searchType?: 'text' | 'number';
  // --- Props for audio playback ---
  currentlyPlayingAyahGlobalNumber: number | null;
  isPlaybackLoading: boolean;
  onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
  correctedQuery?: string;
  isRootSearch?: boolean;
}

export const SearchView: React.FC<SearchViewProps> = ({ 
    query, results, onNewSearch, onSearchByAyahNumber, onSearchComplete, autoOpenDiscussion, 
    displayEditionData, searchEdition, position, 
    simpleCleanData, onSaveAyah, onSaveSearch, searchType = 'text',
    currentlyPlayingAyahGlobalNumber, isPlaybackLoading, onStartPlayback,
    correctedQuery, isRootSearch = false
}) => {
  const [isEditableQuery, setIsEditableQuery] = useState(false);
  const [editableQuery, setEditableQuery] = useState(query);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isHighlightedCopied, setIsHighlightedCopied] = useState(false);
  const [copyHighlightedMode, setCopyHighlightedMode] = useState<number>(0);
  const [copyHighlightedToast, setCopyHighlightedToast] = useState<string>('');
  const [wordSortMode, setWordSortMode] = useState<'match' | 'frequency' | 'quran'>('match');
  
  // Consume Settings from Context
  const { displayEdition, fontStyle, selectedAudioEdition, setSelectedAudioEdition, activeEditions, fontSize } = useSettingsContext();

  const itemRefs = useRef<React.RefObject<HTMLLIElement>[]>([]);
  
  const [wordPopoverState, setWordPopoverState] = useState<{
    resultIndex: number;
    simpleText: string;
    triggerElement: HTMLElement;
  } | null>(null);
  const wordPopoverRef = useRef<HTMLDivElement>(null);

  const [activePopover, setActivePopover] = useState<{ ayah: Ayah; triggerElement: HTMLElement } | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [cachedAnalysisExists, setCachedAnalysisExists] = useState(false);
  const [pulsingWord, setPulsingWord] = useState<{ itemIndex: number; wordIndex: number } | null>(null);
  
  const {
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
  } = useSearchLogic(query, correctedQuery, results, searchType as 'text' | 'number', simpleCleanData, isRootSearch);


  const normalizedQueryForDiscussion = useMemo(() => {
    if (searchType === 'number') return `topic:ayah-number:${query}`;
    return normalizeArabicText(correctedQuery || query);
  }, [query, correctedQuery, searchType]);

  useEffect(() => { setEditableQuery(query); }, [query]);
  useEffect(() => { onSearchComplete(); }, [results, onSearchComplete]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (wordPopoverRef.current && !wordPopoverRef.current.contains(event.target as Node)) {
            if (!(event.target as HTMLElement).closest('.word-trigger')) {
                setWordPopoverState(null);
            }
        }
        if (!(event.target as HTMLElement).closest('.popover-trigger, .popover-content')) {
            setActivePopover(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCachedAnalysisExists(false);
  }, [query, correctedQuery, searchType]);

  itemRefs.current = displayedResults.map((_, i) => itemRefs.current[i] ?? React.createRef());

  useEffect(() => {
    if (currentlyPlayingAyahGlobalNumber) {
        const playingIndex = displayedResults.findIndex(ayah => ayah.number === currentlyPlayingAyahGlobalNumber);
        if (playingIndex !== -1 && itemRefs.current[playingIndex]?.current) {
            itemRefs.current[playingIndex].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentlyPlayingAyahGlobalNumber, displayedResults]);

  const handleJumpToOccurrence = (target: number) => {
    const occurrence = occurrencesMap[target - 1];
    if (occurrence && itemRefs.current[occurrence.itemIndex]?.current) {
        const element = itemRefs.current[occurrence.itemIndex].current;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setPulsingWord({ itemIndex: occurrence.itemIndex, wordIndex: occurrence.wordIndex });
        setTimeout(() => setPulsingWord(null), 3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = editableQuery.trim();
    if (trimmedQuery && trimmedQuery !== query) onNewSearch(trimmedQuery, undefined, undefined, isRootSearch);
  };

  const handleSaveSearch = () => {
    const queryToSave = correctedQuery || query;
    if (queryToSave) onSaveSearch({ type: 'search', id: queryToSave, query: queryToSave, createdAt: Date.now() });
  };
  
  const activeFiltersList = useMemo(() => {
    if (activePhraseFilter === 'all' || !activePhraseFilter.trim()) return [];
    return activePhraseFilter.split(',').map(s => s.trim()).filter(Boolean);
  }, [activePhraseFilter]);

  const handleToggleWordFilter = (word: string, normalized: string) => {
    const exists = activeFiltersList.includes(normalized) || activeFiltersList.includes(word);
    let nextFilters: string[];
    if (exists) {
      nextFilters = activeFiltersList.filter(f => f !== normalized && f !== word);
    } else {
      nextFilters = [...activeFiltersList, normalized];
    }

    if (nextFilters.length === 0) {
      setActivePhraseFilter('all');
    } else {
      setActivePhraseFilter(nextFilters.join(','));
    }
  };

  const highlightedWordOccurrences = useMemo(() => {
    if (results.length === 0 || queryWords.length === 0 || searchType !== 'text') return [];

    const isImlaei = fontStyle === 'imlai_1' || fontStyle === 'imlai_2';
    const wordMap = new Map<string, { displayWord: string; normalized: string; count: number; order: number }>();
    const appearanceOrder: string[] = [];
    let counter = 0;

    results.forEach(resultAyah => {
        const displaySurah = displayEditionData.find(s => s.number === resultAyah.surah?.number);
        const displayAyah = displaySurah?.ayahs.find(a => a.numberInSurah === resultAyah.numberInSurah);
        let textToRender = displayAyah?.text || resultAyah.text || '';

        if (!textToRender) return;

        if (isImlaei) {
            const marksToRemoveRegex = /[\u06D6-\u06ED]/g;
            textToRender = textToRender.replace(marksToRemoveRegex, '');
        }

        const words = textToRender.split(/\s+/).filter(Boolean);
        words.forEach(word => {
            const normalizedWord = normalizeArabicText(word);
            const isMatch = queryWords.some(queryWord => normalizedWord.includes(queryWord));
            if (isMatch) {
                const key = normalizedWord;
                if (!wordMap.has(key)) {
                    wordMap.set(key, { displayWord: word, normalized: key, count: 1, order: counter++ });
                    appearanceOrder.push(key);
                } else {
                    const item = wordMap.get(key)!;
                    item.count += 1;
                }
            }
        });
    });

    return appearanceOrder.map(key => {
        const item = wordMap.get(key)!;
        return {
            word: item.displayWord,
            normalized: item.normalized,
            count: item.count,
            order: item.order
        };
    });
  }, [results, displayEditionData, queryWords, searchType, fontStyle]);

  const sortedHighlightedWords = useMemo(() => {
    if (highlightedWordOccurrences.length === 0) return [];

    const fullQueryNorm = normalizeArabicText((correctedQuery || query).trim());
    const targets = Array.from(new Set([fullQueryNorm, ...queryWords.map(q => normalizeArabicText(q))])).filter(Boolean);

    const getTier = (item: { normalized: string; word: string }) => {
      const norm = item.normalized;

      // Tier 0: Exact match
      for (const target of targets) {
        if (norm === target) return 0;
      }

      // Tier 1: Direct prefix match (word starts with query, e.g. "المفلحون" for "الم")
      for (const target of targets) {
        if (norm.startsWith(target)) return 1;
      }

      // Tier 2: Match after single grammatical prefix (و, ف, ب, ك, ل) e.g. "والمفلحون", "فالمستقيم"
      const singlePrefixes = ['و', 'ف', 'ب', 'ك', 'ل'];
      for (const target of targets) {
        if (singlePrefixes.some(p => norm.startsWith(p) && norm.slice(p.length).startsWith(target))) {
          return 2;
        }
      }

      // Tier 3: Match after compound grammatical prefix (وال, فال, بال, كال, لل, وبال, وفال) e.g. "والظالمين" for "ظالم"
      const compoundPrefixes = ['وال', 'فال', 'بال', 'كال', 'لل', 'وبال', 'وفال', 'ولل'];
      for (const target of targets) {
        if (compoundPrefixes.some(cp => norm.startsWith(cp) && norm.slice(cp.length).startsWith(target))) {
          return 3;
        }
      }

      // Tier 4: Incidental internal substring match (e.g. "والظالمون" or "العالمون" containing "الم" inside "ظالم" or "عالم")
      return 4;
    };

    const listWithTier = highlightedWordOccurrences.map(item => ({
      ...item,
      tier: getTier(item)
    }));

    if (wordSortMode === 'match') {
      return listWithTier.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        if (b.count !== a.count) return b.count - a.count;
        return a.order - b.order;
      });
    } else if (wordSortMode === 'frequency') {
      return listWithTier.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.order - b.order;
      });
    } else {
      // 'quran'
      return listWithTier.sort((a, b) => a.order - b.order);
    }
  }, [highlightedWordOccurrences, wordSortMode, queryWords, query, correctedQuery]);

  const handleCopyAll = () => {
    const textToCopy = formatResultsForExport(displayEditionData);
    if (textToCopy) navigator.clipboard.writeText(textToCopy).then(() => {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2500);
    });
  };

  const handleCopyHighlightedWords = () => {
    if (sortedHighlightedWords.length === 0) return;

    let textToCopy = '';
    let toastMsg = '';
    let nextMode = 0;

    const sortLabel = wordSortMode === 'match' ? 'الترتيب الذكي' : wordSortMode === 'frequency' ? 'الأكثر تكراراً' : 'ترتيب المصحف';

    if (copyHighlightedMode === 0) {
        // Mode 0: Copy words only
        textToCopy = sortedHighlightedWords.map(w => w.word).join('، ');
        toastMsg = `تم النسخ: الكلمات فقط (${sortLabel})`;
        nextMode = 1;
    } else {
        // Mode 1: Copy words with repetition count
        textToCopy = sortedHighlightedWords.map(w => {
            const timesStr = w.count === 1 ? 'مرة' : w.count === 2 ? 'مرتان' : w.count <= 10 ? 'مرات' : 'مرة';
            return `${w.word} (${w.count} ${timesStr})`;
        }).join('، ');
        toastMsg = `تم النسخ: الكلمات + عدد التكرار (${sortLabel})`;
        nextMode = 0;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        setIsHighlightedCopied(true);
        setCopyHighlightedToast(toastMsg);
        setCopyHighlightedMode(nextMode);
        setTimeout(() => {
            setIsHighlightedCopied(false);
            setCopyHighlightedToast('');
        }, 2500);
    });
  };

  const handleDownloadAll = () => {
    const textToDownload = formatResultsForExport(displayEditionData);
    if (textToDownload) {
        const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const safeQuery = (correctedQuery || query).replace(/[^a-zA-Z0-9-ء-ي ]/g, "").trim() || 'results';
        link.download = `qran-top-search-${safeQuery}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
  };
  
  const handlePlayAll = () => {
    if (displayedResults.length > 0) onStartPlayback(displayedResults, selectedAudioEdition);
  };

  // --- Ayah Action Handlers ---
  const handleSaveClick = (ayah: Ayah) => {
    onSaveAyah({ type: 'ayah', id: `${ayah.surah!.number}:${ayah.numberInSurah}`, surah: ayah.surah!.number, ayah: ayah.numberInSurah, text: ayah.text || '', createdAt: Date.now() });
    setActivePopover(null);
  };
  const handleCopyAyah = (ayah: Ayah) => {
    const isImlaei = fontStyle === 'imlai_1' || fontStyle === 'imlai_2';
    let ayahText = ayah.text || '';

    if (isImlaei) {
        const marksToRemoveRegex = /[\u06D6-\u06ED]/g;
        ayahText = ayahText.replace(marksToRemoveRegex, '');
    }

    const textToCopy = `"${ayahText}" (سورة ${formatSurahNameForDisplay(ayah.surah?.name)} - الآية ${ayah.numberInSurah})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedAyah(ayah.number);
        setTimeout(() => setCopiedAyah(null), 2000);
        setActivePopover(null);
    });
  };
  const handleSearchByAyahText = (ayah: Ayah) => {
    const simpleSurah = simpleCleanData.find(s => s.number === ayah.surah!.number);
    const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
    if (simpleAyah?.text) onNewSearch(simpleAyah.text, 'quran-simple-clean', { surah: ayah.surah!.number, ayah: ayah.numberInSurah, wordIndex: 0 });
    else if (ayah.text) onNewSearch(ayah.text, displayEdition.identifier, { surah: ayah.surah!.number, ayah: ayah.numberInSurah, wordIndex: 0 });
    setActivePopover(null);
  };
  const handlePlayFromAyah = (ayah: Ayah) => {
    const startIndex = results.findIndex(a => a.number === ayah.number);
    if (startIndex !== -1) onStartPlayback(results, selectedAudioEdition, startIndex);
    setActivePopover(null);
  };

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto px-2 sm:px-4 overflow-x-hidden">
      {searchType !== 'number' && (
          <div className="mb-6 flex flex-col gap-3 max-w-full">
              <NeighboringWords neighboringWords={neighboringWords} visibleSuggestionsCount={visibleSuggestionsCount} onNeighborClick={(word) => onNewSearch(`${editableQuery.trim()} ${word}`)} onShowMore={handleShowMore}/>
          </div>
      )}
      
      <main className="bg-surface p-3.5 sm:p-6 md:p-8 rounded-lg shadow-md transition-colors duration-300 w-full max-w-full overflow-hidden">
        <PhraseFilters phraseFilters={phraseFilters} activePhraseFilter={activePhraseFilter} setActivePhraseFilter={setActivePhraseFilter} resultsCount={results.length}/>
        <SearchResultsHeader 
            searchType={searchType} query={query} correctedQuery={correctedQuery}
            displayedResultsCount={displayedResults.length} resultsCount={results.length}
            isSingleWordSearch={isSingleWordSearch} generalOccurrences={generalOccurrences}
            exactOccurrences={exactOccurrences} exactMatch={exactMatch} setExactMatch={setExactMatch}
            totalOccurrences={totalOccurrences} onJumpToOccurrence={handleJumpToOccurrence}
            cachedAnalysisExists={cachedAnalysisExists} onNewSearch={onNewSearch}
            isRootSearch={isRootSearch}
            onToggleRootSearch={(val) => onNewSearch(query, undefined, undefined, val)}
            displayedResults={displayedResults}
        />
        
        {results.length > 0 && (
          <>
            {sortedHighlightedWords.length > 0 && (
              <div className="my-4 p-3.5 sm:p-4 bg-surface-subtle border border-border-default rounded-xl transition-all shadow-2xs">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap border-b border-border-subtle pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-xs sm:text-sm font-bold text-text-primary">
                      الكلمات المحددة وعدد تكرارها ({sortedHighlightedWords.length} كلمة):
                    </span>
                    <span className="text-[11px] text-text-muted font-medium hidden sm:inline">
                      (انقر على الكلمات لتصفية النتائج بها)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={handleCopyHighlightedWords}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover text-text-primary border border-border-default hover:border-primary/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="نسخ جميع الكلمات المحددة حسب الترتيب الحالي"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5 text-primary" />
                      <span>{isHighlightedCopied ? (copyHighlightedToast || 'تم النسخ!') : 'نسخ محتوى المربع'}</span>
                    </button>

                    {activePhraseFilter !== 'all' && (
                      <button 
                        onClick={() => setActivePhraseFilter('all')}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="عرض جميع النتائج بدون تصفية"
                      >
                        <span>إلغاء التصفية (عرض الكل)</span>
                        <span className="font-bold">✕</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sort Control Bar */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-text-muted">ترتيب الكلمات:</span>
                    <div className="inline-flex rounded-lg bg-surface p-0.5 border border-border-default flex-wrap gap-0.5">
                      <button
                        onClick={() => setWordSortMode('match')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          wordSortMode === 'match'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                        title="ترتيب ذكي: الكلمة المطابقة تماماً -> الكلمات التي تبدأ بها -> الكلمات المحتواة"
                      >
                        <svg className="w-3.5 h-3.5 opacity-90" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <span>الذكي (درجة التطابق)</span>
                      </button>
                      <button
                        onClick={() => setWordSortMode('frequency')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          wordSortMode === 'frequency'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                        title="ترتيب حسب الكلمات الأكثر تكراراً في نتائج البحث"
                      >
                        <svg className="w-3.5 h-3.5 opacity-90" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h7a1 1 0 100-2H3zm0 4a1 1 0 100 2h4a1 1 0 100-2H3z" clipRule="evenodd" />
                        </svg>
                        <span>الأكثر تكراراً</span>
                      </button>
                      <button
                        onClick={() => setWordSortMode('quran')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          wordSortMode === 'quran'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                        title="ترتيب حسب تسلسل الورود في المصحف"
                      >
                        <svg className="w-3.5 h-3.5 opacity-90" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <span>ترتيب المصحف</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Words Cloud */}
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                  {sortedHighlightedWords.map(({ word, normalized, count }) => {
                    const isActive = activeFiltersList.includes(normalized) || activeFiltersList.includes(word);
                    return (
                      <button 
                        key={normalized}
                        onClick={() => handleToggleWordFilter(word, normalized)}
                        title={isActive ? "انقر لإلغاء التصفية بهذه الكلمة" : `انقر لتصفية النتائج بالكلمة "${word}"`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                          isActive 
                            ? 'bg-primary text-white font-bold ring-2 ring-primary/40 shadow-md scale-105' 
                            : 'bg-surface text-text-primary border border-border-default shadow-2xs hover:border-primary/50 hover:bg-surface-hover'
                        }`}
                      >
                        {isActive && <span className="font-bold text-xs">✓</span>}
                        <span>{word}</span>
                        <span className={`px-1.5 py-0.5 rounded-md font-bold font-mono text-[11px] ${
                          isActive ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted border border-border-subtle'
                        }`}>
                          {count} {count === 1 ? 'مرة' : count === 2 ? 'مرتان' : count <= 10 ? 'مرات' : 'مرة'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <SearchResultsToolbar
                isPlaybackLoading={isPlaybackLoading} allAudioEditions={ALL_AUDIO_EDITIONS}
                onPlayAll={handlePlayAll} selectedAudioEdition={selectedAudioEdition}
                onAudioEditionChange={setSelectedAudioEdition} searchType={searchType}
                onSaveSearch={handleSaveSearch} onCopyAll={handleCopyAll}
                isAllCopied={isAllCopied}
                onCopyHighlightedWords={handleCopyHighlightedWords}
                isHighlightedCopied={isHighlightedCopied}
                copyHighlightedMode={copyHighlightedMode}
                copyHighlightedToast={copyHighlightedToast}
                highlightedWordsCount={highlightedWordOccurrences.length}
                onDownloadAll={handleDownloadAll}
            />
          </>
        )}
        
        <div className="mt-6">
            {displayedResults.length > 0 ? (
                <ul className="space-y-4">
                    {displayedResults.map((ayah, index) => {
                        const simpleSurah = simpleCleanData.find(s => s.number === ayah.surah?.number);
                        const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
                        return (
                           <SearchResultItem 
                                key={ayah.number} itemRef={itemRefs.current[index]} ayah={ayah} 
                                queryWords={searchType === 'number' ? [] : queryWords} onNewSearch={onNewSearch}
                                displayEdition={displayEdition} displayEditionData={displayEditionData} searchEdition={searchEdition}
                                fontSize={fontSize} fontStyle={fontStyle} searchType={searchType} isCurrentlyPlaying={ayah.number === currentlyPlayingAyahGlobalNumber}
                                pulsingWordIndex={pulsingWord?.itemIndex === index ? pulsingWord.wordIndex : -1} resultIndex={index}
                                simpleAyahText={simpleAyah?.text || ''}
                                onUthmaniWordClick={(e, idx, text) => { if (wordPopoverState?.resultIndex === idx) setWordPopoverState(null); else setWordPopoverState({ resultIndex: idx, simpleText: text, triggerElement: e.currentTarget }); }}
                                onOpenPopover={(ayah, triggerElement) => setActivePopover({ ayah, triggerElement })}
                            />
                       );
                    })}
                </ul>
            ) : (<div className="text-center p-10 text-lg text-text-muted">لم يتم العثور على نتائج.</div>)}
        </div>
      </main>
      
       {wordPopoverState && (
         <div ref={wordPopoverRef} className="absolute p-3 bg-surface rounded-lg shadow-lg border border-border-default flex items-center gap-2 z-20 animate-fade-in flex-wrap leading-loose"
            style={(() => {
                if (!wordPopoverState.triggerElement) return { opacity: 0, top: 0, left: 0 };
                const rect = wordPopoverState.triggerElement.getBoundingClientRect();
                return { top: `${rect.bottom + window.scrollY + 5}px`, left: `${rect.left + window.scrollX + rect.width / 2}px`, transform: 'translateX(-50%)' };
            })()}
        >
            {wordPopoverState.simpleText.split(' ').map((word, wordIndex) => {
                const originalAyah = displayedResults[wordPopoverState.resultIndex];
                return (
                    <button key={wordIndex} onClick={() => { onNewSearch(word, 'quran-simple-clean', { surah: originalAyah.surah!.number, ayah: originalAyah.numberInSurah, wordIndex: wordIndex }); setWordPopoverState(null); }} className="px-2 py-1 bg-surface-subtle rounded-md hover:bg-primary/20 transition-colors">
                        {word}
                    </button>
                );
            })}
        </div>
      )}

       {activePopover && <AyahActionPopover activePopover={activePopover} onClose={() => setActivePopover(null)} onSave={handleSaveClick} onCopy={handleCopyAyah} onSearchText={handleSearchByAyahText} onSearchNumber={onSearchByAyahNumber} onPlayFrom={handlePlayFromAyah} copiedAyah={copiedAyah} />}
    </div>
  );
};