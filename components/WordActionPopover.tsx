import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { SearchIcon, SpeakerWaveIcon, SparklesIcon, ClearIcon } from './icons';

interface WordActionPopoverProps {
    word: string;
    surahNumber: number;
    surahName?: string;
    ayahNumberInSurah: number;
    wordIndex: number;
    triggerElement: HTMLElement;
    enableWordAudio: boolean;
    enableMorphology: boolean;
    onClose: () => void;
    onSearchWord: (cleanWord: string) => void;
    onPlayAudio: () => void;
    onOpenMorphology: () => void;
}

const WordActionPopover: React.FC<WordActionPopoverProps> = ({
    word,
    surahNumber,
    surahName,
    ayahNumberInSurah,
    triggerElement,
    enableWordAudio,
    enableMorphology,
    onClose,
    onSearchWord,
    onPlayAudio,
    onOpenMorphology
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });

    // Clean word for search
    const cleanWordForSearch = word
        .replace(/<[^>]*>/g, '')
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .trim();

    useLayoutEffect(() => {
        if (popoverRef.current && triggerElement) {
            const popover = popoverRef.current;
            const triggerRect = triggerElement.getBoundingClientRect();
            const popoverWidth = popover.offsetWidth;
            const popoverHeight = popover.offsetHeight;
            const viewportWidth = window.innerWidth;
            const margin = 10;

            let left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (popoverWidth / 2);
            if (left < margin) {
                left = margin;
            } else if (left + popoverWidth > (viewportWidth - margin)) {
                left = viewportWidth - popoverWidth - margin;
            }

            let top = triggerRect.top + window.scrollY - popoverHeight - margin;
            if (top < window.scrollY + margin) {
                top = triggerRect.bottom + window.scrollY + margin;
            }

            setStyle({
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                opacity: 1,
                pointerEvents: 'auto',
            });
        }
    }, [triggerElement]);

    return createPortal(
        <div 
            ref={popoverRef}
            style={style}
            className="z-50 bg-surface rounded-2xl shadow-xl border border-primary/30 p-2.5 sm:p-3 w-64 sm:w-72 animate-fade-in text-text-primary backdrop-blur-md"
            role="dialog"
            aria-label={`خيارات الكلمة: ${cleanWordForSearch}`}
        >
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default px-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="font-bold text-primary text-base font-quran-title truncate">
                        ﴿{cleanWordForSearch}﴾
                    </span>
                    <span className="text-[11px] text-text-muted bg-primary/10 px-2 py-0.5 rounded-full font-mono">
                        {surahName ? surahName : `سورة ${surahNumber}`}:{ayahNumberInSurah}
                    </span>
                </div>
                <button 
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-hover transition-colors"
                    title="إغلاق"
                >
                    <ClearIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Actions List */}
            <div className="space-y-1 text-xs">
                {/* 1. Direct Search */}
                <button
                    onClick={() => {
                        onSearchWord(cleanWordForSearch);
                        onClose();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-right hover:bg-primary/10 hover:text-primary transition-colors font-medium cursor-pointer"
                >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <SearchIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-bold">بحث عن الكلمة والمثاني</div>
                        <div className="text-[10px] text-text-muted">البحث عن تكرارات الكلمة في القرآن الكريم</div>
                    </div>
                </button>

                {/* 2. Grammar & Morphology */}
                {enableMorphology && (
                    <button
                        onClick={() => {
                            onOpenMorphology();
                            onClose();
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-right hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium cursor-pointer"
                    >
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <SparklesIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="font-bold">التحليل الصرفي والإعراب</div>
                            <div className="text-[10px] text-text-muted">عرض الجذر ونوع الكلمة والإعراب التفصيلي</div>
                        </div>
                    </button>
                )}

                {/* 3. Audio Pronunciation */}
                {enableWordAudio && (
                    <button
                        onClick={() => {
                            onPlayAudio();
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-right hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium cursor-pointer"
                    >
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <SpeakerWaveIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="font-bold">استماع لنطق الكلمة المرتل</div>
                            <div className="text-[10px] text-text-muted">نطق بصوت واضح ومرتل للكلمة المفردة</div>
                        </div>
                    </button>
                )}
            </div>
        </div>,
        document.body
    );
};

export default WordActionPopover;
