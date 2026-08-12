import React, { useState } from 'react';
import { QURAN_INDEX } from '../quranIndex';
import { formatSurahNameForDisplay } from '../utils/text';
import { BookOpenIcon, SearchIcon, XIcon } from './icons';

interface SurahPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSurah?: (surahNumber: number) => void;
}

const SurahPickerModal: React.FC<SurahPickerModalProps> = ({ isOpen, onClose, onSelectSurah }) => {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredSurahs = QURAN_INDEX.filter(surah => {
        const cleanQuery = searchQuery.trim().toLowerCase();
        if (!cleanQuery) return true;
        const formattedName = formatSurahNameForDisplay(surah.name).toLowerCase();
        const rawName = surah.name.toLowerCase();
        const englishName = (surah.englishName || '').toLowerCase();
        const numStr = String(surah.number);
        return formattedName.includes(cleanQuery) || rawName.includes(cleanQuery) || englishName.includes(cleanQuery) || numStr === cleanQuery;
    });

    const handleSelect = (surahNumber: number) => {
        if (onSelectSurah) {
            onSelectSurah(surahNumber);
        } else {
            window.location.hash = `#/surah/${surahNumber}`;
        }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="surah-picker-title"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-5 sm:p-6 border border-border-default flex flex-col max-h-[85vh] animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-default flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <BookOpenIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="surah-picker-title" className="text-lg font-bold text-text-primary">
                                فهرس سور القرآن الكريم
                            </h2>
                            <p className="text-xs text-text-muted">اختر السورة للانتقال إليها مباشرة</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        aria-label="إغلاق"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="py-3 flex-shrink-0">
                    <div className="relative">
                        <SearchIcon className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            id="surah-picker-search-input"
                            name="surahPickerSearch"
                            aria-label="البحث عن سورة"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="اسم السورة أو رقمها..."
                            className="w-full pr-10 pl-4 py-2 bg-surface-subtle border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Surah List Grid */}
                <div className="overflow-y-auto space-y-1.5 pr-1 my-1 flex-1 min-h-[220px]">
                    {filteredSurahs.length === 0 ? (
                        <div className="text-center py-10 text-text-muted text-sm">
                            لم يتم العثور على سورة بهذا الاسم أو الرقم
                        </div>
                    ) : (
                        filteredSurahs.map((surah) => (
                            <button
                                key={surah.number}
                                onClick={() => handleSelect(surah.number)}
                                className="w-full p-3 rounded-xl border border-border-default/60 hover:border-primary/40 bg-surface-subtle hover:bg-primary/10 transition-all flex items-center justify-between text-right cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        {surah.number}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                                            سورة {formatSurahNameForDisplay(surah.name)}
                                        </div>
                                        <div className="text-[11px] text-text-muted">
                                            {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                    انتقال ←
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-border-default flex-shrink-0 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-surface-subtle border border-border-default font-semibold text-xs text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SurahPickerModal;
