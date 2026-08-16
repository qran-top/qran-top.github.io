import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Ayah } from '../types';
import { BookmarkIcon, CopyIcon, CheckIcon, PlayIcon, SpeakerWaveIcon } from './icons';

const AyahActionPopover: React.FC<{
    activePopover: { ayah: Ayah; triggerElement: HTMLElement };
    onClose: () => void;
    onSave: (ayah: Ayah) => void;
    onCopy: (ayah: Ayah) => void;
    onSearchText?: (ayah: Ayah) => void;
    onSearchNumber?: (num: number) => void;
    onPlayFrom?: (ayah: Ayah) => void;
    onSaveStop?: (ayah: Ayah) => void;
    copiedAyah: number | null;
    onStartSelection?: (ayah: Ayah) => void;
}> = ({ activePopover, onClose, onSave, onCopy, onPlayFrom, copiedAyah, onStartSelection }) => {
    
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });

    useLayoutEffect(() => {
        if (popoverRef.current) {
            const popover = popoverRef.current;
            const trigger = activePopover.triggerElement;
            
            const triggerRect = trigger.getBoundingClientRect();
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
    }, [activePopover]);

    return createPortal(
        <div 
            ref={popoverRef} 
            style={style}
            className="popover-content w-[90vw] max-w-max p-1.5 bg-surface rounded-2xl shadow-xl border border-primary/20 flex flex-wrap justify-center items-center gap-1 z-50 animate-fade-in"
            role="dialog"
            aria-label="إجراءات الآية"
        >
            {onStartSelection && (
                <>
                    <button 
                        onClick={() => { onStartSelection(activePopover.ayah); onClose(); }} 
                        className="p-1.5 sm:p-2.5 rounded-xl text-text-subtle hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" 
                        title="تحديد أكثر من آية للنسخ"
                    >
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold">تحديد</span>
                    </button>
                    <div className="hidden sm:block w-px h-5 bg-border-default"></div>
                </>
            )}
            {onPlayFrom && (
                <>
                    <button 
                        onClick={() => { onPlayFrom(activePopover.ayah); onClose(); }} 
                        className="p-1.5 sm:p-2.5 rounded-xl text-text-subtle hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" 
                        title="استمرار التلاوة من هذه الآية"
                    >
                        <PlayIcon className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold">تلاوة</span>
                    </button>
                    <div className="hidden sm:block w-px h-5 bg-border-default"></div>
                </>
            )}
            <button onClick={() => { onCopy(activePopover.ayah); }} className="p-1.5 sm:p-2.5 rounded-xl text-text-subtle hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-1 cursor-pointer" title="نسخ الآية مع المرجع">
              {copiedAyah === activePopover.ayah.number ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
              <span className="text-xs font-semibold px-1">نسخ</span>
            </button>
            <div className="hidden sm:block w-px h-5 bg-border-default"></div>
            <button onClick={() => { onSave(activePopover.ayah); }} className="p-1.5 sm:p-2.5 rounded-xl text-text-subtle hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-1 cursor-pointer" title="حفظ الآية في دفتر التدبر">
              <BookmarkIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold px-1">حفظ</span>
            </button>
        </div>,
        document.body
      );
};

export default AyahActionPopover;

