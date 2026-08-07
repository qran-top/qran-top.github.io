import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '../types';
import { SearchIcon, ClearIcon } from './icons';
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
  const [editableQuery, setEditableQuery] = useState(query);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isHighlightedCopied, setIsHighlightedCopied] = useState(false);
  
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
  
  const handleCopyAll = () => {
    const textToCopy = formatResultsForExport(displayEditionData);
    if (textToCopy) navigator.clipboard.writeText(textToCopy).then(() => {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2500);
    });
  };

  const handleCopyHighlightedWords = () => {
    if (displayedResults.length === 0 || queryWords.length === 0) return;

    const isImlaei = fontStyle === 'imlai_1' || fontStyle === 'imlai_2';
    const collectedWords: string[] = [];

    displayedResults.forEach(resultAyah => {
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
                collectedWords.push(word);
            }
        });
    });

    const uniqueWords = Array.from(new Set(collectedWords));
    if (uniqueWords.length > 0) {
        const textToCopy = uniqueWords.join('، ');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsHighlightedCopied(true);
            setTimeout(() => setIsHighlightedCopied(false), 2500);
        });
    }
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
        
        {displayedResults.length > 0 && (
          <>
            <SearchResultsToolbar
                isPlaybackLoading={isPlaybackLoading} allAudioEditions={ALL_AUDIO_EDITIONS}
                onPlayAll={handlePlayAll} selectedAudioEdition={selectedAudioEdition}
                onAudioEditionChange={setSelectedAudioEdition} searchType={searchType}
                onSaveSearch={handleSaveSearch} onCopyAll={handleCopyAll}
                isAllCopied={isAllCopied}
                onCopyHighlightedWords={handleCopyHighlightedWords}
                isHighlightedCopied={isHighlightedCopied}
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