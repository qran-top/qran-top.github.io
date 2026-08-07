import React, { useMemo } from 'react';
import type { Ayah, SurahData, QuranEdition, FontSize, FontStyleType } from '../types';
import { SparklesIcon, BookmarkIcon, CopyIcon, CheckIcon } from './icons';
import { normalizeArabicText } from '../utils/text';
import { getQuranTextStyle } from '../utils/font';

interface SearchResultItemProps {
  ayah: Ayah;
  queryWords: string[];
  onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }) => void;
  displayEdition: QuranEdition;
  displayEditionData: SurahData[];
  searchEdition: string;
  fontSize: FontSize;
  fontStyle: FontStyleType;
  searchType: 'text' | 'number';
  isCurrentlyPlaying: boolean;
  itemRef: React.RefObject<HTMLLIElement>;
  pulsingWordIndex: number;
  resultIndex: number;
  simpleAyahText: string;
  onUthmaniWordClick: (event: React.MouseEvent<HTMLButtonElement>, resultIndex: number, simpleAyahText: string) => void;
  onSaveAyah?: (ayah: Ayah) => void;
  onCopyAyah?: (ayah: Ayah) => void;
  copiedAyah?: number | null;
}

const SURAH_MUQATTAAT_MAP: Record<number, string> = {
    2: "الم",
    3: "الم",
    7: "المص",
    10: "الر",
    11: "الر",
    12: "الر",
    13: "المر",
    14: "الر",
    15: "الر",
    19: "كهيعص",
    20: "طه",
    26: "طسم",
    27: "طس",
    28: "طسم",
    29: "الم",
    30: "الم",
    31: "الم",
    32: "الم",
    36: "يس",
    38: "ص",
    40: "حم",
    41: "حم",
    42: "حم عسق",
    43: "حم",
    44: "حم",
    45: "حم",
    46: "حم",
    50: "ق",
    68: "ن"
};

const getSurahMuqattaat = (surahNumber?: number): string | null => {
    if (!surahNumber) return null;
    return SURAH_MUQATTAAT_MAP[surahNumber] || null;
};

    const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
    ayah, queryWords, onNewSearch, displayEdition, displayEditionData, 
    fontSize, fontStyle, searchType, isCurrentlyPlaying, itemRef, pulsingWordIndex,
    resultIndex, simpleAyahText, onUthmaniWordClick, onSaveAyah, onCopyAyah, copiedAyah
}) => {

    const displayAyah = useMemo(() => {
        if (displayEditionData?.length > 0 && ayah.surah) {
            const displaySurah = displayEditionData.find(s => s.number === ayah.surah!.number);
            const displayAyahData = displaySurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
            if (displayAyahData && displaySurah) {
                return { 
                    ...displayAyahData,
                    surah: {
                        number: displaySurah.number,
                        name: displaySurah.name,
                        englishName: displaySurah.englishName,
                        englishNameTranslation: displaySurah.englishNameTranslation,
                        revelationType: displaySurah.revelationType,
                    }
                };
            }
        }
        return ayah;
    }, [ayah, displayEditionData]);

    const { className: quranTextClass } = getQuranTextStyle(fontStyle, fontSize);

    const renderAyahWithHighlight = () => {
        if (displayEdition.format === 'audio') {
            return <span className="text-sm text-text-muted">[مصدر صوتي، لا يتوفر عرض نصي هنا]</span>
        }

        if (!displayAyah.text) {
            return '';
        }
        
        const isImlaei = fontStyle === 'imlai_1' || fontStyle === 'imlai_2';
        let textToRender = displayAyah.text;

        if (isImlaei) {
            // This regex removes Quranic annotation marks like waqf signs (salli, qali, jeem, etc.)
            const marksToRemoveRegex = /[\u06D6-\u06ED]/g;
            textToRender = textToRender.replace(marksToRemoveRegex, '');
        }
        
        const wordElements = textToRender.split(' ').map((word, index) => {
            const isPulsing = index === pulsingWordIndex;

            if (searchType === 'number') { // No highlighting for number search
                 return (
                    <button 
                        type="button" 
                        key={index} 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isImlaei) {
                                if (word && ayah.surah) {
                                    onNewSearch(word, 'quran-simple-clean', { surah: ayah.surah.number, ayah: ayah.numberInSurah, wordIndex: index });
                                }
                            } else {
                                if (simpleAyahText) {
                                    onUthmaniWordClick(e, resultIndex, simpleAyahText);
                                }
                            }
                        }} 
                        className="word-trigger bg-transparent border-none p-0 font-inherit cursor-pointer hover:bg-primary/10 rounded-md px-1 transition-colors"
                        aria-label={`إظهار خيارات البحث لكلمة: ${word}`}
                    >
                        <span className={isPulsing ? 'animate-highlight-pulse rounded-sm' : ''}>{word}</span>
                    </button>
                 );
            }

            const normalizedWord = normalizeArabicText(word);
            const isMatch = queryWords.some(queryWord => normalizedWord.includes(queryWord));

            return (
                <button
                    type="button"
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isImlaei) {
                            if (word && ayah.surah) {
                                onNewSearch(word, 'quran-simple-clean', { surah: ayah.surah.number, ayah: ayah.numberInSurah, wordIndex: index });
                            }
                        } else {
                            if (simpleAyahText) {
                                onUthmaniWordClick(e, resultIndex, simpleAyahText);
                            }
                        }
                    }}
                    className="word-trigger bg-transparent border-none p-0 font-inherit cursor-pointer hover:bg-primary/10 rounded-md px-1 transition-colors"
                    aria-label={`إظهار خيارات البحث لكلمة: ${word}`}
                >
                    {isMatch ? (
                        <mark className={`bg-yellow-400/40 text-text-primary rounded-sm ${isPulsing ? 'animate-highlight-pulse' : ''}`}>{word}</mark>
                    ) : (
                        <span className={isPulsing ? 'animate-highlight-pulse rounded-sm' : ''}>{word}</span>
                    )}
                </button>
            );
        });

        return wordElements.reduce((prev, curr, index) => <>{prev}{index > 0 ? ' ' : ''}{curr}</>, <></>);
    };
    
    return (
        <li
            ref={itemRef}
            className={`p-3 sm:p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg w-full max-w-full overflow-hidden break-words ${isCurrentlyPlaying ? 'bg-yellow-300/60 dark:bg-yellow-400/30 ring-2 ring-yellow-500' : 'bg-surface-subtle'}`}
        >
            <div className="flex justify-between items-center mb-2 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                     <a
                        href={`#/surah/${displayAyah.surah?.number}?ayah=${displayAyah.numberInSurah}`}
                        className="text-primary-text font-bold cursor-pointer rounded-md p-1 -m-1 hover:bg-surface-hover transition-colors"
                        aria-label={`الانتقال إلى ${displayAyah.surah?.name} الآية ${displayAyah.numberInSurah}`}
                    >
                        <span className="font-quran-title">{displayAyah.surah?.name} - الآية {displayAyah.numberInSurah}</span>
                    </a>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {(() => {
                        const letters = getSurahMuqattaat(displayAyah.surah?.number);
                        if (!letters) return null;
                        return (
                            <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-primary/5 text-primary border border-primary/10 dark:bg-primary/10 dark:text-primary dark:border-primary/25 transition-all cursor-help select-none"
                                title={`هذه السورة تبدأ بالأحرف النورانية: ${letters}`}
                            >
                                <SparklesIcon className="w-2.5 h-2.5 flex-shrink-0 text-primary/70" />
                                <span className="font-semibold">{letters}</span>
                            </span>
                        );
                    })()}
                    {onCopyAyah && (
                        <button
                            onClick={() => onCopyAyah(displayAyah)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover border border-border-default transition-all flex items-center gap-1 text-xs font-semibold"
                            aria-label="نسخ الآية"
                            title="نسخ الآية مع المرجع"
                        >
                            {copiedAyah === displayAyah.number ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                                <CopyIcon className="w-4 h-4 text-primary" />
                            )}
                            <span className="hidden sm:inline">نسخ</span>
                        </button>
                    )}
                    {onSaveAyah && (
                        <button
                            onClick={() => onSaveAyah(displayAyah)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover border border-border-default transition-all flex items-center gap-1 text-xs font-semibold"
                            aria-label="حفظ الآية في دفتر التدبر"
                            title="حفظ الآية في دفتر التدبر"
                        >
                            <BookmarkIcon className="w-4 h-4 text-primary" />
                            <span className="hidden sm:inline">حفظ</span>
                        </button>
                    )}
                </div>
            </div>
            <p
                dir="rtl"
                aria-label={`نص الآية ${displayAyah.numberInSurah} من سورة ${displayAyah.surah?.name}`}
                className={`${quranTextClass} text-text-primary text-justify`}
                style={{ textAlign: 'justify', textJustify: 'inter-word' }}
            >
               {renderAyahWithHighlight()}
            </p>
        </li>
    );
};

export default React.memo(SearchResultItem);