import React, { useState, useMemo } from 'react';
import { ClearIcon, SearchIcon } from '../icons';
import { QURAN_INDEX } from '../../quranIndex';
import { formatSurahNameForDisplay, normalizeArabicText } from '../../utils/text';

interface SurahSelectionModalProps {
    onClose: () => void;
    onSurahSelect?: (surahNumber: number) => void;
    onSelectionConfirm?: (selectedSurahs: number[]) => void;
    mode?: 'jump' | 'selection';
}

const SurahSelectionModal: React.FC<SurahSelectionModalProps> = ({ 
    onClose, 
    onSurahSelect, 
    onSelectionConfirm, 
    mode = 'jump' 
}) => {
    const [selectedSurahs, setSelectedSurahs] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentMode, setCurrentMode] = useState<'jump' | 'selection'>(mode);

    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return QURAN_INDEX;
        const normalizedQuery = normalizeArabicText(searchQuery.toLowerCase());
        
        return QURAN_INDEX.filter(surah => {
            const numStr = surah.number.toString();
            const displayName = formatSurahNameForDisplay(surah.name);
            const normalizedDisplayName = normalizeArabicText(displayName);
            const normalizedRawName = normalizeArabicText(surah.name);
            const engName = surah.englishName ? surah.englishName.toLowerCase() : '';

            return (
                numStr.includes(normalizedQuery) ||
                normalizedDisplayName.includes(normalizedQuery) ||
                normalizedRawName.includes(normalizedQuery) ||
                engName.includes(normalizedQuery)
            );
        });
    }, [searchQuery]);

    const handleSurahClick = (surahNumber: number) => {
        if (currentMode === 'jump') {
            if (onSurahSelect) {
                onSurahSelect(surahNumber);
            }
            onClose();
        } else {
            setSelectedSurahs(prev => 
                prev.includes(surahNumber) 
                    ? prev.filter(s => s !== surahNumber) 
                    : [...prev, surahNumber]
            );
        }
    };
    
    const handleConfirm = () => {
        if (selectedSurahs.length > 0 && onSelectionConfirm) {
            onSelectionConfirm(selectedSurahs.sort((a, b) => a - b));
            onClose();
        }
    };

    const modalTitle = currentMode === 'jump' ? 'اختر السورة للقفز إليها' : 'اختر السور لقراءتها';

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100000] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-surface border border-border-default/80 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 p-3.5 sm:p-4 border-b border-border-default flex justify-between items-center bg-surface-subtle/50">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
                            <span>{modalTitle}</span>
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            {currentMode === 'jump' ? 'انقر على أي سورة للنتقال الفوري' : 'يمكنك اختيار سورة واحدة أو أكثر'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentMode(prev => prev === 'jump' ? 'selection' : 'jump')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors"
                            title={currentMode === 'jump' ? 'التحويل لاختيار متعدد' : 'التحويل للقفز السريع'}
                        >
                            {currentMode === 'jump' ? 'تحديد متعدد' : 'قفز سريع'}
                        </button>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 rounded-full text-text-secondary hover:bg-surface-hover transition-colors"
                            aria-label="إغلاق"
                        >
                            <ClearIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border-default/60 bg-surface">
                    <div className="relative flex items-center">
                        <SearchIcon className="w-5 h-5 absolute right-3 text-text-muted pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث باسم السورة أو رقمها (مثال: البقرة، 36)..."
                            className="w-full pl-9 pr-10 py-2.5 bg-surface-subtle border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute left-3 text-text-muted hover:text-text-primary p-1"
                                title="مسح البحث"
                            >
                                <ClearIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Surahs List Grid */}
                <div className="flex-grow min-h-0 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-background/50">
                    {filteredSurahs.length === 0 ? (
                        <div className="text-center py-10 text-text-muted">
                            <p className="text-sm font-semibold">لم يتم العثور على أي سورة مطابقة للبحث "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                            {filteredSurahs.map(surah => {
                                const isSelected = currentMode === 'selection' && selectedSurahs.includes(surah.number);
                                const displayName = formatSurahNameForDisplay(surah.name);
                                const revTypeArabic = surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';

                                return (
                                    <button
                                        key={surah.number}
                                        onClick={() => handleSurahClick(surah.number)}
                                        className={`p-2.5 sm:p-3 rounded-xl text-right flex items-center justify-between transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-primary ${
                                            isSelected 
                                                ? 'bg-primary/15 border-primary ring-1 ring-primary text-primary-text-strong shadow-sm' 
                                                : 'bg-surface border-border-default/60 hover:bg-surface-hover hover:border-primary/50 text-text-primary'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                                isSelected ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary border border-border-default/40'
                                            }`}>
                                                {surah.number}
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm sm:text-base text-text-primary truncate">
                                                    سورة {displayName}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[11px] text-text-muted font-medium mt-0.5">
                                                    <span>{surah.numberOfAyahs} آية</span>
                                                    <span className="opacity-40">•</span>
                                                    <span>{revTypeArabic}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer (if selection mode) */}
                {currentMode === 'selection' && (
                    <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border-default bg-surface flex items-center gap-3">
                        <button 
                            onClick={handleConfirm}
                            disabled={selectedSurahs.length === 0}
                            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm"
                        >
                            بدء التلاوة ({selectedSurahs.length} سور)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SurahSelectionModal;
