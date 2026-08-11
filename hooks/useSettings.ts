import { useState, useEffect, useMemo } from 'react';
import type { QuranEdition, QuranFont, FontSize, BrowsingMode, FontStyleType, WordClickBehavior } from '../types';

const QURAN_EDITION_KEY = 'qran_app_edition';
const FONT_SIZE_KEY = 'qran_app_font_size';
const FONT_STYLE_KEY = 'qran_app_font_style';
const AUDIO_EDITION_KEY = 'qran_app_audio_edition';
const BROWSING_MODE_KEY = 'qran_app_browsing_mode';
const TAJWEED_MODE_KEY = 'qran_app_enable_tajweed';
const WORD_AUDIO_KEY = 'qran_app_enable_word_audio';
const WORD_CLICK_BEHAVIOR_KEY = 'qran_app_word_click_behavior';
const ENABLE_MORPHOLOGY_KEY = 'qran_app_enable_morphology';

const DEFAULT_EDITIONS: QuranEdition[] = [
    { identifier: "quran-simple-clean", language: "ar", name: "المصحف المبسط", englishName: "Simple Clean", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" },
    { identifier: "quran-uthmani-quran-academy", language: "ar", name: "الرسم العثماني", englishName: "Uthmani (Quran Academy)", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" }
];

export const useSettings = () => {
    const safeGetItem = (key: string, defaultValue: any) => {
        try {
            return localStorage.getItem(key) || defaultValue;
        } catch (e) {
            return defaultValue;
        }
    };

    const safeSetItem = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    };

    const [fontSize, setFontSize] = useState<FontSize>(() => safeGetItem(FONT_SIZE_KEY, 'md') as FontSize);
    
    // Default to 'imlai_1' (System Font) for maximum performance on first load
    const [fontStyle, setFontStyle] = useState<FontStyleType>(
        () => safeGetItem(FONT_STYLE_KEY, 'imlai_1') as FontStyleType
    );

    // Default to 'quran-simple-clean' which is loaded instantly from GCS
    const [selectedEdition, setSelectedEdition] = useState<string>(
        () => safeGetItem(QURAN_EDITION_KEY, 'quran-simple-clean')
    );
    
    // Default to 'full' mode as it pairs with simple text
    const [browsingMode, setBrowsingMode] = useState<BrowsingMode>(() => {
        const storedMode = safeGetItem(BROWSING_MODE_KEY, null) as BrowsingMode | null;
        if (storedMode) return storedMode;
        return 'full';
    });

    const activeEditions = DEFAULT_EDITIONS;

    const [selectedAudioEdition, setSelectedAudioEdition] = useState<string>(
        () => safeGetItem(AUDIO_EDITION_KEY, 'ar.muhammadayyoub')
    );

    const [enableTajweed, setEnableTajweed] = useState<boolean>(
        () => safeGetItem(TAJWEED_MODE_KEY, 'false') === 'true'
    );

    const [enableWordAudio, setEnableWordAudio] = useState<boolean>(
        () => safeGetItem(WORD_AUDIO_KEY, 'true') === 'true'
    );

    const [wordClickBehavior, setWordClickBehavior] = useState<WordClickBehavior>(
        () => safeGetItem(WORD_CLICK_BEHAVIOR_KEY, 'auto') as WordClickBehavior
    );

    const [enableMorphology, setEnableMorphology] = useState<boolean>(
        () => safeGetItem(ENABLE_MORPHOLOGY_KEY, 'true') === 'true'
    );

    useEffect(() => { safeSetItem(QURAN_EDITION_KEY, selectedEdition); }, [selectedEdition]);
    useEffect(() => { safeSetItem(FONT_SIZE_KEY, fontSize); }, [fontSize]);
    useEffect(() => { safeSetItem(FONT_STYLE_KEY, fontStyle); }, [fontStyle]);
    useEffect(() => { safeSetItem(BROWSING_MODE_KEY, browsingMode); }, [browsingMode]);
    useEffect(() => { safeSetItem(AUDIO_EDITION_KEY, selectedAudioEdition); }, [selectedAudioEdition]);
    useEffect(() => { safeSetItem(TAJWEED_MODE_KEY, String(enableTajweed)); }, [enableTajweed]);
    useEffect(() => { safeSetItem(WORD_AUDIO_KEY, String(enableWordAudio)); }, [enableWordAudio]);
    useEffect(() => { safeSetItem(WORD_CLICK_BEHAVIOR_KEY, wordClickBehavior); }, [wordClickBehavior]);
    useEffect(() => { safeSetItem(ENABLE_MORPHOLOGY_KEY, String(enableMorphology)); }, [enableMorphology]);

    const displayEdition = useMemo(() => {
        const found = activeEditions.find(e => e.identifier === selectedEdition) || DEFAULT_EDITIONS[0];
        if (found.name.includes('القرآن الكريم')) {
            return { ...found, name: found.name.replace(/القرآن الكريم/g, 'المصحف الشريف') };
        }
        return found;
    }, [activeEditions, selectedEdition]);

    return {
        fontSize, setFontSize,
        fontStyle, setFontStyle,
        browsingMode, setBrowsingMode,
        activeEditions,
        selectedEdition, setSelectedEdition,
        selectedAudioEdition, setSelectedAudioEdition,
        enableTajweed, setEnableTajweed,
        enableWordAudio, setEnableWordAudio,
        wordClickBehavior, setWordClickBehavior,
        enableMorphology, setEnableMorphology,
        displayEdition
    };
};
