import React from 'react';
import { PlusIcon } from '../icons';

interface NeighboringWordsProps {
    neighboringWords: string[];
    visibleSuggestionsCount: number;
    onNeighborClick: (word: string) => void;
    onShowMore: () => void;
}

const NeighboringWords: React.FC<NeighboringWordsProps> = ({ neighboringWords, visibleSuggestionsCount, onNeighborClick, onShowMore }) => {
    if (neighboringWords.length === 0) return null;

    return (
        <div className="mt-4">
            <div className="flex flex-wrap gap-2 justify-center">
                {neighboringWords.slice(0, visibleSuggestionsCount).map(word => (
                    <button
                        key={word}
                        onClick={() => onNeighborClick(word)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-subtle text-text-secondary rounded-full hover:bg-primary/20 hover:text-primary-text-strong transition-all"
                    >
                        <PlusIcon className="w-4 h-4 text-primary-text"/>
                        <span>{word}</span>
                    </button>
                ))}
            </div>
            {neighboringWords.length > visibleSuggestionsCount && (
                <div className="text-center">
                    <button onClick={onShowMore} className="mt-4 text-sm font-semibold text-primary-text hover:underline">
                        عرض المزيد...
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(NeighboringWords);
