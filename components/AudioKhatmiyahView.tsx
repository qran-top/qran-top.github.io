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

// --- Main Component ---
const AudioKhatmiyahView: React.FC<AudioKhatmiyahViewProps> = ({
    allAyahs, allAudioEditions, initialAyahNumber, onSaveProgress,
    selectedAudioEdition, onAudioEditionChange, allQuranData, fetchCustomEditionData,
    activeEditions, setIsSidePanelOpen
}) => {
    const { cycleTheme, emoji, name, nextThemeName, isDark } = useTheme();
    
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isJuzSelectorOpen, setIsJuzSelectorOpen] = useState(false);
    const [isSurahSelectorOpen, setIsSurahSelectorOpen] = useState(false);
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
    const [juzModalMode, setJuzModalMode] = useState<'jump' | 'selection'>('jump');
    const [surahModalMode, setSurahModalMode] = useState<'jump' | 'selection'>('jump');
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

    const displayEditionDetails = useMemo(() => activeEditions.find(e => e.identifier === displayEditionIdentifier), [activeEditions, displayEditionIdentifier]);
    
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

    const handleScreenTap = () => {
        if (isPlaying) setControlsVisible(prev => !prev);
    };

    const toggleFullscreen = () => {
        const docEl = document.documentElement as any;
        const doc = document as any;
        const isCurrentlyNativeFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (isFullscreen || isPseudoFullscreen || isCurrentlyNativeFS) {
            // Exit fullscreen
            if (isCurrentlyNativeFS) {
                const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
                if (exitFS) {
                    try { exitFS.call(doc); } catch (e) { /* ignore */ }
                }
            }
            setIsPseudoFullscreen(false);
            setIsFullscreen(false);
        } else {
            // Enter fullscreen
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
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const doc = document as any;
            const isNativeFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
            if (isNativeFS) {
                setIsFullscreen(true);
            } else if (!isPseudoFullscreen) {
                setIsFullscreen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsPseudoFullscreen(false);
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
    }, [isPseudoFullscreen]);

    useEffect(() => {
        if (!isPlaying) setControlsVisible(true);
    }, [isPlaying]);

    useEffect(() => {
        if (!allQuranData?.[displayEditionIdentifier]) {
            fetchCustomEditionData(displayEditionIdentifier);
        }
    }, [displayEditionIdentifier, allQuranData, fetchCustomEditionData]);

    // Handle speed changes on audio element
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
        return <div className="flex flex-col gap-4 justify-center items-center h-screen bg-gray-900 text-white"><SpinnerIcon className="w-10 h-10"/> <p>جاري تحميل بيانات الختمة...</p></div>;
    }

    return (
        <div className={`bg-background text-text-primary fixed inset-0 flex flex-col font-sans ${isPseudoFullscreen || isFullscreen ? 'z-[99999]' : 'z-10'}`} onClick={handleScreenTap}>
            {isJuzSelectorOpen && <JuzSelectionModal onClose={() => setIsJuzSelectorOpen(false)} juzStartAyahs={juzStartAyahs} onJuzSelect={handleJuzSelect} onSelectionConfirm={handleJuzSelectionConfirm} mode={juzModalMode} />}
            {isSurahSelectorOpen && <SurahSelectionModal onClose={() => setIsSurahSelectorOpen(false)} onSurahSelect={handleSurahJump} onSelectionConfirm={handleSurahSelectionConfirm} mode={surahModalMode} />}
            {isModeSelectorOpen && <PlaybackModeModal onClose={() => setIsModeSelectorOpen(false)} onModeSelect={(mode: PlaybackMode) => { setPlaybackMode(mode); setPlaybackJuzSelection(null); setPlaybackSurahSelection(null); if (mode === 'single' && !isPlaying) setIsPlaying(true); }} onJuzSelectionStart={() => { setIsModeSelectorOpen(false); setJuzModalMode('selection'); setIsJuzSelectorOpen(true); }} onSurahSelectionStart={() => { setIsModeSelectorOpen(false); setSurahModalMode('selection'); setIsSurahSelectorOpen(true); }} />}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} fontSize={khatmiyahFontSize} onFontSizeChange={setKhatmiyahFontSize} fontStyle={khatmiyahFontStyle} onFontStyleChange={setKhatmiyahFontStyle} />}

            <audio ref={audioRef} onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)} onCanPlay={() => { setIsLoading(false); setIsBuffering(false); if(isPlaying) audioRef.current?.play(); }} onPlay={() => setIsPlaying(true)} onPause={() => { if (audioRef.current && Math.abs(audioRef.current.currentTime - audioRef.current.duration) > 0.1) setIsPlaying(false); }} onEnded={handleAudioEnded} onWaiting={() => setIsBuffering(true)} className="hidden" />
            
            <header className={`flex-shrink-0 p-3 flex items-center justify-between bg-surface/80 backdrop-blur-md shadow-md z-10 transition-all duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 -translate-y-full'}`}>
                {/* Right Group (RTL): Navigation & Side Panel */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {setIsSidePanelOpen && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsSidePanelOpen(true); }} 
                            title="القائمة الجانبية" 
                            aria-label="القائمة الجانبية" 
                            className="p-2 rounded-full bg-surface-subtle hover:bg-surface-hover transition-colors block text-text-secondary"
                        >
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                    )}
                    <a href="#/" onClick={(e) => { e.preventDefault(); window.location.hash = '#/'; }} title="العودة للرئيسية" aria-label="العودة للرئيسية" className="p-2 rounded-full bg-surface-subtle hover:bg-surface-hover block text-text-secondary transition-colors">
                        <HomeIcon className="w-6 h-6"/>
                    </a>
                </div>

                {/* Center Group: Interactive Surah & Ayah / Juz Selectors */}
                <div className="text-center flex flex-col items-center">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSurahModalMode('jump'); setIsSurahSelectorOpen(true); }}
                        className="group flex items-center gap-1.5 text-lg sm:text-xl font-bold text-text-primary hover:text-primary transition-colors px-2.5 py-0.5 rounded-lg hover:bg-surface-hover/80"
                        title="انقر لخيارات السورة"
                    >
                        <span>سورة {currentAyah.surah?.name}</span>
                        <ChevronDownIcon className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-y-0.5 transition-all" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setJuzModalMode('jump'); setIsJuzSelectorOpen(true); }}
                        className="group flex items-center gap-2 text-xs text-text-muted font-semibold px-2.5 py-0.5 rounded-md hover:bg-surface-hover/80 transition-colors"
                        title="انقر للقفز السريع للجزء أو الصفحة"
                    >
                        <span>الآية: {currentAyah.numberInSurah}</span>
                        <span className="opacity-40">•</span>
                        <span>الجزء: {currentAyah.juz}</span>
                        <span className="opacity-40">•</span>
                        <span>الصفحة: {currentAyah.page}</span>
                        <ChevronDownIcon className="w-3 h-3 text-text-muted group-hover:text-primary group-hover:translate-y-0.5 transition-all" />
                    </button>
                </div>

                {/* Left Group (RTL): Actions (Theme, Fullscreen) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
                        className="p-2 rounded-full bg-surface-subtle hover:bg-surface-hover text-text-secondary transition-colors"
                        title="تغيير المظهر"
                    >
                        {isDark ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                        className="p-2 rounded-full bg-surface-subtle hover:bg-surface-hover text-text-secondary transition-colors"
                        title={isFullscreen || isPseudoFullscreen ? "إلغاء ملء الشاشة" : "ملء الشاشة"}
                        aria-label={isFullscreen || isPseudoFullscreen ? "إلغاء ملء الشاشة" : "ملء الشاشة"}
                    >
                        {isFullscreen || isPseudoFullscreen ? <ArrowsPointingInIcon className="w-6 h-6 text-primary" /> : <ArrowsPointingOutIcon className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="text-center w-full">
                    {(isLoading && !displayedText) ? <div className="flex flex-col gap-4 items-center"><SpinnerIcon className="w-12 h-12 text-primary"/><p className="text-lg">جاري تحميل الآية...</p></div>
                    : <p className={`select-none ${quranTextClass}`} dir={displayEditionDetails?.direction || 'rtl'}>
                        {canHighlight 
                            ? displayedText.trim().split(/\s+/).map((word, index) => <span key={index} className={`transition-colors duration-200 ${index === currentWordIndex ? 'text-primary' : ''}`}>{word}{' '}</span>) 
                            : displayedText}
                       </p>}
                </div>
            </main>

            <footer className={`flex-shrink-0 p-3 sm:p-4 bg-surface/90 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.15)] z-20 transition-all duration-300 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-surface-subtle rounded-full mb-3 sm:mb-4 overflow-hidden cursor-pointer flex items-center" onClick={handleProgressClick} title="الانتقال إلى زمن معين في الآية">
                    <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: audioDuration > 0 ? `${(audioProgress / audioDuration) * 100}%` : '0%'}}></div>
                </div>

                {/* Controls Container */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    
                    {/* Reciter & Playback Scope Info */}
                    <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-start gap-2 min-w-0">
                        <div className="flex-1 sm:flex-none min-w-0">
                            <AudioEditionSelector audioEditions={allAudioEditions} selectedAudioEdition={selectedAudioEdition} onSelect={onAudioEditionChange} size="sm" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-text-muted truncate max-w-[150px] sm:max-w-xs bg-surface-subtle/80 px-2.5 py-1 rounded-md border border-border-default/40">
                            {getPlaybackScopeDescription()}
                        </span>
                    </div>

                    {/* Core Audio Navigation Controls (Center) */}
                    <div className="flex items-center justify-center gap-4 sm:gap-6 w-full sm:w-1/3 my-0.5 sm:my-0 dir-ltr" dir="ltr">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePrevAyah(); }} 
                            title="الآية السابقة" 
                            aria-label="الآية السابقة"
                            className="p-2.5 sm:p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-full transition-colors active:scale-95 flex items-center justify-center"
                        >
                            <BackwardIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} 
                            title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                            className="p-3.5 sm:p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                        >
                             {isBuffering ? <SpinnerIcon className="w-7 h-7 sm:w-8 sm:h-8"/> : (isPlaying ? <PauseIcon className="w-7 h-7 sm:w-8 sm:h-8" /> : <PlayIcon className="w-7 h-7 sm:w-8 sm:h-8" />)}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleNextAyah(); }} 
                            title="الآية التالية" 
                            aria-label="الآية التالية"
                            className="p-2.5 sm:p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-full transition-colors active:scale-95 flex items-center justify-center"
                        >
                            <ForwardIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                        </button>
                    </div>

                    {/* Secondary Actions (Right) */}
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-1/3">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSpeedChange(); }}
                            title="سرعة التلاوة"
                            aria-label="سرعة التلاوة"
                            className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors text-text-secondary hover:bg-surface-hover hover:text-primary border border-border-default/60"
                        >
                            {playbackSpeed}x
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsLooping(!isLooping); }} 
                            title={isLooping ? "إيقاف تكرار السورة" : "تكرار السورة"} 
                            aria-label={isLooping ? "إيقاف تكرار السورة" : "تكرار السورة"}
                            className={`p-2 rounded-full transition-colors ${isLooping ? 'text-primary bg-primary/10' : 'text-text-muted hover:bg-surface-hover'}`}
                        >
                            <RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                        </button>
                        <div className="h-5 w-px bg-border-default mx-0.5"></div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsModeSelectorOpen(true); }} 
                            title="تحديد نطاق القراءة" 
                            aria-label="تحديد نطاق القراءة"
                            className="p-2 rounded-full transition-colors text-text-muted hover:bg-surface-hover hover:text-primary"
                        >
                            <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} 
                            title="إعدادات العرض" 
                            aria-label="إعدادات العرض"
                            className="p-2 rounded-full text-text-muted hover:bg-surface-hover transition-colors hover:text-primary"
                        >
                            <ComputerDesktopIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AudioKhatmiyahView;