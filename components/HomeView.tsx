import React, { useState } from 'react';
import type { SurahReference } from '../types';
import SurahListItem from './SurahListItem';
import IndexItem from './IndexItem';
import { BookOpenIcon, QueueListIcon, JuzOneIcon, PaperIcon } from './icons';
import { safeLocalStorage } from '../utils/storage';
import { formatSurahNameForDisplay } from '../utils/text';
import { useSettingsContext } from '../contexts/SettingsContext';

interface HomeViewProps {
  surahList: SurahReference[];
  juzList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
  hizbList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
}

type ActiveTab = 'surahs' | 'juz' | 'hizbs' | 'pages';

const HomeView: React.FC<HomeViewProps> = ({ surahList, juzList, hizbList }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('surahs');
  const { setFontStyle, setSelectedEdition, setBrowsingMode } = useSettingsContext();

  const enableUthmaniPageMode = () => {
    setFontStyle('uthmani');
    setSelectedEdition('quran-uthmani-quran-academy');
    setBrowsingMode('page');
  };

  const [lastRead] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('qran_last_read_position');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse last read position", e);
    }
    return null;
  });

  const [isLastReadDismissed, setIsLastReadDismissed] = useState(() => {
    try {
      if (!lastRead) return false;
      const dismissedTs = safeLocalStorage.getItem('qran_last_read_dismissed_ts');
      if (dismissedTs && parseInt(dismissedTs, 10) === lastRead.timestamp) {
        return true;
      }
    } catch (e) {
      console.error("Failed to parse dismissed timestamp", e);
    }
    return false;
  });

  const lastReadSurah = lastRead && surahList.find(s => s.number === lastRead.surahNumber);

  const TabButton: React.FC<{ tab: ActiveTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm md:text-lg font-semibold transition-all duration-200 border-b-4 ${
        activeTab === tab
          ? 'text-primary border-primary'
          : 'text-text-muted border-transparent hover:text-text-primary hover:border-border-default'
      }`}
      aria-current={activeTab === tab}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'pages':
        return Array.from({ length: 604 }, (_, i) => i + 1).map(pageNumber => (
            <li key={`page-${pageNumber}`}>
                <a
                    href={`#/page/${pageNumber}`}
                    onClick={(e) => {
                        e.preventDefault();
                        enableUthmaniPageMode();
                        window.location.hash = `#/page/${pageNumber}`;
                    }}
                    className="flex items-center justify-center p-3 bg-surface rounded-md shadow-sm hover:shadow-md hover:bg-surface-hover hover:border-primary transition-all duration-200 cursor-pointer border border-border-subtle h-full"
                    aria-label={`صفحة ${pageNumber}`}
                >
                    <span className="text-lg font-bold text-text-primary">{pageNumber}</span>
                </a>
            </li>
        ));
      case 'juz':
        return juzList.map(juz => (
          <IndexItem
            key={`juz-${juz.number}`}
            type="الجزء"
            number={juz.number}
            startSurah={juz.startSurah}
            startAyah={juz.startAyah}
            startSurahName={juz.startSurahName}
          />
        ));
      case 'hizbs':
        return hizbList.map(hizb => (
          <IndexItem
            key={`hizb-${hizb.number}`}
            type="الحزب"
            number={hizb.number}
            startSurah={hizb.startSurah}
            startAyah={hizb.startAyah}
            startSurahName={hizb.startSurahName}
          />
        ));
      case 'surahs':
      default:
        return surahList.map(surah => (
          <SurahListItem key={surah.number} surah={surah} />
        ));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 animate-fade-in">
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-default overflow-hidden">
        <div className="flex items-stretch overflow-x-auto">
            <TabButton tab="surahs" label="السور" icon={<BookOpenIcon className="w-5 h-5"/>} />
            <TabButton tab="pages" label="صفحات" icon={<PaperIcon className="w-5 h-5"/>} />
            <TabButton tab="juz" label="الأجزاء" icon={<JuzOneIcon className="w-5 h-5"/>} />
            <TabButton tab="hizbs" label="الأحزاب" icon={<QueueListIcon className="w-5 h-5"/>} />
        </div>
      </div>

      <div className="animate-fade-in">
        <ul className={`grid gap-3 ${
          activeTab === 'pages' 
            ? 'grid-cols-4 min-[450px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10' 
            : 'grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        }`}>
            {renderContent()}
        </ul>
      </div>
    </div>
  );
};

export default HomeView;