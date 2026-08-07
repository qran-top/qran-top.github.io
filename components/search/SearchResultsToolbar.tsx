import React from 'react';
import type { QuranEdition } from '../../types';
import { PlayIcon, SpinnerIcon, BookmarkIcon, DocumentDuplicateIcon, DownloadIcon, CheckIcon } from '../icons';
import AudioEditionSelector from '../AudioEditionSelector';

interface SearchResultsToolbarProps {
    isPlaybackLoading: boolean;
    allAudioEditions: QuranEdition[];
    onPlayAll: () => void;
    selectedAudioEdition: string;
    onAudioEditionChange: (id: string) => void;
    searchType: 'text' | 'number';
    onSaveSearch: () => void;
    onCopyAll: () => void;
    isAllCopied: boolean;
    onCopyHighlightedWords?: () => void;
    isHighlightedCopied?: boolean;
    copyHighlightedMode?: number;
    copyHighlightedToast?: string;
    highlightedWordsCount?: number;
    onDownloadAll: () => void;
}

const SearchResultsToolbar: React.FC<SearchResultsToolbarProps> = ({
    isPlaybackLoading, allAudioEditions, onPlayAll, selectedAudioEdition,
    onAudioEditionChange, searchType, onSaveSearch, onCopyAll, isAllCopied,
    onCopyHighlightedWords, isHighlightedCopied, copyHighlightedMode = 0,
    copyHighlightedToast, highlightedWordsCount = 0, onDownloadAll
}) => {
    const getHighlightedCopyButton = () => {
        if (isHighlightedCopied) {
            return (
                <button 
                    onClick={onCopyHighlightedWords}
                    disabled={isHighlightedCopied}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-green-600 text-white border border-green-600 shadow-sm transition-all animate-fade-in"
                >
                    <CheckIcon className="w-4 h-4 text-white animate-bounce" />
                    <span>{copyHighlightedToast || 'تم النسخ!'}</span>
                </button>
            );
        }

        if (copyHighlightedMode === 1) {
            return (
                <button 
                    onClick={onCopyHighlightedWords} 
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm transition-all focus:ring-2 focus:ring-blue-400"
                    title="النمط 2: سيتم النسخ مع عدد التكرار (انقر للتغيير للنمط 3)"
                >
                    <DocumentDuplicateIcon className="w-4 h-4 text-white" />
                    <span>نسخ الكلمات + التكرار (2/3)</span>
                </button>
            );
        }

        if (copyHighlightedMode === 2) {
            return (
                <button 
                    onClick={onCopyHighlightedWords} 
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white border border-purple-600 shadow-sm transition-all focus:ring-2 focus:ring-purple-400"
                    title="النمط 3: سيتم النسخ مرتبة بالأكثر تكراراً (انقر للعودة للنمط 1)"
                >
                    <DocumentDuplicateIcon className="w-4 h-4 text-white" />
                    <span>نسخ بالأكثر تكراراً (3/3)</span>
                </button>
            );
        }

        // Default Mode 0
        return (
            <button 
                onClick={onCopyHighlightedWords} 
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/70 shadow-2xs transition-all focus:ring-2 focus:ring-amber-400"
                title="النمط 1: سيتم النسخ بدون عدد التكرار (انقر للتغيير للنمط 2)"
            >
                <DocumentDuplicateIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>نسخ الكلمات (1/3)</span>
            </button>
        );
    };
    return (
        <div className="flex items-center flex-wrap gap-2 my-6 p-3 bg-surface-subtle rounded-lg border border-border-default w-full max-w-full overflow-hidden">
            <span className="text-sm font-semibold text-text-muted ml-2">أدوات النتائج:</span>
            <div className="flex flex-wrap items-center gap-2 border border-border-default rounded-2xl sm:rounded-full bg-surface p-1 shadow-sm max-w-full">
                <button onClick={onPlayAll} disabled={isPlaybackLoading || allAudioEditions.length === 0} className="flex items-center gap-2 px-3 py-1 rounded-full text-sm text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                    {isPlaybackLoading ? <SpinnerIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                    <span>{isPlaybackLoading ? 'تحضير...' : 'تشغيل الكل'}</span>
                </button>
                <div className="border-l border-border-default h-5"></div>
                <div className="min-w-0">
                    <AudioEditionSelector 
                        audioEditions={allAudioEditions}
                        selectedAudioEdition={selectedAudioEdition}
                        onSelect={onAudioEditionChange}
                        size="sm"
                    />
                </div>
            </div>
            {searchType === 'text' && (
                <>
                    <button onClick={onSaveSearch} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors">
                        <BookmarkIcon className="w-4 h-4"/>
                        <span>حفظ البحث</span>
                    </button>
                    {onCopyHighlightedWords && getHighlightedCopyButton()}
                </>
            )}
            <button onClick={onCopyAll} disabled={isAllCopied} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors disabled:opacity-70">
                {isAllCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <DocumentDuplicateIcon className="w-4 h-4"/>}
                <span>{isAllCopied ? 'تم النسخ!' : 'نسخ كل النتائج'}</span>
            </button>
            <button onClick={onDownloadAll} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors">
                <DownloadIcon className="w-4 h-4"/>
                <span>تحميل النتائج (txt)</span>
            </button>
        </div>
    );
};

export default SearchResultsToolbar;
