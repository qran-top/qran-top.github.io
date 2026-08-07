import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Ayah } from '../types';
import { BookmarkIcon, CopyIcon, CheckIcon } from './icons';

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
}> = ({ activePopover, onClose, onSave, onCopy, copiedAyah }) => {
    
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
            className="popover-content w-max p-1 bg-surface rounded-full shadow-lg border border-border-default flex items-center gap-1 z-50 animate-fade-in"
            role="dialog"
            aria-label="إجراءات الآية"
        >
            <button onClick={() => { onCopy(activePopover.ayah); }} className="p-2.5 rounded-full text-text-subtle hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-1" title="نسخ الآية مع المرجع">
              {copiedAyah === activePopover.ayah.number ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
              <span className="text-xs font-semibold px-1">نسخ</span>
            </button>
            <div className="w-px h-5 bg-border-default"></div>
            <button onClick={() => { onSave(activePopover.ayah); }} className="p-2.5 rounded-full text-text-subtle hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-1" title="حفظ الآية في دفتر التدبر">
              <BookmarkIcon className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold px-1">حفظ في الدفتر</span>
            </button>
        </div>,
        document.body
      );
};

export default AyahActionPopover;
