import React from 'react';
import type { Ayah, SurahData, Collections, QuranEdition, SavedItem } from '../types';

import HomeView from './HomeView';
import SurahDetailView from './SurahDetailView';
import { SearchView } from './SearchView';
import SettingsView from './SettingsView';
import SavedView from './SavedView';
import WordAnalysisView from './WordAnalysisView';
import PrivacyPolicyView from './PrivacyPolicyView';
import LoadingScreen from './LoadingScreen';
import AboutView from './AboutView';
import HistoryView from './HistoryView';
import GroupKhatmahView from './khatmiyah/GroupKhatmahView';

import { QURAN_INDEX } from '../quranIndex';
import { JUZ_INDEX, HIZB_INDEX } from '../quranPartitions';
import { useSettingsContext } from '../contexts/SettingsContext';

interface AppRouterProps {
    pathParts: string[];
    queryParams: URLSearchParams;
    isInitialLoading: boolean;
    quranData: SurahData[] | undefined;
    simpleSearchableAyahs: Ayah[];
    collections: Collections;
    allQuranData: { [key: string]: SurahData[] } | null;
    fetchCustomEditionData: (id: string) => void;
    handleDeleteCollection: (id: string) => void;
    handleDeleteSavedItem: (collectionId: string, itemId: string) => void;
    updateItemNotes: (collectionId: string, itemId: string, notes: string) => void;
    handleExportNotebook: () => Promise<string>;
    handleImportNotebook: (code: string) => Promise<void>;
    handleSearch: (query: string, sourceEdition?: string, position?: { surah: number; ayah: number; wordIndex: number; }) => void;
    handleSaveItem: (item: SavedItem) => void;
    handleSearchByAyahNumber: (num: number) => void;
    currentlyPlayingAyahGlobalNumber: number | null;
    playbackInfo: any;
    handleStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
    hizbQuarterStartMap: Map<number, number>;
    setIsSearching: (isSearching: boolean) => void;
    performSearchByAyahNumber: (num: number) => Ayah[];
    performSearch: (query: string, isRootSearch?: boolean) => { results: Ayah[], finalSearchEdition: string, correctedQuery?: string };
    setIsSidePanelOpen?: (open: boolean) => void;
}

const AppRouter: React.FC<AppRouterProps> = (props) => {
    const {
        pathParts, queryParams, isInitialLoading, quranData, simpleSearchableAyahs, collections,
        allQuranData, fetchCustomEditionData,
        handleDeleteCollection, handleDeleteSavedItem, updateItemNotes, handleExportNotebook,
        handleImportNotebook, handleSearch, handleSaveItem,
        handleSearchByAyahNumber, currentlyPlayingAyahGlobalNumber, playbackInfo, handleStartPlayback,
        hizbQuarterStartMap, setIsSearching, performSearchByAyahNumber, performSearch,
        setIsSidePanelOpen
    } = props;

    // Use Context for AudioEditions and selections
    const { selectedAudioEdition, setSelectedAudioEdition } = useSettingsContext();

    // Prepare route info for memoized computations at top level (Rules of Hooks)
    const isSearchPage = pathParts[0] === 'search';
    const isSearchNumber = isSearchPage && pathParts[1] === 'number' && !!pathParts[2];
    const searchNumberVal = isSearchNumber ? parseInt(pathParts[2], 10) : 0;
    const searchQueryVal = isSearchPage && !isSearchNumber ? (pathParts[1] ? decodeURIComponent(pathParts[1]) : "") : "";
    const isRootSearchVal = isSearchPage && !isSearchNumber && queryParams.get('mode') === 'root';

    const searchNumberResults = React.useMemo(() => {
        if (!isSearchNumber) return [] as Ayah[];
        return performSearchByAyahNumber(searchNumberVal);
    }, [performSearchByAyahNumber, isSearchNumber, searchNumberVal]);

    const searchTextResult = React.useMemo(() => {
        if (!isSearchPage || isSearchNumber) return { results: [] as Ayah[], finalSearchEdition: '', correctedQuery: undefined };
        return performSearch(searchQueryVal, isRootSearchVal);
    }, [performSearch, isSearchPage, isSearchNumber, searchQueryVal, isRootSearchVal]);

    if (isInitialLoading) return <LoadingScreen />;
    if (pathParts[0] === 'saved') return <SavedView collections={collections} collectionId={pathParts[1] || null} onDeleteCollection={handleDeleteCollection} onDeleteSavedItem={handleDeleteSavedItem} onUpdateNotes={updateItemNotes} />;
    if (pathParts[0] === 'history') return <HistoryView surahList={QURAN_INDEX} />;
    if (pathParts[0] === 'analysis') return <WordAnalysisView simpleCleanData={allQuranData?.['quran-simple-clean'] || []} initialWord={pathParts[1] ? decodeURIComponent(pathParts[1]) : undefined} />;
    if (pathParts[0] === 'settings') return <SettingsView 
        onExportNotebook={handleExportNotebook} 
        onImportNotebook={handleImportNotebook}
    />;
    if (pathParts[0] === 'khatmah' || pathParts[0] === 'khatmiyah') {
        return <GroupKhatmahView 
            initialKhatmahId={pathParts[1]} 
            onNavigateToJuz={(surah, ayah) => {
                window.location.hash = `#/surah/${surah}?ayah=${ayah}`;
            }} 
        />;
    }
    if (pathParts[0] === 'about') return <AboutView />;
    if (pathParts[0] === 'privacy-policy') return <PrivacyPolicyView />;
    
    // Handle Page Route
    if (pathParts[0] === 'page' && pathParts[1]) {
        if (isInitialLoading || !quranData) {
            return null;
        }
        const pageNumber = parseInt(pathParts[1], 10);
        
        const pageSurahs: SurahData[] = [];
        let startAyahInFirstSurah: number | null = null;

        for (const surah of quranData) {
            const ayahsOnPage = surah.ayahs.filter(a => a.page === pageNumber);
            if (ayahsOnPage.length > 0) {
                pageSurahs.push({ ...surah, ayahs: ayahsOnPage });
                if (startAyahInFirstSurah === null) {
                    startAyahInFirstSurah = ayahsOnPage[0].numberInSurah;
                }
            }
        }

        if (pageSurahs.length > 0) {
            const queryAyah = queryParams.get('ayah') ? parseInt(queryParams.get('ayah')!, 10) : null;
            return <SurahDetailView 
                surah={pageSurahs[0]}
                pageSurahs={pageSurahs}
                highlightAyahNumber={queryAyah !== null ? queryAyah : startAyahInFirstSurah}
                onWordClick={handleSearch}
                onSaveAyah={handleSaveItem}
                onSearchByAyahNumber={handleSearchByAyahNumber}
                currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber}
                onStartPlayback={handleStartPlayback as (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void}
                selectedAudioEdition={selectedAudioEdition}
                simpleCleanData={allQuranData?.['quran-simple-clean'] || []}
                hizbQuarterStartMap={hizbQuarterStartMap}
                forcedPageNumber={pageNumber}
            />;
        } else {
             return <div className="text-center p-10">الصفحة غير موجودة</div>;
        }
    }

    if (pathParts[0] === 'surah' && pathParts[1]) {
        if (isInitialLoading || !quranData) {
            return null;
        }
        const surahNumber = parseInt(pathParts[1], 10);
        const highlightAyahNumber = queryParams.get('ayah') ? parseInt(queryParams.get('ayah')!, 10) : null;
        const surah = quranData.find(s => s.number === surahNumber);
        if (surah) {
            return <SurahDetailView 
                surah={surah}
                highlightAyahNumber={highlightAyahNumber}
                onWordClick={handleSearch}
                onSaveAyah={handleSaveItem}
                onSearchByAyahNumber={handleSearchByAyahNumber}
                currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber}
                onStartPlayback={handleStartPlayback as (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void}
                selectedAudioEdition={selectedAudioEdition}
                simpleCleanData={allQuranData?.['quran-simple-clean'] || []}
                hizbQuarterStartMap={hizbQuarterStartMap}
            />;
        }
    }
    if (pathParts[0] === 'search') {
        const commonProps = {
            onNewSearch: handleSearch, onSearchByAyahNumber: handleSearchByAyahNumber,
            onSearchComplete: () => setIsSearching(false),
            displayEditionData: quranData || [], 
            simpleCleanData: allQuranData?.['quran-simple-clean'] || [],
            onSaveAyah: handleSaveItem, onSaveSearch: handleSaveItem,
            currentlyPlayingAyahGlobalNumber: currentlyPlayingAyahGlobalNumber, isPlaybackLoading: !!playbackInfo?.trigger,
            onStartPlayback: handleStartPlayback,
        };
        if (pathParts[1] === 'number' && pathParts[2]) {
            return <SearchView {...commonProps} query={pathParts[2]} results={searchNumberResults} searchEdition={'quran-simple-clean'} searchType="number" />;
        }
        const query = pathParts[1] ? decodeURIComponent(pathParts[1]) : "";
        const isRootSearch = queryParams.get('mode') === 'root';
        const position = queryParams.get('s') ? { surah: parseInt(queryParams.get('s')!), ayah: parseInt(queryParams.get('a')!), wordIndex: parseInt(queryParams.get('w')!) } : undefined;
        return <SearchView {...commonProps} query={query} results={searchTextResult.results} correctedQuery={searchTextResult.correctedQuery} autoOpenDiscussion={!!queryParams.get('from')} searchEdition={searchTextResult.finalSearchEdition} position={position} isRootSearch={isRootSearch} />;
    }
    return <HomeView surahList={QURAN_INDEX} juzList={JUZ_INDEX} hizbList={HIZB_INDEX} />;
};

export default AppRouter;