import React from 'react';
import { createPortal } from 'react-dom';
import type { FontSize, FontStyleType } from '../../types';
import { ClearIcon, TextSizeIcon, BookOpenIcon } from '../icons';

interface SettingsModalProps {
    onClose: () => void;
    fontSize: FontSize; 
    onFontSizeChange: (s: FontSize) => void;
    fontStyle: FontStyleType;
    onFontStyleChange: (style: FontStyleType) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, fontSize, onFontSizeChange, fontStyle, onFontStyleChange }) => {
    const fontSizes: { label: string, size: FontSize, className: string }[] = [
        { label: 'صغير جداً', size: 'xs', className: 'text-xs' },
        { label: 'صغير', size: 'sm', className: 'text-sm' },
        { label: 'متوسط', size: 'md', className: 'text-base' },
        { label: 'كبير', size: 'lg', className: 'text-lg' },
        { label: 'كبير جداً', size: 'xl', className: 'text-xl' },
        { label: 'الأكبر', size: 'xxl', className: 'text-2xl' }
    ];

    return createPortal(
        <div className="fixed inset-0 bg-black/80 z-[999999] flex items-end sm:items-center justify-center animate-fade-in p-2 sm:p-4" onClick={onClose}>
            <div 
                className="bg-surface border border-border-default rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col max-h-[85vh] transition-all overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-4 border-b border-border-default flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-primary">إعدادات العرض</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover"><ClearIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="overflow-y-auto p-4">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-md font-semibold text-text-secondary mb-2 flex items-center gap-2"><TextSizeIcon className="w-5 h-5"/> حجم الخط</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-2 bg-surface-subtle rounded-lg">
                                {fontSizes.map(fs => (
                                    <button 
                                        key={fs.size} 
                                        onClick={() => onFontSizeChange(fs.size)} 
                                        className={`px-4 py-2 rounded-md font-bold ${fs.className} ${fontSize === fs.size ? 'bg-primary text-white' : 'hover:bg-surface-hover'}`}
                                        title={fs.label}
                                    >
                                        أ
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-semibold text-text-secondary mb-2 flex items-center gap-2"><BookOpenIcon className="w-5 h-5"/> نمط العرض</h3>
                             <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => onFontStyleChange('imlai_1')} className={`p-3 rounded-lg text-center font-semibold ${fontStyle === 'imlai_1' ? 'bg-surface-active ring-2 ring-primary' : 'bg-surface-subtle hover:bg-surface-hover'}`}>
                                    <span>إملائي 1 (نظام)</span>
                                </button>
                                <button onClick={() => onFontStyleChange('imlai_2')} className={`p-3 rounded-lg text-center font-semibold ${fontStyle === 'imlai_2' ? 'bg-surface-active ring-2 ring-primary' : 'bg-surface-subtle hover:bg-surface-hover'}`}>
                                    <span>إملائي 2 (شهرزاد)</span>
                                </button>
                                <button onClick={() => onFontStyleChange('uthmani')} className={`p-3 rounded-lg text-center font-semibold ${fontStyle === 'uthmani' ? 'bg-surface-active ring-2 ring-primary' : 'bg-surface-subtle hover:bg-surface-hover'}`}>
                                    <span>عثماني</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}

export default SettingsModal;
