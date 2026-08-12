import React, { useState, useEffect } from 'react';
import type { Ayah, SurahData } from '../types';
import { useSettingsContext } from '../contexts/SettingsContext';
import { fetchChapterTajweedVerses, QuranV4TajweedVerse, playSmartWordAudio } from '../services/quranApiV4';
import WordActionPopover from './WordActionPopover';
import WordMorphologyModal from './WordMorphologyModal';

interface AyahRendererProps {
    ayahsToRender: Ayah[];
    surah: SurahData;
    highlightAyahNumber: number | null;
    onWordClick: (query: string, editionIdentifier: string, position: { surah: number; ayah: number; wordIndex: number; }) => void;
    currentlyPlayingAyahGlobalNumber: number | null;
    simpleCleanData: SurahData[];
    wordPopoverState: { ayahNumberInSurah: number; simpleText: string; triggerElement: HTMLElement; } | null;
    setWordPopoverState: (state: { ayahNumberInSurah: number; simpleText: string; triggerElement: HTMLElement; } | null) => void;
    setActivePopover: (state: { ayah: Ayah; triggerElement: HTMLElement } | null) => void;
    playingAyahRef: React.RefObject<HTMLSpanElement>;
    highlightRef: React.RefObject<HTMLSpanElement>;
    firstAyahInfo: { bismillah: string; restOfAyah: string; } | null;
}

const cleanTajweedHtml = (html: string | undefined): string => {
    if (!html) return '';
    return html
        .replace(/<span[^>]*class=['"]?end['"]?[^>]*>.*?<\/span>/gi, '')
        .replace(/[\s\u0660-\u0669\u06F0-\u06F9\u06DD\uFD3E\uFD3F]+$/, '')
        .trim();
};

/**
 * Safely splits HTML content into words without breaking open tags like <tajweed class=ham_wasl>
 */
const splitTajweedHtmlIntoWords = (html: string): string[] => {
    if (!html) return [];
    const words: string[] = [];
    let current = '';
    let inTag = false;

    for (let i = 0; i < html.length; i++) {
        const char = html[i];
        if (char === '<') {
            inTag = true;
            current += char;
        } else if (char === '>') {
            inTag = false;
            current += char;
        } else if (char === ' ' && !inTag) {
            if (current.trim()) {
                words.push(current);
            }
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        words.push(current);
    }
    return words;
};

const AyahRenderer: React.FC<AyahRendererProps> = ({
    ayahsToRender, surah, highlightAyahNumber, onWordClick,
    currentlyPlayingAyahGlobalNumber, simpleCleanData, wordPopoverState, setWordPopoverState,
    setActivePopover, playingAyahRef, highlightRef, firstAyahInfo
}) => {
    
    // Consume Settings from Context
    const { 
        displayEdition, 
        browsingMode, 
        enableTajweed, 
        enableWordAudio, 
        enableMorphology, 
        fontStyle, 
        wordClickBehavior 
    } = useSettingsContext();

    const isImlaei1 = fontStyle === 'imlai_1' || displayEdition.identifier.includes('simple-clean');

    const [v4TajweedData, setV4TajweedData] = useState<QuranV4TajweedVerse[]>([]);
    const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);

    // Modals & Popovers for Word interaction
    const [activeWordPopover, setActiveWordPopover] = useState<{
        word: string;
        surahNumber: number;
        surahName?: string;
        ayahNumberInSurah: number;
        wordIndex: number;
        triggerElement: HTMLElement;
    } | null>(null);

    const [activeMorphologyModal, setActiveMorphologyModal] = useState<{
        word: string;
        surahNumber: number;
        surahName?: string;
        ayahNumberInSurah: number;
    } | null>(null);

    // Fetch Tajweed data from Quran.com API v4 if enableTajweed is true
    useEffect(() => {
        let isMounted = true;
        if (enableTajweed && surah?.number) {
            fetchChapterTajweedVerses(surah.number).then((data) => {
                if (isMounted) setV4TajweedData(data);
            });
        }
        return () => { isMounted = false; };
    }, [enableTajweed, surah?.number]);

    // Function to play word-by-word audio using smart alignment
    const playWordAudio = (surahNum: number, ayahNum: number, wordIdxOneBased: number, clickedWordText?: string) => {
        try {
            const wordKey = `${surahNum}:${ayahNum}:${wordIdxOneBased}`;
            setPlayingWordKey(wordKey);
            playSmartWordAudio(surahNum, ayahNum, wordIdxOneBased, clickedWordText).finally(() => {
                setTimeout(() => setPlayingWordKey(null), 1000);
            });
        } catch (e) {
            setPlayingWordKey(null);
        }
    };

    const cleanImlaiText = (text: string | undefined): string | undefined => {
        if (!text) return text;
        const marksToRemoveRegex = /[\u06D6-\u06ED]/g;
        return text.replace(marksToRemoveRegex, '');
    };

    const handleWordClickInternal = (event: React.MouseEvent<HTMLButtonElement>, word: string, wordIndex: number, ayahNumInSurah: number) => {
        const cleanWord = word
            .replace(/<[^>]*>/g, '')
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .trim();

        const shouldSearchDirectly = 
            wordClickBehavior === 'direct_search' || 
            (wordClickBehavior === 'auto' && isImlaei1);

        if (shouldSearchDirectly) {
            if (enableWordAudio) {
                playWordAudio(surah.number, ayahNumInSurah, wordIndex + 1, cleanWord);
            }
            onWordClick(cleanWord, displayEdition.identifier, { surah: surah.number, ayah: ayahNumInSurah, wordIndex });
        } else {
            // Open Word Action Popover
            setActiveWordPopover({
                word: cleanWord,
                surahNumber: surah.number,
                surahName: surah.name,
                ayahNumberInSurah: ayahNumInSurah,
                wordIndex,
                triggerElement: event.currentTarget
            });
        }
    };

    return (
        <>
            {ayahsToRender.map((ayah, index) => {
                const isHighlighted = ayah.numberInSurah === highlightAyahNumber;
                const isPlaying = ayah.number === currentlyPlayingAyahGlobalNumber;

                const baseText = (index === 0 && firstAyahInfo) ? firstAyahInfo.restOfAyah : ayah.text;
                const textToDisplay = isImlaei1 ? cleanImlaiText(baseText) : baseText;

                // Find matching v4 tajweed ayah if available
                const tajweedVerse = enableTajweed ? v4TajweedData.find(v => v.verse_number === ayah.numberInSurah) : null;

                // Clean trailing numbers/end markers from plain text to prevent duplicate numbers
                const cleanedTextToDisplay = textToDisplay ? textToDisplay.replace(/[\s\u0660-\u0669\u06F0-\u06F9\u06DD\uFD3E\uFD3F]+$/, '').trim() : '';

                return (
                    <span key={ayah.number} className="inline">
                        <span
                            id={`ayah-${surah.number}-${ayah.numberInSurah}`}
                            ref={isPlaying ? playingAyahRef : (isHighlighted ? highlightRef : null)}
                            className={`inline rounded-md transition-colors duration-300 ${isPlaying ? 'bg-yellow-300/60 dark:bg-yellow-400/30' : ''}`}
                        >
                            {/* If Tajweed is enabled and v4 tajweed data is loaded */}
                            {enableTajweed && tajweedVerse && tajweedVerse.text_uthmani_tajweed ? (
                                <span className="quran-tajweed inline">
                                    {splitTajweedHtmlIntoWords(cleanTajweedHtml(tajweedVerse.text_uthmani_tajweed)).map((wordHtml, wIdx) => {
                                        const plainWord = wordHtml.replace(/<[^>]*>/g, '').trim();
                                        const wordKey = `${surah.number}:${ayah.numberInSurah}:${wIdx + 1}`;
                                        const isWordPlaying = playingWordKey === wordKey;

                                        return (
                                            <React.Fragment key={wIdx}>
                                                <button
                                                    onClick={(e) => handleWordClickInternal(e, plainWord, wIdx, ayah.numberInSurah)}
                                                    className={`word-trigger inline bg-transparent border-none p-0 font-inherit cursor-pointer hover:bg-primary/20 rounded-md transition-colors px-0.5 ${
                                                        isWordPlaying ? 'bg-emerald-400/40 text-emerald-900 font-bold dark:bg-emerald-500/40 scale-105' : ''
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: wordHtml }}
                                                    title={`خيارات الكلمة: ${plainWord}`}
                                                />
                                                {' '}
                                            </React.Fragment>
                                        );
                                    })}
                                </span>
                            ) : (
                                cleanedTextToDisplay.split(' ').map((word, wordIndex, arr) => {
                                    const wordKey = `${surah.number}:${ayah.numberInSurah}:${wordIndex + 1}`;
                                    const isWordPlaying = playingWordKey === wordKey;

                                    return (
                                        <React.Fragment key={wordIndex}>
                                            <button
                                                onClick={(e) => handleWordClickInternal(e, word, wordIndex, ayah.numberInSurah)}
                                                className={`word-trigger inline bg-transparent border-none p-0 font-inherit text-inherit leading-inherit cursor-pointer hover:bg-primary/10 rounded-md transition-all ${
                                                    isWordPlaying ? 'bg-emerald-400/40 text-emerald-900 dark:bg-emerald-500/40 font-bold scale-105' : ''
                                                }`}
                                                aria-label={`خيارات الكلمة: ${word}`}
                                            >
                                                {word}
                                            </button>
                                            {wordIndex < arr.length - 1 && ' '}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </span>

                        <span className="relative inline-block align-middle">
                            <button
                                onClick={(e) => setActivePopover({ ayah: ayah, triggerElement: e.currentTarget })}
                                className={`popover-trigger mx-1 select-none cursor-pointer hover:opacity-80 transition-opacity ${browsingMode === 'page' ? 'ayah-marker' : 'text-sm font-sans font-bold text-primary-text rounded-md p-1 -m-1'}`}
                                aria-label={`إجراءات للآية ${ayah.numberInSurah}`}
                                aria-haspopup="true"
                            >
                                {browsingMode === 'page' ? ayah.numberInSurah : `﴿${ayah.numberInSurah}﴾`}
                            </button>
                        </span>
                    </span>
                );
            })}

            {/* Word Action Popover */}
            {activeWordPopover && (
                <WordActionPopover 
                    word={activeWordPopover.word}
                    surahNumber={activeWordPopover.surahNumber}
                    surahName={activeWordPopover.surahName}
                    ayahNumberInSurah={activeWordPopover.ayahNumberInSurah}
                    wordIndex={activeWordPopover.wordIndex}
                    triggerElement={activeWordPopover.triggerElement}
                    enableWordAudio={enableWordAudio}
                    enableMorphology={enableMorphology}
                    onClose={() => setActiveWordPopover(null)}
                    onSearchWord={(cleanWord) => {
                        onWordClick(cleanWord, displayEdition.identifier, {
                            surah: activeWordPopover.surahNumber,
                            ayah: activeWordPopover.ayahNumberInSurah,
                            wordIndex: activeWordPopover.wordIndex
                        });
                    }}
                    onPlayAudio={() => {
                        playWordAudio(activeWordPopover.surahNumber, activeWordPopover.ayahNumberInSurah, activeWordPopover.wordIndex + 1, activeWordPopover.word);
                    }}
                    onOpenMorphology={() => {
                        setActiveMorphologyModal({
                            word: activeWordPopover.word,
                            surahNumber: activeWordPopover.surahNumber,
                            surahName: activeWordPopover.surahName,
                            ayahNumberInSurah: activeWordPopover.ayahNumberInSurah
                        });
                    }}
                />
            )}

            {/* Word Morphology Modal */}
            {activeMorphologyModal && (
                <WordMorphologyModal 
                    word={activeMorphologyModal.word}
                    surahNumber={activeMorphologyModal.surahNumber}
                    surahName={activeMorphologyModal.surahName}
                    ayahNumberInSurah={activeMorphologyModal.ayahNumberInSurah}
                    onClose={() => setActiveMorphologyModal(null)}
                    onSearchWord={(cleanWord) => {
                        onWordClick(cleanWord, displayEdition.identifier, {
                            surah: activeMorphologyModal.surahNumber,
                            ayah: activeMorphologyModal.ayahNumberInSurah,
                            wordIndex: 0
                        });
                    }}
                />
            )}
        </>
    );
};

export default AyahRenderer;

