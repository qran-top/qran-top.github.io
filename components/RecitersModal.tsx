import React, { useState } from 'react';
import { ALL_AUDIO_EDITIONS } from '../data/audioEditions';
import { useSettingsContext } from '../contexts/SettingsContext';
import { SpeakerWaveIcon, SearchIcon, CheckIcon, XIcon } from './icons';

interface RecitersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectReciter?: (reciterIdentifier: string) => void;
}

const RecitersModal: React.FC<RecitersModalProps> = ({ isOpen, onClose, onSelectReciter }) => {
    const { selectedAudioEdition, setSelectedAudioEdition } = useSettingsContext();
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredReciters = ALL_AUDIO_EDITIONS.filter(r => 
        r.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        r.englishName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    const handleSelect = (identifier: string) => {
        setSelectedAudioEdition(identifier);
        if (onSelectReciter) {
            onSelectReciter(identifier);
        }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reciters-modal-title"
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
                            <SpeakerWaveIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="reciters-modal-title" className="text-lg font-bold text-text-primary">
                                قائمة الأئمة والقراء
                            </h2>
                            <p className="text-xs text-text-muted">اختر القارئ المفضل للاستماع للتلاوة العطرة</p>
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
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن إمام أو قارئ..."
                            className="w-full pr-10 pl-4 py-2 bg-surface-subtle border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Reciter List */}
                <div className="overflow-y-auto space-y-2 pr-1 my-1 flex-1 min-h-[200px]">
                    {filteredReciters.length === 0 ? (
                        <div className="text-center py-10 text-text-muted text-sm">
                            لم يتم العثور على قارئ بهذا الاسم
                        </div>
                    ) : (
                        filteredReciters.map((reciter) => {
                            const isSelected = selectedAudioEdition === reciter.identifier;
                            return (
                                <button
                                    key={reciter.identifier}
                                    onClick={() => handleSelect(reciter.identifier)}
                                    className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                                        isSelected
                                            ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                                            : 'bg-surface-subtle border-border-default/60 hover:bg-surface-hover hover:border-primary/40 text-text-primary'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isSelected ? 'bg-primary text-white' : 'bg-surface text-text-muted border border-border-default'
                                        }`}>
                                            🕌
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">{reciter.name}</div>
                                            <div className="text-xs opacity-75 font-sans" dir="ltr">{reciter.englishName}</div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })
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

export default RecitersModal;
