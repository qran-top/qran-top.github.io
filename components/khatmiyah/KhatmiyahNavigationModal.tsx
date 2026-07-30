import React, { useState, useMemo } from 'react';
import { ClearIcon, SearchIcon, BookOpenIcon } from '../icons';
import { QURAN_INDEX } from '../../quranIndex';
import { formatSurahNameForDisplay, normalizeArabicText } from '../../utils/text';
import type { PlaybackMode } from '../../types';

interface KhatmiyahNavigationModalProps {
    onClose: () => void;
    onSurahSelect: (surahNumber: number) => void;
    onJuzSelect: (ayahNumber: number) => void;
    juzStartAyahs: { juz: number, ayahNumber: number }[];
    currentSurahNumber?: number;
    currentJuzNumber?: number;
    playbackMode: PlaybackMode;
    onModeChange: (mode: PlaybackMode) => void;
    isLooping: boolean;
    onToggleLooping: () => void;
}

const KhatmiyahNavigationModal: React.FC<KhatmiyahNavigationModalProps> = ({
    onClose,
    onSurahSelect,
    onJuzSelect,
    juzStartAyahs,
    currentSurahNumber,
    currentJuzNumber,
    playbackMode,
    onModeChange,
    isLooping,
    onToggleLooping
}) => {
    const [activeTab, setActiveTab] = useState<'surahs' | 'juzs'>('surahs');
    const [searchQuery, setSearchQuery] = useState('');

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

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-[100000] flex flex-col items-center justify-center p-2.5 sm:p-4 animate-fade-in h-full w-full overflow-hidden"
            onClick={onClose}
        >
            <div 
                className="bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col h-[85%] sm:h-[85vh] max-h-[650px] min-h-[350px] overflow-hidden"
                style={{ height: '85%', maxHeight: '650px', minHeight: '350px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex-shrink-0 p-3.5 sm:p-4 border-b border-border-default flex justify-between items-center bg-surface-subtle/50">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6 text-primary" />
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-text-primary">الانتقال ونطاق التلاوة</h2>
                            <p className="text-[11px] sm:text-xs text-text-muted">اختر السورة أو الجزء للانتقال الفوري وتخصيص القراءة</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-full text-text-secondary hover:bg-surface-hover transition-colors"
                        aria-label="إغلاق"
                    >
                        <ClearIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scope Mode Selection Bar */}
                <div className="flex-shrink-0 p-2 sm:p-2.5 bg-surface border-b border-border-default/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto justify-stretch sm:justify-start">
                        <button
                            onClick={() => onModeChange('continuous')}
                            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs text-center ${
                                playbackMode === 'continuous' && !isLooping
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            📖 ختمة كاملة
                        </button>
                        <button
                            onClick={() => onModeChange('single')}
                            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs text-center ${
                                playbackMode === 'single'
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            📑 الجزء الحالي فقط
                        </button>
                    </div>

                    <button
                        onClick={onToggleLooping}
                        className={`w-full sm:w-auto px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs flex items-center justify-center gap-1.5 ${
                            isLooping
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                        }`}
                        title="تكرار السورة الحالية تلقائياً"
                    >
                        <span>🔁</span>
                        <span>{isLooping ? 'تكرار السورة (مفعل)' : 'تكرار السورة'}</span>
                    </button>
                </div>

                {/* Tabs Bar */}
                <div className="flex-shrink-0 bg-surface border-b border-border-default flex">
                    <button
                        onClick={() => setActiveTab('surahs')}
                        className={`flex-1 py-2.5 sm:py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'surahs'
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                        }`}
                    >
                        <span>قائمة السور (114)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('juzs')}
                        className={`flex-1 py-2.5 sm:py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'juzs'
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                        }`}
                    >
                        <span>قائمة الأجزاء (30)</span>
                    </button>
                </div>

                {/* Tab Content: Surahs */}
                {activeTab === 'surahs' && (
                    <div className="flex-grow flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-background/40">
                        {/* Search Bar */}
                        <div className="flex-shrink-0 p-2.5 sm:p-3 border-b border-border-default/60 bg-surface">
                            <div className="relative flex items-center">
                                <SearchIcon className="w-5 h-5 absolute right-3 text-text-muted pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث باسم السورة أو رقمها (مثال: البقرة، 36، الكهف)..."
                                    className="w-full pl-9 pr-10 py-2 bg-surface-subtle border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute left-3 text-text-muted hover:text-text-primary p-1"
                                    >
                                        <ClearIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Surahs Grid */}
                        <div className="flex-grow min-h-0 p-3 sm:p-4 overflow-y-auto custom-scrollbar">
                            {filteredSurahs.length === 0 ? (
                                <div className="text-center py-10 text-text-muted">
                                    <p className="text-sm font-semibold">لم يتم العثور على سورة باسم "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {filteredSurahs.map(surah => {
                                        const isCurrent = currentSurahNumber === surah.number;
                                        const displayName = formatSurahNameForDisplay(surah.name);
                                        const revTypeArabic = surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';

                                        return (
                                            <button
                                                key={surah.number}
                                                onClick={() => {
                                                    onSurahSelect(surah.number);
                                                    onClose();
                                                }}
                                                className={`p-2.5 rounded-xl text-right flex items-center justify-between transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    isCurrent 
                                                        ? 'bg-primary/15 border-primary ring-1 ring-primary text-primary font-bold shadow-sm' 
                                                        : 'bg-surface border-border-default/60 hover:bg-surface-hover hover:border-primary/50 text-text-primary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                                        isCurrent ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary border border-border-default/40'
                                                    }`}>
                                                        {surah.number}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-sm text-text-primary truncate">
                                                            سورة {displayName}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
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
                    </div>
                )}

                {/* Tab Content: Juzs */}
                {activeTab === 'juzs' && (
                    <div className="flex-grow flex-1 min-h-0 h-full p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-background/40">
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {juzStartAyahs.map(({ juz, ayahNumber }) => {
                                const isCurrent = currentJuzNumber === juz;
                                return (
                                    <button
                                        key={juz}
                                        onClick={() => {
                                            onJuzSelect(ayahNumber);
                                            onClose();
                                        }}
                                        className={`p-3 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                                            isCurrent 
                                                ? 'ring-2 ring-primary bg-primary text-white shadow-md' 
                                                : 'bg-surface hover:bg-surface-hover text-text-primary border border-border-default/60'
                                        }`}
                                    >
                                        <span className="text-xs opacity-80 font-semibold">الجزء</span>
                                        <span className="font-bold text-lg sm:text-xl font-mono">{juz}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KhatmiyahNavigationModal;
