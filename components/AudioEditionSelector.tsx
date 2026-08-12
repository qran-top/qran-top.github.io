import React from 'react';
import type { QuranEdition } from '../types';
import { SpeakerWaveIcon } from './icons';

interface AudioEditionSelectorProps {
    audioEditions: QuranEdition[];
    selectedAudioEdition: string;
    onSelect: (identifier: string) => void;
    size?: 'sm' | 'md';
}

const AudioEditionSelector: React.FC<AudioEditionSelectorProps> = ({ audioEditions, selectedAudioEdition, onSelect, size = 'md' }) => {

    if (audioEditions.length === 0) {
        return (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${size === 'sm' ? 'text-sm' : 'text-base'} bg-surface-subtle text-text-muted`}>
                <SpeakerWaveIcon className={size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} />
                <span>لا توجد مصادر صوتية</span>
            </div>
        );
    }
    
    const baseClasses = "appearance-none cursor-pointer w-full rounded-lg text-text-primary border border-border-default focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-colors";
    const sizeClasses = size === 'sm' 
        ? "py-1.5 pr-8 pl-3 text-sm bg-surface"
        : "py-3 pr-12 pl-4 text-base bg-surface border-2 border-primary";
    const iconSizeClasses = size === 'sm' ? "w-4 h-4" : "w-6 h-6";
    
    if (size === 'sm') {
        return (
             <div className="relative bg-surface border border-border-default rounded-full">
                <SpeakerWaveIcon className={`${iconSizeClasses} text-text-subtle pointer-events-none absolute top-1/2 transform -translate-y-1/2 right-3 z-10`} />
                <select 
                    id="audio-edition-compact-select"
                    name="audioEditionCompact"
                    value={selectedAudioEdition} 
                    onChange={(e) => onSelect(e.target.value)} 
                    className="w-full appearance-none cursor-pointer rounded-full bg-transparent py-1.5 pr-10 pl-3 text-sm font-semibold text-text-secondary focus:outline-none"
                    aria-label="اختيار القارئ"
                >
                    {audioEditions.map(edition => (
                        <option key={edition.identifier} value={edition.identifier} className="bg-surface text-text-primary dark:bg-slate-900 dark:text-white py-2">
                            {edition.name}
                        </option>
                    ))}
                </select>
            </div>
        )
    }

    return (
        <div className="relative">
            <SpeakerWaveIcon className={`${iconSizeClasses} text-text-subtle pointer-events-none absolute top-1/2 transform -translate-y-1/2 right-4 z-10`} />
            <select 
                id="audio-edition-select"
                name="audioEdition"
                value={selectedAudioEdition} 
                onChange={(e) => onSelect(e.target.value)} 
                className={`${baseClasses} ${sizeClasses}`}
                aria-label="اختيار القارئ"
            >
                {audioEditions.map(edition => (
                    <option key={edition.identifier} value={edition.identifier} className="bg-surface text-text-primary dark:bg-slate-900 dark:text-white py-2">
                        {edition.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default AudioEditionSelector;