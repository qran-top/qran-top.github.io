import React, { useState } from 'react';
import { ClearIcon } from '../icons';

interface JuzSelectionModalProps {
    onClose: () => void;
    juzStartAyahs: { juz: number, ayahNumber: number }[];
    onJuzSelect: (ayahNumber: number) => void;
    onSelectionConfirm: (selectedJuzs: number[]) => void;
    mode: 'jump' | 'selection';
}

const JuzSelectionModal: React.FC<JuzSelectionModalProps> = ({ onClose, juzStartAyahs, onJuzSelect, onSelectionConfirm, mode }) => {
    const [selectedJuzs, setSelectedJuzs] = useState<number[]>([]);

    const handleJuzClick = (juz: number, ayahNumber: number) => {
        if (mode === 'jump') {
            onJuzSelect(ayahNumber);
            onClose();
        } else { // selection mode
            setSelectedJuzs(prev => 
                prev.includes(juz) ? prev.filter(j => j !== juz) : [...prev, juz]
            );
        }
    };
    
    const handleConfirm = () => {
        if (selectedJuzs.length > 0) {
            onSelectionConfirm(selectedJuzs.sort((a,b) => a-b));
            onClose();
        }
    };

    const title = mode === 'jump' ? "الانتقال إلى جزء" : "اختر الأجزاء";
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100000] flex items-center justify-center animate-fade-in p-3 sm:p-4"
            onClick={onClose}
        >
            <div 
                className="bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-lg mx-auto flex flex-col overflow-hidden max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface-subtle/50">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            {mode === 'jump' ? 'انقر على رقم الجزء للانتقال المباشر' : 'تحديد أجزاء متعددة للقراءة'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full text-text-secondary hover:bg-surface-hover transition-colors">
                        <ClearIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto custom-scrollbar flex-grow min-h-0">
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                        {juzStartAyahs.map(({ juz, ayahNumber }) => {
                            const isSelected = mode === 'selection' && selectedJuzs.includes(juz);
                            return (
                                <button
                                    key={juz}
                                    onClick={() => handleJuzClick(juz, ayahNumber)}
                                    className={`p-2.5 sm:p-3 rounded-xl text-center font-mono font-bold text-base sm:text-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                                        isSelected 
                                            ? 'ring-2 ring-primary bg-primary text-white shadow-sm' 
                                            : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default/50'
                                    }`}
                                >
                                    {juz}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {mode === 'selection' && (
                    <div className="p-4 border-t border-border-default bg-surface">
                        <button 
                            onClick={handleConfirm}
                            disabled={selectedJuzs.length === 0}
                            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm"
                        >
                            بدء التلاوة ({selectedJuzs.length} أجزاء)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JuzSelectionModal;
