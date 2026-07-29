import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Ayah, QuranEdition, SurahData, FontSize, PlaybackMode, FontStyleType } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAudioKhatmiyah } from '../hooks/useAudioKhatmiyah';
import { 
    SpinnerIcon, PlayIcon, PauseIcon, ForwardIcon, BackwardIcon, 
    HomeIcon, BookOpenIcon, ComputerDesktopIcon, RepeatIcon,
    SunIcon, MoonIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon,
    MenuIcon, ChevronDownIcon
} from './icons';
import AudioEditionSelector from './AudioEditionSelector';
import JuzSelectionModal from './khatmiyah/JuzSelectionModal';
import PlaybackModeModal from './khatmiyah/PlaybackModeModal';
import SettingsModal from './khatmiyah/SettingsModal';
import SurahSelectionModal from './khatmiyah/SurahSelectionModal';
import { QURAN_INDEX } from '../quranIndex';
import { getQuranTextStyle } from '../utils/font';

interface AudioKhatmiyahViewProps {
    allAyahs: Ayah[];
    allAudioEditions: QuranEdition[];
    initialAyahNumber: number;
    onSaveProgress: (ayahNumber: number) => void;
    selectedAudioEdition: string;
    onAudioEditionChange: (id: string) => void;
    allQuranData: { [key: string]: SurahData[] } | null;
    fetchCustomEditionData: (id: string) => void;
    activeEditions: QuranEdition[];
    setIsSidePanelOpen?: (open: boolean) => void;
}

const AudioKhatmiyahView: React.FC<AudioKhatmiyahViewProps> = ({
    allAyahs, allAudioEditions, initialAyahNumber, onSaveProgress,
    selectedAudioEdition, onAudioEditionChange, allQuranData, fetchCustomEditionData,
    activeEditions, setIsSidePanelOpen
}) => {
    const { cycleTheme, isDark } = useTheme();
    
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isJuzSelectorOpen, setIsJuzSelectorOpen] = useState(false);
    const [isSurahSelectorOpen, setIsSurahSelectorOpen] = useState(false);
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
    const [juzModalMode, setJuzModalMode] = useState<'jump' | 'selection'>('jump');
    const [surahModalMode, setSurahModalMode] = useState<'jump' | 'selection'>('jump');
    
    // Fullscreen state management
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);

    // Playback Speed State
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    
    // Local state for display settings
    const [khatmiyahFontStyle, setKhatmiyahFontStyle] = useState<FontStyleType>('imlai_2');
    const [khatmiyahFontSize, setKhatmiyahFontSize] = useState<FontSize>('xxl');
    
    const displayEditionIdentifier = useMemo(() => {
        return khatmiyahFontStyle === 'uthmani' ? 'quran-uthmani-quran-academy' : 'quran-simple-clean';
    }, [khatmiyahFontStyle]);

    const displayEditionDetails = useMemo(() => 
        activeEditions.find(e => e.identifier === displayEditionIdentifier), 
        [activeEditions, displayEditionIdentifier]
    );
    
    const juzStartAyahs = useMemo(() => {
        if (!allAyahs || allAyahs.length === 0) return [];
        const juzMap = new Map<number, number>();
        for (const ayah of allAyahs) {
            if (ayah.juz && !juzMap.has(ayah.juz)) {
                juzMap.set(ayah.juz, ayah.number);
            }
        }
        return Array.from(juzMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([juz, ayahNumber]) => ({ juz, ayahNumber }));
    }, [allAyahs]);

    const {
        audioRef, currentAyah, displayedText, isPlaying, isLoading, isBuffering,
        audioDuration, audioProgress, currentWordIndex,
        handlePlayPause, handleNextAyah, handlePrevAyah, handleAudioEnded,
        setCurrentAyahNumber, setAudioDuration, setIsLoading, setIsBuffering, setIsPlaying,
        playbackMode, setPlaybackMode, 
        playbackJuzSelection, setPlaybackJuzSelection,
        playbackSurahSelection, setPlaybackSurahSelection,
        isLooping, setIsLooping
    } = useAudioKhatmiyah(
        allAyahs, initialAyahNumber, onSaveProgress, selectedAudioEdition, allAudioEditions,
        allQuranData, fetchCustomEditionData, displayEditionIdentifier, juzStartAyahs
    );

    // Unstuck Fullscreen Helper
    const exitFullscreenMode = useCallback(() => {
        const doc = document as any;
        const isCurrentlyNativeFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        if (isCurrentlyNativeFS) {
            const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (exitFS) {
                try { exitFS.call(doc); } catch (e) { /* ignore error */ }
            }
        }
        setIsPseudoFullscreen(false);
        setIsFullscreen(false);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const docEl = document.documentElement as any;
        const doc = document as any;
        const isCurrentlyNativeFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (isFullscreen || isPseudoFullscreen || isCurrentlyNativeFS) {
            exitFullscreenMode();
        } else {
            const reqFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (reqFS) {
                try {
                    const res = reqFS.call(docEl);
                    if (res && res.then) {
                        res.then(() => {
                            setIsFullscreen(true);
                        }).catch(() => {
                            setIsPseudoFullscreen(true);
                            setIsFullscreen(true);
                        });
                    } else {
                        setIsFullscreen(true);
                    }
                } catch (e) {
                    setIsPseudoFullscreen(true);
                    setIsFullscreen(true);
                }
            } else {
                setIsPseudoFullscreen(true);
                setIsFullscreen(true);
            }
        }
    }, [isFullscreen, isPseudoFullscreen, exitFullscreenMode]);

    const handleHomeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        exitFullscreenMode();
        window.location.hash = '#/';
    };

    const handleScreenTap = () => {
        if (isPlaying) setControlsVisible(prev => !prev);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.key === 'Escape') {
                exitFullscreenMode();
            } else if (e.key === ' ') {
                e.preventDefault();
                handlePlayPause();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handlePrevAyah();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleNextAyah();
            } else if (e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        const handleFullscreenChange = () => {
            const doc = document as any;
            const isNativeFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
            if (isNativeFS) {
                setIsFullscreen(true);
            } else if (!isPseudoFullscreen) {
                setIsFullscreen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [exitFullscreenMode, handleNextAyah, handlePlayPause, handlePrevAyah, isPseudoFullscreen, toggleFullscreen]);

    useEffect(() => {
        if (!isPlaying) setControlsVisible(true);
    }, [isPlaying]);

    useEffect(() => {
        if (!allQuranData?.[displayEditionIdentifier]) {
            fetchCustomEditionData(displayEditionIdentifier);
        }
    }, [displayEditionIdentifier, allQuranData, fetchCustomEditionData]);

    const handleSpeedChange = () => {
        const speeds = [1, 1.25, 1.5, 2, 0.75];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackSpeed(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed, currentAyah]);

    const handleJuzSelect = (ayahNumber: number) => {
        setCurrentAyahNumber(ayahNumber);
        setIsJuzSelectorOpen(false);
        if (!isPlaying) setIsPlaying(true);
    };
    
    const handleJuzSelectionConfirm = (selectedJuzs: number[]) => {
        if (selectedJuzs.length === 0) return;
        setPlaybackMode('selection_juz');
        setPlaybackJuzSelection(selectedJuzs);
        setPlaybackSurahSelection(null);
        const startAyahNumber = juzStartAyahs.find(j => j.juz === selectedJuzs[0])?.ayahNumber;
        if (startAyahNumber) {
            setCurrentAyahNumber(startAyahNumber);
        }
        setIsJuzSelectorOpen(false);
        if (!isPlaying) setIsPlaying(true);
    };

    const handleSurahJump = (surahNumber: number) => {
        const firstAyahOfSurah = allAyahs.find(a => a.surah?.number === surahNumber && a.numberInSurah === 1);
        if (firstAyahOfSurah) {
            setCurrentAyahNumber(firstAyahOfSurah.number);
        }
        setIsSurahSelectorOpen(false);
        if (!isPlaying) setIsPlaying(true);
    };

    const handleSurahSelectionConfirm = (selectedSurahs: number[]) => {
        if (selectedSurahs.length === 0) return;
        const sortedSurahs = selectedSurahs.sort((a, b) => a - b);
        setPlaybackMode('selection_surah');
        setPlaybackSurahSelection(sortedSurahs);
        setPlaybackJuzSelection(null);
        
        const firstSurahNumber = sortedSurahs[0];
        const firstAyahOfFirstSurah = allAyahs.find(a => a.surah?.number === firstSurahNumber && a.numberInSurah === 1);
        
        if (firstAyahOfFirstSurah) {
            setCurrentAyahNumber(firstAyahOfFirstSurah.number);
        }
        
        setIsSurahSelectorOpen(false);
        if (!isPlaying) setIsPlaying(true);
    };
    
    const { className: quranTextClass } = getQuranTextStyle(khatmiyahFontStyle, khatmiyahFontSize);
    const canHighlight = displayEditionDetails?.type === 'quran' && displayEditionDetails?.direction === 'rtl';

    const formatJuzSelection = (juzs: number[]): string => {
        if (!juzs || juzs.length === 0) return '';
        if (juzs.length === 1) return `${juzs[0]}`;
        const sorted = [...juzs].sort((a,b) => a - b);
        const ranges: string[] = [];
        let start = sorted[0]; let end = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === end + 1) end = sorted[i];
            else { ranges.push(start === end ? `${start}` : `${start}-${end}`); start = sorted[i]; end = sorted[i]; }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        return ranges.join(', ');
    };

    const getPlaybackScopeDescription = () => {
        if (playbackMode === 'single' && currentAyah?.juz) return `الجزء ${currentAyah.juz} فقط`;
        if (playbackMode === 'selection_juz' && playbackJuzSelection) {
            const isRange = playbackJuzSelection.every((juz, i) => i === 0 || juz === playbackJuzSelection[i-1] + 1);
            if (isRange && playbackJuzSelection.length > 1) return `من الجزء ${playbackJuzSelection[0]} إلى ${playbackJuzSelection[playbackJuzSelection.length - 1]}`;
            return `أجزاء مختارة: ${formatJuzSelection(playbackJuzSelection)}`;
        }
        if (playbackMode === 'selection_surah' && playbackSurahSelection) {
            if (playbackSurahSelection.length > 2) {
                return `${playbackSurahSelection.length} سور مختارة`;
            }
            const surahNames = playbackSurahSelection.map(num => QURAN_INDEX.find(s => s.number === num)?.name.replace('سُورَةُ ', '')).filter(Boolean).join('، ');
            return `سور مختارة: ${surahNames}`;
        }
        return 'ختمة كاملة';
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!audioRef.current || !audioDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (width <= 0) return;
        const percentage = Math.max(0, Math.min(1, clickX / width));
        const newTime = percentage * audioDuration;
        audioRef.current.currentTime = newTime;
    };

    if (!currentAyah) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center h-screen bg-background text-text-primary p-6 text-center">
                <SpinnerIcon className="w-12 h-12 text-primary animate-spin"/>
                <p className="text-lg font-semibold">جاري تحميل بيانات الختمة الصوتية...</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow hover:bg-primary-hover transition-all"
                >
                    تحديث الصفحة
                </button>
            </div>
        );
    }

    return (
        <div 
            className={`bg-background text-text-primary fixed inset-0 flex flex-col font-sans select-none overflow-hidden ${
                isPseudoFullscreen || isFullscreen ? 'z-[99999]' : 'z-10'
            }`} 
            onClick={handleScreenTap}
        >
            {/* Selection Modals */}
            {isJuzSelectorOpen && (
                <JuzSelectionModal 
                    onClose={() => setIsJuzSelectorOpen(false)} 
                    juzStartAyahs={juzStartAyahs} 
                    onJuzSelect={handleJuzSelect} 
                    onSelectionConfirm={handleJuzSelectionConfirm} 
                    mode={juzModalMode} 
                />
            )}
            {isSurahSelectorOpen && (
                <SurahSelectionModal 
                    onClose={() => setIsSurahSelectorOpen(false)} 
                    onSurahSelect={handleSurahJump} 
                    onSelectionConfirm={handleSurahSelectionConfirm} 
                    mode={surahModalMode} 
                />
            )}
            {isModeSelectorOpen && (
                <PlaybackModeModal 
                    onClose={() => setIsModeSelectorOpen(false)} 
                    onModeSelect={(mode: PlaybackMode) => { 
                        setPlaybackMode(mode); 
                        setPlaybackJuzSelection(null); 
                        setPlaybackSurahSelection(null); 
                        if (mode === 'single' && !isPlaying) setIsPlaying(true); 
                    }} 
                    onJuzSelectionStart={() => { 
                        setIsModeSelectorOpen(false); 
                        setJuzModalMode('selection'); 
                        setIsJuzSelectorOpen(true); 
                    }} 
                    onSurahSelectionStart={() => { 
                        setIsModeSelectorOpen(false); 
                        setSurahModalMode('selection'); 
                        setIsSurahSelectorOpen(true); 
                    }} 
                />
            )}
            {isSettingsOpen && (
                <SettingsModal 
                    onClose={() => setIsSettingsOpen(false)} 
                    fontSize={khatmiyahFontSize} 
                    onFontSizeChange={setKhatmiyahFontSize} 
                    fontStyle={khatmiyahFontStyle} 
                    onFontStyleChange={setKhatmiyahFontStyle} 
                />
            )}

            {/* Hidden Audio Element */}
            <audio 
                ref={audioRef} 
                onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)} 
                onCanPlay={() => { 
                    setIsLoading(false); 
                    setIsBuffering(false); 
                    if (isPlaying) audioRef.current?.play(); 
                }} 
                onPlay={() => setIsPlaying(true)} 
                onPause={() => { 
                    if (audioRef.current && Math.abs(audioRef.current.currentTime - audioRef.current.duration) > 0.1) {
                        setIsPlaying(false);
                    }
                }} 
                onEnded={handleAudioEnded} 
                onWaiting={() => setIsBuffering(true)} 
                className="hidden" 
            />
            
            {/* Header Bar */}
            <header 
                className={`flex-shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between bg-surface/90 backdrop-blur-md border-b border-border-default/40 shadow-md z-20 transition-all duration-300 ${
                    controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
                }`}
            >
                {/* Navigation Group (Right RTL) */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {setIsSidePanelOpen && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsSidePanelOpen(true); }} 
                            title="القائمة الجانبية" 
                            aria-label="القائمة الجانبية" 
                            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover transition-colors text-text-secondary active:scale-95"
                        >
                            <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                        </button>
                    )}
                    <button 
                        onClick={handleHomeClick} 
                        title="العودة للرئيسية وإلغاء ملء الشاشة" 
                        aria-label="العودة للرئيسية" 
                        className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary transition-colors active:scale-95"
                    >
                        <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                    </button>
                </div>

                {/* Center Title Group: Interactive Surah & Ayah / Juz Selector */}
                <div className="text-center flex flex-col items-center min-w-0 px-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSurahModalMode('jump'); setIsSurahSelectorOpen(true); }}
                        className="group flex items-center gap-1.5 text-base sm:text-xl font-bold text-text-primary hover:text-primary transition-colors px-2 py-0.5 rounded-lg hover:bg-surface-hover/80 max-w-[200px] sm:max-w-none truncate"
                        title="انقر لخيارات السورة والقفز السريع"
                    >
                        <span className="truncate">سورة {currentAyah.surah?.name}</span>
                        <ChevronDownIcon className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-y-0.5 transition-all flex-shrink-0" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setJuzModalMode('jump'); setIsJuzSelectorOpen(true); }}
                        className="group flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-text-muted font-semibold px-2 py-0.5 rounded-md hover:bg-surface-hover/80 transition-colors"
                        title="انقر للقفز السريع للجزء أو الصفحة"
                    >
                        <span>الآية: {currentAyah.numberInSurah}</span>
                        <span className="opacity-40">•</span>
                        <span>الجزء: {currentAyah.juz}</span>
                        <span className="opacity-40">•</span>
                        <span>الصفحة: {currentAyah.page}</span>
                        <ChevronDownIcon className="w-3 h-3 text-text-muted group-hover:text-primary group-hover:translate-y-0.5 transition-all flex-shrink-0" />
                    </button>
                </div>

                {/* Actions Group (Left RTL: Theme, Refresh, Fullscreen) */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
                        className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary transition-colors active:scale-95"
                        title="تغيير المظهر"
                        aria-label="تغيير المظهر"
                    >
                        {isDark ? <SunIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" /> : <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); window.location.reload(); }}
                        className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary transition-colors active:scale-95 hidden sm:flex"
                        title="إعادة تحميل الصفحة وتحديث قسم الختمة"
                        aria-label="إعادة تحميل وتحديث"
                    >
                        <span className="text-sm font-bold">🔄</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                        className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary transition-colors active:scale-95"
                        title={isFullscreen || isPseudoFullscreen ? "إلغاء ملء الشاشة" : "ملء الشاشة"}
                        aria-label={isFullscreen || isPseudoFullscreen ? "إلغاء ملء الشاشة" : "ملء الشاشة"}
                    >
                        {isFullscreen || isPseudoFullscreen ? (
                            <ArrowsPointingInIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        ) : (
                            <ArrowsPointingOutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                    </button>
                </div>
            </header>

            {/* Main Verses Reading View */}
            <main className="flex-grow flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
                <div className="text-center w-full max-w-4xl mx-auto my-auto px-2">
                    {(isLoading && !displayedText) ? (
                        <div className="flex flex-col gap-4 items-center">
                            <SpinnerIcon className="w-12 h-12 text-primary animate-spin"/>
                            <p className="text-lg font-medium text-text-muted">جاري تحميل النص الصوتي...</p>
                        </div>
                    ) : (
                        <div className="leading-relaxed sm:leading-loose">
                            <p 
                                className={`select-none transition-all duration-300 ${quranTextClass}`} 
                                dir={displayEditionDetails?.direction || 'rtl'}
                            >
                                {canHighlight ? (
                                    displayedText.trim().split(/\s+/).map((word, index) => (
                                        <span 
                                            key={index} 
                                            className={`transition-colors duration-150 inline-block mx-0.5 ${
                                                index === currentWordIndex 
                                                    ? 'text-primary font-extrabold scale-105 transform drop-shadow-sm' 
                                                    : 'text-text-primary'
                                            }`}
                                        >
                                            {word}{' '}
                                        </span>
                                    ))
                                ) : (
                                    displayedText
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Floating Control Bar */}
            <footer 
                className={`flex-shrink-0 p-3 sm:p-5 bg-surface/95 backdrop-blur-md border-t border-border-default/40 shadow-[0_-4px_30px_rgba(0,0,0,0.15)] z-20 transition-all duration-300 ${
                    controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
                }`}
            >
                <div className="max-w-5xl mx-auto space-y-3">
                    {/* Interactive Audio Progress Bar */}
                    <div 
                        className="w-full h-2.5 bg-surface-subtle hover:h-3 rounded-full overflow-hidden cursor-pointer flex items-center transition-all group" 
                        onClick={handleProgressClick} 
                        title="انقر للانتقال إلى موقع معين في تلاوة الآية"
                    >
                        <div 
                            className="h-full bg-primary rounded-full transition-all duration-150 relative" 
                            style={{ width: audioDuration > 0 ? `${(audioProgress / audioDuration) * 100}%` : '0%'}}
                        >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        
                        {/* Reciter Selector & Scope Info */}
                        <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-start gap-2 min-w-0">
                            <div className="flex-1 sm:flex-none min-w-0">
                                <AudioEditionSelector 
                                    audioEditions={allAudioEditions} 
                                    selectedAudioEdition={selectedAudioEdition} 
                                    onSelect={onAudioEditionChange} 
                                    size="sm" 
                                />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-text-muted truncate max-w-[140px] sm:max-w-xs bg-surface-subtle/80 px-2.5 py-1 rounded-lg border border-border-default/40">
                                {getPlaybackScopeDescription()}
                            </span>
                        </div>

                        {/* Primary Audio Controls (Center) */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 w-full sm:w-1/3 my-0.5 sm:my-0 dir-ltr" dir="ltr">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handlePrevAyah(); }} 
                                title="الآية السابقة (الرمز لليسار في الواجهة العربية)" 
                                aria-label="الآية السابقة"
                                className="p-2.5 sm:p-3 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-full transition-colors active:scale-90 flex items-center justify-center"
                            >
                                <BackwardIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} 
                                title={isPlaying ? "إيقاف مؤقت" : "تشغيل التلاوة"}
                                aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل التلاوة"}
                                className="p-3.5 sm:p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-transform hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary/30"
                            >
                                {isBuffering ? (
                                    <SpinnerIcon className="w-7 h-7 sm:w-8 sm:h-8 animate-spin"/>
                                ) : isPlaying ? (
                                    <PauseIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                                ) : (
                                    <PlayIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                                )}
                            </button>

                            <button 
                                onClick={(e) => { e.stopPropagation(); handleNextAyah(); }} 
                                title="الآية التالية (الرمز لليمين في الواجهة العربية)" 
                                aria-label="الآية التالية"
                                className="p-2.5 sm:p-3 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-full transition-colors active:scale-90 flex items-center justify-center"
                            >
                                <ForwardIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                            </button>
                        </div>

                        {/* Secondary Tools (Left RTL) */}
                        <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-1/3">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleSpeedChange(); }}
                                title="سرعة التلاوة"
                                aria-label="سرعة التلاوة"
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors text-text-secondary hover:bg-surface-hover hover:text-primary border border-border-default/60 active:scale-95"
                            >
                                {playbackSpeed}x
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsLooping(!isLooping); }} 
                                title={isLooping ? "إيقاف تكرار السورة" : "تكرار السورة الحالية"} 
                                aria-label={isLooping ? "إيقاف تكرار السورة" : "تكرار السورة الحالية"}
                                className={`p-2 rounded-xl transition-colors active:scale-95 ${
                                    isLooping 
                                        ? 'text-primary bg-primary/15 border border-primary/30' 
                                        : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
                                }`}
                            >
                                <RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </button>
                            <div className="h-5 w-px bg-border-default/60 mx-0.5"></div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsModeSelectorOpen(true); }} 
                                title="تحديد نطاق القراءة (سور / أجزاء / ختمة)" 
                                aria-label="تحديد نطاق القراءة"
                                className="p-2 rounded-xl transition-colors text-text-muted hover:bg-surface-hover hover:text-primary active:scale-95"
                            >
                                <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} 
                                title="إعدادات حط ونمط العرض" 
                                aria-label="إعدادات الخط والنص"
                                className="p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-primary transition-colors active:scale-95"
                            >
                                <ComputerDesktopIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AudioKhatmiyahView;
