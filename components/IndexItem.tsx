import React from 'react';
import { formatSurahNameForDisplay } from '../utils/text';
import { useSettingsContext } from '../contexts/SettingsContext';

interface IndexItemProps {
  type: 'الجزء' | 'الحزب';
  number: number;
  startSurah: number;
  startAyah: number;
  startSurahName: string;
}

const IndexItem: React.FC<IndexItemProps> = ({ type, number, startSurah, startAyah, startSurahName }) => {
  const { setFontStyle, setSelectedEdition, setBrowsingMode } = useSettingsContext();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setFontStyle('uthmani');
    setSelectedEdition('quran-uthmani-quran-academy');
    setBrowsingMode('page');
    const targetHash = e.currentTarget.getAttribute('href');
    if (targetHash) {
      window.location.hash = targetHash;
    }
  };

  return (
    <li>
      <a
        href={`#/surah/${startSurah}?ayah=${startAyah}`}
        onClick={handleClick}
        className="flex items-center gap-2 p-2 bg-surface rounded-md shadow-sm hover:shadow-md hover:bg-surface-hover transition-all duration-200 cursor-pointer border border-border-subtle h-full flex-col text-center"
        aria-label={`${type} ${number}`}
      >
        <div className="flex-grow min-w-0 py-2">
            <span className="text-md text-text-primary font-bold block">
                {type} {number}
            </span>
            <span className="text-xs text-text-muted font-semibold block mt-1" title={startSurahName}>
                يبدأ من سورة {formatSurahNameForDisplay(startSurahName)}
            </span>
        </div>
      </a>
    </li>
  );
};

export default IndexItem;
