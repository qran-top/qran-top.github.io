import React, { useMemo, useCallback } from 'react';
import type { BrowsingMode, Ayah } from '../types';
import SearchForm from './SearchForm';
import ThemeToggleButton from './ThemeToggleButton';
import { PlayIcon, SpinnerIcon } from './icons';

interface ControlBarProps {
    onSearch: (query: string) => void;
    isInitialLoading: boolean;
    selectedEdition: string;
    setSelectedEdition: (edition: string) => void;
    currentPath: string;
    browsingMode: BrowsingMode;
    setBrowsingMode: (mode: BrowsingMode) => void;
    loadingEditions: string[];
    onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
    isPlaybackLoading: boolean;
    selectedAudioEdition: string;
}

const ControlBar: React.FC<ControlBarProps> = ({
    onSearch,
    isInitialLoading,
    selectedEdition,
    setSelectedEdition,
    currentPath,
    browsingMode,
    setBrowsingMode,
    loadingEditions,
    onStartPlayback,
    isPlaybackLoading,
    selectedAudioEdition,
}) => {
    const { isSurahPage, isRelevantPageForToggle } = useMemo(() => {
        const path = currentPath.split('?')[0];
        const isSurah = path.startsWith('#/surah/');
        const isRelevant = isSurah || path.startsWith('#/search/');
        return { isSurahPage: isSurah, isRelevantPageForToggle: isRelevant };
    }, [currentPath]);
    
    const isUthmaniLoading = useMemo(() => {
        return loadingEditions.includes('quran-uthmani-quran-academy');
    }, [loadingEditions]);

    const handleEditionToggle = useCallback(() => {
        if (selectedEdition === 'quran-simple-clean') {
            setSelectedEdition('quran-uthmani-quran-academy');
            setBrowsingMode('page');
        } else {
            setSelectedEdition('quran-simple-clean');
            setBrowsingMode('full');
        }
    }, [selectedEdition, setSelectedEdition, setBrowsingMode]);

    const handlePlaySurah = useCallback(() => {
        let startIndex = 0;
        const elements = document.querySelectorAll('[id^="ayah-"]');
        if (elements.length > 0) {
            let closestElement: Element | null = null;
            let closestDistance = Infinity;
            const targetY = 140;

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    const distance = Math.abs(rect.top - targetY);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestElement = el;
                    }
                }
            });

            if (closestElement) {
                const id = (closestElement as HTMLElement).id;
                const parts = id.split('-');
                if (parts.length === 3) {
                    const aNum = parseInt(parts[2], 10);
                    const [path] = currentPath.substring(1).split('?');
                    const pathParts = path.split('/').filter(Boolean);

                    if (pathParts[0] === 'surah') {
                        startIndex = Math.max(0, aNum - 1);
                    } else if (pathParts[0] === 'page') {
                        const ayahElements = Array.from(elements);
                        const idx = ayahElements.indexOf(closestElement);
                        if (idx !== -1) {
                            startIndex = idx;
                        }
                    }
                }
            }
        }

        onStartPlayback([], selectedAudioEdition, startIndex);
    }, [onStartPlayback, selectedAudioEdition, currentPath]);

    return (
        <div className="bg-surface border-b border-border-default">
            <div className="w-full max-w-7xl mx-auto px-4 py-2">
                <div className="flex items-center justify-between gap-2 md:gap-4">
                    <div className="flex-shrink-0">
                        <ThemeToggleButton />
                    </div>

                    <div className="flex-grow flex justify-center min-w-0 px-2">
                        <SearchForm onSearch={onSearch} disabled={isInitialLoading} />
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                         {isRelevantPageForToggle && (
                            <button 
                                onClick={handleEditionToggle}
                                disabled={selectedEdition === 'quran-simple-clean' && isUthmaniLoading}
                                className="px-3 py-1 text-sm font-semibold bg-surface-subtle text-text-secondary rounded-lg hover:bg-surface-hover transition-colors border border-border-default disabled:opacity-50 disabled:cursor-not-allowed"
                                title="التبديل بين الرسم الإملائي والعثماني"
                            >
                                <span>
                                    {isUthmaniLoading && selectedEdition === 'quran-simple-clean' 
                                        ? 'تحميل...' 
                                        : (selectedEdition === 'quran-simple-clean' ? 'عثماني' : 'إملائي')}
                                </span>
                            </button>
                        )}
                        {isSurahPage && (
                            <button
                                onClick={handlePlaySurah}
                                disabled={isPlaybackLoading}
                                className="p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary-hover transition-colors disabled:opacity-60"
                                aria-label="استماع للسورة"
                            >
                                {isPlaybackLoading ? <SpinnerIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlBar;