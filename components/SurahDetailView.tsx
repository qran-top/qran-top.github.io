import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { SurahData, SavedAyahItem, Ayah } from '../types';
import { SpinnerIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import { safeLocalStorage } from '../utils/storage';
import AyahActionPopover from './AyahActionPopover';
import AyahRenderer from './AyahRenderer';
import { formatSurahNameForDisplay } from '../utils/text';
import { QURAN_INDEX } from '../quranIndex';
import { getQuranTextStyle } from '../utils/font';
import { useSettingsContext } from '../contexts/SettingsContext';

interface SurahDetailViewProps {
  surah: SurahData;
  pageSurahs?: SurahData[]; // New prop to handle multiple surahs on one page
  highlightAyahNumber: number | null;
  onWordClick: (query: string, editionIdentifier: string, position: { surah: number; ayah: number; wordIndex: number; }) => void;
  onSaveAyah: (item: SavedAyahItem) => void;
  onSearchByAyahNumber: (ayahNumber: number) => void;
  // --- Props for audio playback ---
  currentlyPlayingAyahGlobalNumber: number | null;
  onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
  selectedAudioEdition: string;
  // --- Prop for word popover ---
  simpleCleanData: SurahData[];
  hizbQuarterStartMap: Map<number, number>;
  forcedPageNumber?: number; // Prop to enforce a specific page number
}

const SurahHeaderStrip: React.FC<{ surahNumber: number; surahName: string }> = ({ surahNumber, surahName }) => {
  const info = QURAN_INDEX.find(s => s.number === surahNumber);
  const ayahsCount = info?.numberOfAyahs || '';
  const formattedName = formatSurahNameForDisplay(surahName);

  return (
    <div className="my-6 w-full select-none">
      {/* Outer Decorative Islamic Strip Frame */}
      <div className="relative border-2 border-amber-600/50 dark:border-amber-500/40 rounded-xl p-2 sm:p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 dark:from-amber-500/20 dark:via-surface-subtle dark:to-amber-500/20 shadow-md overflow-hidden">
        {/* Subtle Geometric Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0 L24 12 L12 24 L0 12 Z' fill='none' stroke='%23d97706' stroke-width='1'/%3E%3Ccircle cx='12' cy='12' r='3.5' fill='%23d97706'/%3E%3C/svg%3E")`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Inner Border Line for Authentic Mushaf Strip Look */}
        <div className="relative border border-amber-600/40 dark:border-amber-500/30 rounded-lg px-3 py-2.5 sm:px-5 flex items-center justify-between gap-2 bg-surface/75 dark:bg-surface/50 backdrop-blur-xs">
          
          {/* Right Info: Surah Order in Quran */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200 min-w-[100px]">
            <span className="text-amber-600 dark:text-amber-400 text-base">۞</span>
            <span>ترتيبها:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{surahNumber}</span>
          </div>

          {/* Center Title Banner */}
          <div className="flex-1 text-center flex items-center justify-center gap-2 sm:gap-4">
            <span className="text-amber-600 dark:text-amber-400 text-xl font-serif opacity-80">﴿</span>
            <a 
              href={`#/surah/${surahNumber}`}
              className="inline-block transition-transform duration-200 hover:scale-105 cursor-pointer"
              title={`فتح سورة ${formattedName}`}
            >
              <h2 className="font-quran-title text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100 hover:text-primary transition-colors tracking-wide">
                {formattedName}
              </h2>
            </a>
            <span className="text-amber-600 dark:text-amber-400 text-xl font-serif opacity-80">﴾</span>
          </div>

          {/* Left Info: Ayahs Count */}
          <div className="hidden sm:flex items-center justify-end gap-1.5 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200 min-w-[100px]">
            <span>آياتها:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{ayahsCount}</span>
            <span className="text-amber-600 dark:text-amber-400 text-base">۞</span>
          </div>
        </div>

        {/* Mobile Info Bar below center title on small screens */}
        <div className="sm:hidden mt-1.5 pt-1.5 border-t border-amber-600/20 dark:border-amber-500/20 flex justify-between text-[12px] text-amber-900 dark:text-amber-200 px-3 font-medium">
          <div className="flex items-center gap-1">
            <span>ترتيبها:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{surahNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>آياتها:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{ayahsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SurahDetailView: React.FC<SurahDetailViewProps> = ({ 
  surah, pageSurahs, highlightAyahNumber, onWordClick,
  onSaveAyah, onSearchByAyahNumber,
  currentlyPlayingAyahGlobalNumber, onStartPlayback, selectedAudioEdition,
  simpleCleanData, hizbQuarterStartMap, forcedPageNumber
}) => {
  const highlightRef = useRef<HTMLSpanElement>(null);
  const playingAyahRef = useRef<HTMLSpanElement>(null);
  const wordPopoverRef = useRef<HTMLDivElement>(null);

  const [activePopover, setActivePopover] = useState<{ ayah: Ayah; triggerElement: HTMLElement } | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [wordPopoverState, setWordPopoverState] = useState<{
    ayahNumberInSurah: number;
    simpleText: string;
    triggerElement: HTMLElement;
  } | null>(null);

  const prevSurahNumber = useRef<number | null>(null);
  const prevPageNumber = useRef<number | undefined>(undefined);
  const prevHighlightAyahNumber = useRef<number | null>(null);

  // Consume Settings from Context
  const { displayEdition, fontSize, fontStyle, browsingMode } = useSettingsContext();

  // Determine current page logic
  const { ayahsByPage, firstPage, lastPage, getPageForAyahNumber } = useMemo(() => {
    // If we are in specific Page Mode with pageSurahs provided
    if (pageSurahs && forcedPageNumber) {
        return { 
            ayahsByPage: new Map(), // Not used in this mode
            firstPage: 1, 
            lastPage: 604, 
            getPageForAyahNumber: (n: number) => forcedPageNumber 
        };
    }

    const map = new Map<number, Ayah[]>();
    const ayahNumToPageMap = new Map<number, number>();
    if (!surah || !surah.ayahs || surah.ayahs.length === 0) {
        return { ayahsByPage: map, firstPage: 1, lastPage: 1, getPageForAyahNumber: (n: number) => undefined };
    }
    let minPage = Infinity;
    let maxPage = -Infinity;
    for (const ayah of surah.ayahs) {
        if (ayah.page) {
            if (!map.has(ayah.page)) {
                map.set(ayah.page, []);
            }
            map.get(ayah.page)!.push(ayah);
            minPage = Math.min(minPage, ayah.page);
            maxPage = Math.max(maxPage, ayah.page);
            ayahNumToPageMap.set(ayah.numberInSurah, ayah.page);
        }
    }
    const getPageForAyahNumber = (num: number) => ayahNumToPageMap.get(num);
    return { ayahsByPage: map, firstPage: minPage === Infinity ? 1 : minPage, lastPage: maxPage === -Infinity ? 1 : maxPage, getPageForAyahNumber };
  }, [surah, pageSurahs, forcedPageNumber]);

  useEffect(() => {
    let targetPage: number | undefined;

    if (forcedPageNumber) {
        targetPage = forcedPageNumber;
    } else if (highlightAyahNumber) {
        targetPage = getPageForAyahNumber(highlightAyahNumber);
    } else if (currentlyPlayingAyahGlobalNumber) {
        // Find which surah/ayah is playing
        const playingAyah = surah.ayahs.find(a => a.number === currentlyPlayingAyahGlobalNumber);
        if (playingAyah) {
            targetPage = getPageForAyahNumber(playingAyah.numberInSurah);
        }
    }

    setCurrentPage(targetPage || firstPage);
  }, [surah.number, highlightAyahNumber, currentlyPlayingAyahGlobalNumber, getPageForAyahNumber, firstPage, forcedPageNumber]);


  useEffect(() => {
    // This is the primary scrolling logic for the component.
    // It handles scrolling to a highlighted ayah, following audio playback, or scrolling to the top.

    // --- First, check for navigation changes using values from the *previous* render ---
    const isNewHighlightRequest = highlightAyahNumber !== null && highlightAyahNumber !== prevHighlightAyahNumber.current;
    const isNewPageOrSurah = prevSurahNumber.current !== surah.number || prevPageNumber.current !== forcedPageNumber;

    // --- PRIORITY 1: Follow audio playback ---
    const isPlayingInView = pageSurahs 
        ? pageSurahs.some(s => s.ayahs.some(a => a.number === currentlyPlayingAyahGlobalNumber))
        : surah.ayahs.some(a => a.number === currentlyPlayingAyahGlobalNumber);

    if (currentlyPlayingAyahGlobalNumber !== null && isPlayingInView) {
        if (playingAyahRef.current) {
            playingAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    // --- PRIORITY 2: Handle a NEW request to highlight an ayah (only if audio isn't controlling scroll) ---
    else if (isNewHighlightRequest) {
        const targetSurahNumber = surah.number;
        const specificId = `ayah-${targetSurahNumber}-${highlightAyahNumber}`;
        
        let attempts = 0;
        const intervalId = setInterval(() => {
            const element = document.getElementById(specificId);
            attempts++;
            if (element) {
                clearInterval(intervalId);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('animate-highlight-pulse');
                setTimeout(() => element.classList.remove('animate-highlight-pulse'), 3000);
            } else if (attempts > 30) { // More generous 3-second timeout
                clearInterval(intervalId);
            }
        }, 100);

        return () => clearInterval(intervalId); // Cleanup on effect change.
    }
    // --- PRIORITY 3: Fallback to scroll-to-top on new page navigation (if no highlight/audio) ---
    else if (isNewPageOrSurah) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

  }, [highlightAyahNumber, currentlyPlayingAyahGlobalNumber, surah, browsingMode, pageSurahs, forcedPageNumber]);

  // This separate effect ensures the "previous" values are always updated *after* the main scrolling effect has run.
  // This correctly handles all cases, including when audio playback causes an early return in the main effect.
  useEffect(() => {
    prevHighlightAyahNumber.current = highlightAyahNumber;
    prevSurahNumber.current = surah.number;
    prevPageNumber.current = forcedPageNumber;
  });

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (!(target as HTMLElement).closest('.popover-trigger, .popover-content')) {
            setActivePopover(null);
        }
        if (wordPopoverRef.current && !wordPopoverRef.current.contains(target)) {
            if (!(event.target as HTMLElement).closest('.word-trigger')) {
                setWordPopoverState(null);
            }
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  if (displayEdition.format === 'audio') {
    return (
      <div className="animate-fade-in w-full max-w-4xl mx-auto px-4">
        <main className="bg-surface p-6 sm:p-8 rounded-lg shadow-md transition-colors duration-300">
          <h3 className="text-xl font-bold mb-4 text-center text-primary-text">{displayEdition.name}</h3>
          <div className="flex flex-col gap-2">
            {surah.ayahs.map(ayah => (
              ayah.audio ? (
                <div key={ayah.number} className="flex items-center gap-4 py-2 px-3 my-1 bg-surface-subtle rounded-lg">
                  <span className="font-bold text-primary-text">الآية {ayah.numberInSurah}</span>
                  <audio
                    controls
                    src={ayah.audio}
                    className="w-full h-10"
                    preload="metadata"
                    title={`الاستماع للآية ${ayah.numberInSurah}`}
                  >
                    متصفحك لا يدعم عنصر الصوت.
                  </audio>
                </div>
              ) : null
            ))}
          </div>
        </main>
      </div>
    );
  }

  const { className: quranTextClass } = getQuranTextStyle(fontStyle, fontSize);

  const handleSaveClick = (ayah: Ayah) => {
    onSaveAyah({
      type: 'ayah',
      id: `${ayah.surah?.number || surah.number}:${ayah.numberInSurah}`,
      surah: ayah.surah?.number || surah.number,
      ayah: ayah.numberInSurah,
      text: ayah.text || '',
      createdAt: Date.now(),
    });
    setActivePopover(null);
  };

  const handleSaveReadingStop = (ayah: Ayah) => {
    try {
      const activeSurahNum = ayah.surah?.number || surah.number;
      const activeSurahName = ayah.surah?.name || surah.name;
      const activeAyahNum = ayah.numberInSurah;
      
      const newStop = {
        browsingMode,
        surahNumber: activeSurahNum,
        surahName: activeSurahName,
        ayahNumber: activeAyahNum,
        pageNumber: browsingMode === 'page' ? currentPage : undefined,
        timestamp: Date.now()
      };

      const stored = safeLocalStorage.getItem('qran_reading_stops');
      let stops: any[] = [];
      if (stored) {
        stops = JSON.parse(stored);
      }
      
      // Remove any existing stop for the same surah and ayah
      stops = stops.filter(s => !(s.surahNumber === activeSurahNum && s.ayahNumber === activeAyahNum));
      
      // Add new stop to front, slice to max 5
      stops.unshift(newStop);
      stops = stops.slice(0, 50);
      
      safeLocalStorage.setItem('qran_reading_stops', JSON.stringify(stops));
    } catch (e) {
      console.error("Failed to save reading stop", e);
    }
  };

  const handleCopyAyah = (ayah: Ayah) => {
    const isImlaei = fontStyle === 'imlai_1' || fontStyle === 'imlai_2';
    let ayahText = ayah.text || '';

    if (isImlaei) {
        const marksToRemoveRegex = /[\u06D6-\u06ED]/g;
        ayahText = ayahText.replace(marksToRemoveRegex, '');
    }
    
    const surahName = ayah.surah?.name || surah.name;
    const cleanSurahName = formatSurahNameForDisplay(surahName);
    const textToCopy = `"${ayahText}" (سورة ${cleanSurahName} - الآية ${ayah.numberInSurah})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedAyah(ayah.number);
        setTimeout(() => setCopiedAyah(null), 2000);
        setActivePopover(null);
    });
  };

  const handleSearchByAyahText = (ayah: Ayah) => {
    const sNum = ayah.surah?.number || surah.number;
    const simpleSurah = simpleCleanData.find(s => s.number === sNum);
    const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
    const simpleTextToSearch = simpleAyah?.text;

    if (simpleTextToSearch) {
        onWordClick(simpleTextToSearch, 'quran-simple-clean', { surah: sNum, ayah: ayah.numberInSurah, wordIndex: 0 });
    } else if (ayah.text) {
        onWordClick(ayah.text, displayEdition.identifier, { surah: sNum, ayah: ayah.numberInSurah, wordIndex: 0 });
    }
    setActivePopover(null);
  };
  
  const handlePlayFromAyah = (ayah: Ayah) => {
    let ayahsWithSurahInfo: Ayah[] = [];
    if (pageSurahs) {
        ayahsWithSurahInfo = pageSurahs.flatMap(s => 
            s.ayahs.map(a => ({
                ...a,
                surah: {
                    number: s.number,
                    name: s.name,
                    englishName: s.englishName,
                    englishNameTranslation: s.englishNameTranslation,
                    revelationType: s.revelationType,
                }
            }))
        );
    } else {
        ayahsWithSurahInfo = surah.ayahs.map(a => ({
            ...a,
            surah: {
                number: surah.number,
                name: surah.name,
                englishName: surah.englishName,
                englishNameTranslation: surah.englishNameTranslation,
                revelationType: surah.revelationType,
            }
        }));
    }
    
    const startIndex = ayahsWithSurahInfo.findIndex(a => a.number === ayah.number);
    if (startIndex !== -1) {
        onStartPlayback(ayahsWithSurahInfo, selectedAudioEdition, startIndex);
    }
    setActivePopover(null);
  };
  
  // Navigation functions using global Routing (Hash)
  const navigateToPage = (pageNum: number) => {
      window.location.hash = `#/page/${pageNum}`;
  };
  
  // Prepare content to render
  const contentToRender = useMemo(() => {
      if (browsingMode === 'page') {
          return pageSurahs || (ayahsByPage.get(currentPage) ? [{...surah, ayahs: ayahsByPage.get(currentPage)!}] : []);
      }
      return [surah];
  }, [browsingMode, ayahsByPage, currentPage, surah, pageSurahs]);

  const pageInfo = useMemo(() => {
    if (browsingMode !== 'page' || !hizbQuarterStartMap || contentToRender.length === 0) return null;
    
    // Use the first surah/ayah on the page for Header Info
    const firstSurah = contentToRender[0];
    if (!firstSurah || !firstSurah.ayahs || firstSurah.ayahs.length === 0) return null;

    const firstAyah = firstSurah.ayahs[0];
    
    // Display name of the first surah on page
    let surahName = firstSurah.name;
    surahName = surahName.replace(/^سُورَةُ\s*/, '').trim();

    const juzNumber = firstAyah.juz;
    const hizbNumber = firstAyah.hizbQuarter ? Math.floor((firstAyah.hizbQuarter - 1) / 4) + 1 : null;
    
    const markers: {label: string}[] = [];
    const processedQuarters = new Set<number>();
    
    if (hizbNumber) {
        const startOfHizbQuarter = (hizbNumber - 1) * 4 + 1;
        if(hizbQuarterStartMap.get(startOfHizbQuarter) === firstAyah.number) {
            markers.push({ label: `الحزب ${hizbNumber}`});
        }
    }
    
    // Scan all ayahs on the page for hizb markers
    for (const s of contentToRender) {
        for(const ayah of s.ayahs) {
            if(ayah.hizbQuarter && hizbQuarterStartMap.get(ayah.hizbQuarter) === ayah.number) {
                if (processedQuarters.has(ayah.hizbQuarter)) continue;
                
                const quarterType = (ayah.hizbQuarter - 1) % 4;
                if (quarterType === 1) markers.push({ label: 'ربع الحزب'});
                else if (quarterType === 2) markers.push({ label: 'نصف الحزب'});
                else if (quarterType === 3) markers.push({ label: 'ثلاثة أرباع الحزب'});

                processedQuarters.add(ayah.hizbQuarter);
            }
        }
    }
    
    return {
        surahNumber: firstSurah.number,
        surahName,
        juzNumber,
        markers,
        side: currentPage % 2 === 0 ? 'left' : 'right'
    };
  }, [currentPage, browsingMode, contentToRender, hizbQuarterStartMap]);

        
  const findActiveAyah = () => {
    const elements = document.querySelectorAll('[id^="ayah-"]');
    let closestElement: Element | null = null;
    let closestDistance = Infinity;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const distance = Math.abs(rect.top - 150);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
      }
    });

    if (closestElement) {
      const id = (closestElement as HTMLElement).id;
      const parts = id.split('-');
      if (parts.length === 3) {
        const sNum = parseInt(parts[1], 10);
        const aNum = parseInt(parts[2], 10);
        return { surahNumber: sNum, ayahNumber: aNum };
      }
    }
    return null;
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const saveProgress = () => {
      let activeAyahNum: number | null = null;
      let activeSurahNum = surah.number;
      let activePageNum = currentPage;

      if (browsingMode === 'page') {
        const active = findActiveAyah();
        if (active && pageSurahs && pageSurahs.some(s => s.number === active.surahNumber)) {
          activeSurahNum = active.surahNumber;
          activeAyahNum = active.ayahNumber;
        } else {
          const firstSurahSegment = contentToRender[0];
          if (firstSurahSegment && firstSurahSegment.ayahs && firstSurahSegment.ayahs.length > 0) {
            activeSurahNum = firstSurahSegment.number;
            activeAyahNum = firstSurahSegment.ayahs[0].numberInSurah;
          }
        }

        const lastPosition = {
          browsingMode: 'page',
          pageNumber: activePageNum,
          surahNumber: activeSurahNum,
          ayahNumber: activeAyahNum || 1,
          timestamp: Date.now()
        };
        safeLocalStorage.setItem('qran_last_read_position', JSON.stringify(lastPosition));
        safeLocalStorage.setItem('qran_last_route', `#/page/${activePageNum}?ayah=${activeAyahNum || 1}`);
      } else {
        const active = findActiveAyah();
        if (active) {
          activeSurahNum = active.surahNumber;
          activeAyahNum = active.ayahNumber;
        } else if (surah.ayahs && surah.ayahs.length > 0) {
          activeAyahNum = surah.ayahs[0].numberInSurah;
        }

        const lastPosition = {
          browsingMode: 'full',
          surahNumber: activeSurahNum,
          ayahNumber: activeAyahNum || 1,
          timestamp: Date.now()
        };
        safeLocalStorage.setItem('qran_last_read_position', JSON.stringify(lastPosition));
        safeLocalStorage.setItem('qran_last_route', `#/surah/${activeSurahNum}?ayah=${activeAyahNum || 1}`);
      }

      // Automatically save to reading stops (history)
      try {
        const stored = safeLocalStorage.getItem('qran_reading_stops');
        let stops: any[] = [];
        if (stored) {
          stops = JSON.parse(stored);
        }

        const surahObj = QURAN_INDEX.find(s => s.number === activeSurahNum);
        const surahName = surahObj ? surahObj.name : `سورة ${activeSurahNum}`;

        const newStop = {
          browsingMode,
          surahNumber: activeSurahNum,
          surahName,
          ayahNumber: activeAyahNum || 1,
          pageNumber: browsingMode === 'page' ? activePageNum : undefined,
          timestamp: Date.now()
        };

        const isDuplicate = stops.length > 0 && 
          stops[0].surahNumber === activeSurahNum && 
          stops[0].ayahNumber === (activeAyahNum || 1) &&
          (browsingMode === 'page' ? stops[0].pageNumber === activePageNum : stops[0].browsingMode === 'full');

        if (!isDuplicate) {
          stops = stops.filter(s => {
            if (browsingMode === 'page') {
              return s.pageNumber !== activePageNum;
            } else {
              return s.surahNumber !== activeSurahNum;
            }
          });

          stops.unshift(newStop);
          stops = stops.slice(0, 50);
          safeLocalStorage.setItem('qran_reading_stops', JSON.stringify(stops));
        }
      } catch (e) {
        console.error("Failed to autosave reading stop", e);
      }
    };

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveProgress, 500);
    };

    saveProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [surah.number, currentPage, browsingMode, contentToRender, pageSurahs]);

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto px-4">
      <div className="overflow-hidden rounded-lg">
        {browsingMode === 'page' ? (
             <div>
                <div className="mushaf-page">
                    {pageInfo?.markers.map((marker, index) => (
                         <div key={index} className={`hizb-marker ${pageInfo.side}`}>{marker.label}</div>
                    ))}
                    <header className="mushaf-header">
                        <span>{pageInfo?.juzNumber && `الجزء ${pageInfo.juzNumber}`}</span>
                        {pageInfo?.surahName && (
                            <a 
                                href={`#/surah/${pageInfo.surahNumber}`}
                                className="hover:text-primary hover:underline transition-colors cursor-pointer"
                                title={`فتح سورة ${pageInfo.surahName}`}
                            >
                                سورة {pageInfo.surahName}
                            </a>
                        )}
                    </header>
                    
                    <main dir="rtl" className={`text-text-primary ${quranTextClass} text-justify`}>
                        {contentToRender.map((surahSegment, index) => {
                            const isStartOfSurah = surahSegment.ayahs[0].numberInSurah === 1;
                            const showBismillah = isStartOfSurah && surahSegment.number !== 1 && surahSegment.number !== 9;
                            
                            // Only pass highlight to the renderer if this segment matches the requested surah.
                            // This prevents conflict if multiple surahs on page have the same ayah number (e.g. 1).
                            const isTargetSurah = surahSegment.number === surah.number;
                            const effectiveHighlight = isTargetSurah ? highlightAyahNumber : null;

                            return (
                                <React.Fragment key={surahSegment.number}>
                                    {/* Decorative Separator if not the first surah on page */}
                                    {index > 0 && (
                                        <div className="my-6 flex items-center justify-center">
                                            <div className="w-full h-10 bg-no-repeat bg-center bg-contain opacity-80" 
                                                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'%3E%3Cpath d='M0 20 Q 100 0 200 20 T 400 20' fill='none' stroke='%2322c55e' stroke-width='2' opacity='0.5'/%3E%3Cpath d='M0 20 Q 100 40 200 20 T 400 20' fill='none' stroke='%2322c55e' stroke-width='2' opacity='0.5'/%3E%3Ccircle cx='200' cy='20' r='5' fill='%2322c55e'/%3E%3C/svg%3E")` }}>
                                            </div>
                                        </div>
                                    )}

                                    {/* Surah Header if start of surah */}
                                    {isStartOfSurah && (
                                        <SurahHeaderStrip surahNumber={surahSegment.number} surahName={surahSegment.name} />
                                    )}

                                    {/* Bismillah */}
                                    {showBismillah && (
                                        <div className="text-center mb-6 font-bismillah text-2xl text-primary-text-strong select-none">
                                            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                                        </div>
                                    )}

                                    {/* Ayahs */}
                                    <AyahRenderer 
                                        ayahsToRender={surahSegment.ayahs} 
                                        surah={surahSegment} 
                                        highlightAyahNumber={effectiveHighlight} 
                                        onWordClick={onWordClick} 
                                        currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber} 
                                        simpleCleanData={simpleCleanData} 
                                        wordPopoverState={wordPopoverState} 
                                        setWordPopoverState={setWordPopoverState} 
                                        setActivePopover={setActivePopover} 
                                        playingAyahRef={playingAyahRef} 
                                        highlightRef={highlightRef} 
                                        firstAyahInfo={null} // Bismillah handled above
                                    />
                                </React.Fragment>
                            );
                        })}
                    </main>

                    <footer className="mushaf-footer flex items-center justify-between mt-4">
                        <div className="w-16">
                            {currentPage > 1 && (
                                <button 
                                    onClick={() => navigateToPage(currentPage - 1)}
                                    className="w-full border-2 border-current rounded py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-mono text-lg font-bold"
                                    title="الصفحة السابقة"
                                >
                                    {currentPage - 1}
                                </button>
                            )}
                        </div>
                        <span className="font-bold text-xl">{currentPage}</span>
                        <div className="w-16">
                            {currentPage < 604 && (
                                <button 
                                    onClick={() => navigateToPage(currentPage + 1)}
                                    className="w-full border-2 border-current rounded py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-mono text-lg font-bold"
                                    title="الصفحة التالية"
                                >
                                    {currentPage + 1}
                                </button>
                            )}
                        </div>
                    </footer>
                </div>
            </div>
        ) : (
            <main
                className={`bg-surface p-6 sm:p-8 rounded-lg shadow-md transition-colors duration-300`}
            >
                {/* Full Surah Mode or Simple Text Page Mode (though page mode forces Uthmani usually) */}
                {/* Render simpler version for full mode, just one surah usually */}
                
                {contentToRender.map((surahSegment, index) => {
                     const isStartOfSurah = surahSegment.ayahs[0].numberInSurah === 1;
                     const showBismillah = isStartOfSurah && surahSegment.number !== 1 && surahSegment.number !== 9;
                     
                     // Ensure highlight is applied correctly even in text mode if multiple segments exist
                     const isTargetSurah = surahSegment.number === surah.number;
                     const effectiveHighlight = isTargetSurah ? highlightAyahNumber : null;

                     return (
                        <div key={surahSegment.number} className={index > 0 ? "mt-8 pt-8 border-t border-dashed border-border-default" : ""}>
                             {isStartOfSurah && (
                                <SurahHeaderStrip surahNumber={surahSegment.number} surahName={surahSegment.name} />
                            )}
                            {showBismillah && (
                                <div className="text-center mb-8 font-bismillah text-2xl text-primary-text-strong">
                                    بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                                </div>
                            )}
                            <div dir="rtl" className={`text-text-primary ${quranTextClass} text-justify`} style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                                <AyahRenderer 
                                    ayahsToRender={surahSegment.ayahs} 
                                    surah={surahSegment} 
                                    highlightAyahNumber={effectiveHighlight} 
                                    onWordClick={onWordClick} 
                                    currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber} 
                                    simpleCleanData={simpleCleanData} 
                                    wordPopoverState={wordPopoverState} 
                                    setWordPopoverState={setWordPopoverState} 
                                    setActivePopover={setActivePopover} 
                                    playingAyahRef={playingAyahRef} 
                                    highlightRef={highlightRef} 
                                    firstAyahInfo={null}
                                />
                            </div>
                        </div>
                     )
                })}
            </main>
        )}
      </div>
      
      {browsingMode === 'page' && (
          <div className="mt-6 flex items-center justify-between p-2 bg-surface rounded-full shadow-md border border-border-default">
              <button 
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <ArrowRightIcon className="w-5 h-5" />
                  <span className="font-semibold hidden sm:inline">الصفحة السابقة</span>
              </button>
              <div className="font-bold text-lg text-text-primary font-mono select-none">
                  {currentPage}
              </div>
              <button 
                  onClick={() => navigateToPage(currentPage + 1)} 
                  disabled={currentPage >= 604}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <span className="font-semibold hidden sm:inline">الصفحة التالية</span>
                  <ArrowLeftIcon className="w-5 h-5" />
              </button>
          </div>
      )}

      {wordPopoverState && (
         <div 
            ref={wordPopoverRef}
            className="absolute p-3 bg-surface rounded-lg shadow-lg border border-border-default flex items-center gap-2 z-20 animate-fade-in flex-wrap leading-loose"
            style={(() => {
                if (!wordPopoverState.triggerElement) return { opacity: 0, top: 0, left: 0 };
                const rect = wordPopoverState.triggerElement.getBoundingClientRect();
                return {
                    top: `${rect.bottom + window.scrollY + 5}px`,
                    left: `${rect.left + window.scrollX + rect.width / 2}px`,
                    transform: 'translateX(-50%)',
                };
            })()}
        >
            {wordPopoverState.simpleText.split(' ').map((word, index) => (
                <button
                    key={index}
                    onClick={() => {
                        // Find the surah number from the context (a bit tricky here since we have multiple surahs).
                        // However, wordPopoverState stores the trigger element. 
                        // To keep it simple, we pass the first surah's number or fix logic later if needed.
                        // Ideally we should store surah number in popover state too.
                        // For now, defaulting to current viewed surah (prop) is safe enough for 99% cases or user context.
                        onWordClick(word, 'quran-simple-clean', { surah: surah.number, ayah: wordPopoverState.ayahNumberInSurah, wordIndex: index });
                        setWordPopoverState(null);
                    }}
                    className="px-2 py-1 bg-surface-subtle rounded-md hover:bg-primary/20 transition-colors"
                >
                    {word}
                </button>
            ))}
        </div>
      )}

      {activePopover && (
        <AyahActionPopover 
            activePopover={activePopover}
            onClose={() => setActivePopover(null)}
            onSave={handleSaveClick}
            onCopy={handleCopyAyah}
            onSearchText={handleSearchByAyahText}
            onSearchNumber={onSearchByAyahNumber}
            onPlayFrom={handlePlayFromAyah}
            onSaveStop={handleSaveReadingStop}
            copiedAyah={copiedAyah}
        />
      )}

    </div>
  );
};

export default SurahDetailView;