import React, { useRef, useEffect, useState } from 'react';
import type { Ayah, QuranEdition } from '../types';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon, XIcon, SpinnerIcon, SpeakerWaveIcon } from './icons';
import { formatSurahNameForDisplay } from '../utils/text';
import RecitersModal from './RecitersModal';

interface AudioPlayerBarProps {
    playlist: Ayah[];
    currentIndex: number;
    isPlaying: boolean;
    isLoading: boolean;
    onPlayPause: () => void;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onEnded: () => void;
    onClose: () => void;
    audioEdition: QuranEdition | undefined;
}

const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ playlist, currentIndex, isPlaying, isLoading, onPlayPause, onPlay, onPause, onNext, onPrev, onEnded, onClose, audioEdition }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const currentAyah = playlist[currentIndex];
    const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentAyah?.audio) return;
        
        const currentSrcAttr = audio.getAttribute('src');
        const currentSrcProp = audio.src;
        const primarySrc = currentAyah.audio;
        const fallbackSrcs = currentAyah.audioSecondary || [];

        // Check if current source is already primary or one of secondary fallbacks
        const isSameSrc = currentSrcAttr === primarySrc || currentSrcProp === primarySrc || currentSrcProp.endsWith(primarySrc) ||
            fallbackSrcs.some(fallback => currentSrcAttr === fallback || currentSrcProp === fallback || currentSrcProp.endsWith(fallback));

        if (!isSameSrc) {
            audio.src = primarySrc;
            audio.load();
        }

        if (isPlaying) {
            audio.play().catch(e => {
                if (e.name === 'AbortError') {
                    console.log("Audio play request was interrupted (benign):", e.message);
                } else {
                    console.error("Audio play failed:", e);
                }
            });
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        } else {
            audio.pause();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
    }, [currentIndex, isPlaying, playlist, currentAyah]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.addEventListener('ended', onEnded);
            return () => {
                audio.removeEventListener('ended', onEnded);
            };
        }
    }, [onEnded]);

    useEffect(() => {
        if ('mediaSession' in navigator && currentAyah) {
            const surahName = currentAyah.surah?.name ? formatSurahNameForDisplay(currentAyah.surah.name) : '...';
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `سورة ${surahName} - الآية ${currentAyah.numberInSurah}`,
                artist: audioEdition?.name || 'القرآن الكريم',
                album: 'القرآن الكريم',
                artwork: [
                    { src: '/thumbnail.svg', sizes: '512x512', type: 'image/svg+xml' },
                    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', onPlay);
            navigator.mediaSession.setActionHandler('pause', onPause);
            navigator.mediaSession.setActionHandler('previoustrack', onPrev);
            navigator.mediaSession.setActionHandler('nexttrack', onNext);
            
            // Cleanup on unmount
            return () => {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('previoustrack', null);
                navigator.mediaSession.setActionHandler('nexttrack', null);
            };
        }
    }, [currentAyah, audioEdition, onPlay, onPause, onPrev, onNext]);

    const handleAudioError = () => {
        if (audioRef.current && currentAyah?.audioSecondary && currentAyah.audioSecondary.length > 0) {
            const fallbackUrl = currentAyah.audioSecondary[0];
            const currentSrc = audioRef.current.getAttribute('src');
            
            // If we haven't tried the fallback yet (or current src is different from fallback)
            if (currentSrc !== fallbackUrl) {
                console.log("Audio playback failed. Switching to fallback source...");
                audioRef.current.src = fallbackUrl;
                if (isPlaying) {
                    audioRef.current.play().catch(e => console.error("Fallback play failed:", e));
                }
                return;
            }
        }
        console.error("Audio playback error (all sources failed).");
    };

    const getSurahName = () => {
        if (!currentAyah?.surah?.name) return '...';
        return formatSurahNameForDisplay(currentAyah.surah.name);
    }

    const getTitle = () => {
        if (isLoading) return 'جاري التحضير...';
        const reciterName = audioEdition?.name ? `${audioEdition.name} - ` : '';
        return `${reciterName}سورة ${getSurahName()}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md z-40 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] animate-fade-in">
            <audio ref={audioRef} preload="auto" onError={handleAudioError} />
            <div className="max-w-4xl mx-auto p-3 flex items-center justify-between gap-4">
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={() => setIsRecitersModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
                            title="تغيير القارئ (قائمة الأئمة)"
                        >
                            <SpeakerWaveIcon className="w-3.5 h-3.5" />
                            <span>{audioEdition?.name || 'اختر القارئ'}</span>
                        </button>
                        <span className="text-text-primary font-bold text-sm truncate">
                            سورة {getSurahName()}
                        </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                       { !isLoading && `الآية ${currentAyah?.numberInSurah}` }
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <button onClick={onPrev} disabled={isLoading} className="p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50">
                        <BackwardIcon className="w-6 h-6" />
                    </button>
                    <button onClick={onPlayPause} disabled={isLoading} className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-transform hover:scale-105 disabled:bg-primary/60">
                        {isLoading ? <SpinnerIcon className="w-7 h-7" /> : (
                            isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />
                        )}
                    </button>
                    <button onClick={onNext} disabled={isLoading} className="p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50">
                        <ForwardIcon className="w-6 h-6" />
                    </button>
                </div>
                 <div className="flex-grow text-left">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-subtle">
                        <XIcon className="w-6 h-6 text-text-subtle" />
                    </button>
                </div>
            </div>

            <RecitersModal
                isOpen={isRecitersModalOpen}
                onClose={() => setIsRecitersModalOpen(false)}
            />
        </div>
    );
};

export default AudioPlayerBar;