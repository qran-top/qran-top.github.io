import type { FontStyleType, FontSize } from '../types';

export const getQuranTextStyle = (fontStyle: FontStyleType, fontSize: FontSize) => {
    let fontClass = 'imlai-font'; // Default to Imlai 1

    if (fontStyle === 'imlai_2') {
        fontClass = 'scheherazade-font';
    } else if (fontStyle === 'uthmani' || fontStyle === 'mushaf') {
        fontClass = 'uthmani-font';
    }
    
    return {
        className: `${fontClass} quran-text-${fontSize}`,
    };
};
