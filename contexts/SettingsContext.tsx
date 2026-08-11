import React, { createContext, useContext } from 'react';
import type { FontSize, FontStyleType, BrowsingMode, QuranEdition, WordClickBehavior } from '../types';

interface SettingsContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    fontStyle: FontStyleType;
    setFontStyle: (style: FontStyleType) => void;
    browsingMode: BrowsingMode;
    setBrowsingMode: (mode: BrowsingMode) => void;
    activeEditions: QuranEdition[];
    selectedEdition: string;
    setSelectedEdition: (id: string) => void;
    selectedAudioEdition: string;
    setSelectedAudioEdition: (id: string) => void;
    enableTajweed: boolean;
    setEnableTajweed: (enabled: boolean) => void;
    enableWordAudio: boolean;
    setEnableWordAudio: (enabled: boolean) => void;
    wordClickBehavior: WordClickBehavior;
    setWordClickBehavior: (behavior: WordClickBehavior) => void;
    enableMorphology: boolean;
    setEnableMorphology: (enabled: boolean) => void;
    displayEdition: QuranEdition;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ value: SettingsContextType, children: React.ReactNode }> = ({ value, children }) => {
    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};