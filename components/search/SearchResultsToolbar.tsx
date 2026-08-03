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
    onDownloadAll: () => void;
}

const SearchResultsToolbar: React.FC<SearchResultsToolbarProps> = ({
    isPlaybackLoading, allAudioEditions, onPlayAll, selectedAudioEdition,
    onAudioEditionChange, searchType, onSaveSearch, onCopyAll, isAllCopied,
    onDownloadAll
}) => {
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
                <button onClick={onSaveSearch} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors">
                    <BookmarkIcon className="w-4 h-4"/>
                    <span>حفظ البحث</span>
                </button>
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
