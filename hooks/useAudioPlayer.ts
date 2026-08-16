import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Ayah, QuranEdition, SurahData } from '../types';
import { getAudioUrl, getBismillahAudioUrl, getSecondaryAudioUrl, getGlobalAyahNumber } from '../utils/audio';
import { ALL_AUDIO_EDITIONS } from '../data/audioEditions';

export const useAudioPlayer = (
    currentPath: string,
    allQuranData: { [key: string]: SurahData[] } | null,
    selectedAudioEdition: string,
    setSelectedAudioEdition: (id: string) => void,
    fetchCustomEditionData: (id: string) => void
) => {
    const [playbackInfo, setPlaybackInfo] = useState<{
        playlist: Ayah[]; currentIndex: number; isPlaying: boolean;
        trigger?: { ayahsForPlaylist: Ayah[], audioEditionIdentifier: string, startIndex?: number }
    } | null>(null);

    const handleStartPlayback = useCallback((ayahsForPlaylist: Ayah[], audioEditionIdentifier: string, startIndex: number = 0) => {
        const audioEditionDetails = ALL_AUDIO_EDITIONS.find(e => e.identifier === audioEditionIdentifier);
        if (!audioEditionDetails) {
            const fallback = ALL_AUDIO_EDITIONS.find(e => e.identifier === 'ar.alafasy');
            if (fallback) {
                setSelectedAudioEdition('ar.alafasy');
                handleStartPlayback(ayahsForPlaylist, 'ar.alafasy', startIndex);
            }
            return;
        }

        const getPlaylistData = () => {
            if (ayahsForPlaylist.length > 0) return ayahsForPlaylist.slice(startIndex);
            const [path] = currentPath.substring(1).split('?');
            const pathParts = path.split('/').filter(Boolean);
            const uthmaniData = allQuranData?.['quran-uthmani-quran-academy'] || allQuranData?.['quran-uthmani']; // Fallback to either loaded version
            
            if (!uthmaniData) return [];

            // Case 1: Surah Playback
            if (pathParts[0] === 'surah' && pathParts[1]) {
                const surahNumber = parseInt(pathParts[1], 10);
                const surahData = uthmaniData.find(s => s.number === surahNumber);
                if (surahData) {
                    return surahData.ayahs.map(ayah => ({
                        ...ayah,
                        surah: { number: surahData.number, name: surahData.name, englishName: surahData.englishName, englishNameTranslation: surahData.englishNameTranslation, revelationType: surahData.revelationType, numberOfAyahs: surahData.numberOfAyahs }
                    })).slice(startIndex);
                }
            }
            
            // Case 2: Page Playback
            if (pathParts[0] === 'page' && pathParts[1]) {
                const pageNumber = parseInt(pathParts[1], 10);
                const pagePlaylist: Ayah[] = [];
                uthmaniData.forEach(surah => {
                    const ayahsOnPage = surah.ayahs.filter(a => a.page === pageNumber);
                    if (ayahsOnPage.length > 0) {
                        const mappedAyahs = ayahsOnPage.map(ayah => ({
                            ...ayah,
                            surah: { number: surah.number, name: surah.name, englishName: surah.englishName, englishNameTranslation: surah.englishNameTranslation, revelationType: surah.revelationType, numberOfAyahs: surah.numberOfAyahs }
                        }));
                        pagePlaylist.push(...mappedAyahs);
                    }
                });
                return pagePlaylist.slice(startIndex);
            }

            return [];
        };

        const generatePlaylist = (basePlaylist: Ayah[]) => {
            if (basePlaylist.length === 0) return null;
            let finalPlaylist = basePlaylist.map(ayah => {
                let audioUrl = getAudioUrl(ayah, audioEditionDetails);
                const secondaryAudio = getSecondaryAudioUrl(ayah, audioEditionIdentifier);
                
                if (audioEditionDetails.sourceApi === 'alquran.cloud') {
                    const audioData = allQuranData?.[audioEditionIdentifier];
                    const audioSurah = audioData?.find(s => s.number === ayah.surah?.number);
                    const audioAyah = audioSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
                    if (audioAyah?.audio) {
                        audioUrl = audioAyah.audio;
                    }
                }

                if (!audioUrl && ayah.surah) {
                    const globalNum = ayah.number || getGlobalAyahNumber(ayah.surah.number, ayah.numberInSurah);
                    audioUrl = `https://cdn.islamic.network/quran/audio/128/${audioEditionIdentifier || 'ar.alafasy'}/${globalNum}.mp3`;
                }

                return { 
                    ...ayah, 
                    audio: audioUrl,
                    audioSecondary: secondaryAudio ? [secondaryAudio] : undefined
                } as Ayah;
            }).filter((item): item is Ayah & { audio: string } => !!item.audio);

            const firstAyahOfPlaylist = basePlaylist[0];
            const surahForPlaylist = firstAyahOfPlaylist?.surah;
            const needsBismillah = startIndex === 0 && firstAyahOfPlaylist?.numberInSurah === 1 && surahForPlaylist && surahForPlaylist.number !== 1 && surahForPlaylist.number !== 9;
            
            if (needsBismillah) {
                const bismillahAudioUrl = getBismillahAudioUrl(audioEditionDetails);
                if (bismillahAudioUrl) {
                    finalPlaylist.unshift({ number: 0, numberInSurah: 0, text: 'البسملة', audio: bismillahAudioUrl, surah: surahForPlaylist });
                }
            }
            return finalPlaylist;
        };

        const playlistBase = getPlaylistData();
        const finalPlaylist = generatePlaylist(playlistBase);
        if (finalPlaylist && finalPlaylist.length > 0) {
            setPlaybackInfo({ playlist: finalPlaylist, currentIndex: 0, isPlaying: true });
        } else if (audioEditionDetails.sourceApi === 'alquran.cloud' && !allQuranData?.[audioEditionIdentifier]) {
            fetchCustomEditionData(audioEditionIdentifier);
            setPlaybackInfo({ playlist: [], currentIndex: 0, isPlaying: false, trigger: { ayahsForPlaylist, audioEditionIdentifier, startIndex } });
        } else {
            console.warn("[useAudioPlayer] Could not generate playlist for audio playback.");
            setPlaybackInfo(null);
        }
    }, [allQuranData, fetchCustomEditionData, currentPath, setSelectedAudioEdition]);

    useEffect(() => {
        if (playbackInfo?.trigger && allQuranData?.[playbackInfo.trigger.audioEditionIdentifier]) {
            handleStartPlayback(playbackInfo.trigger.ayahsForPlaylist, playbackInfo.trigger.audioEditionIdentifier, playbackInfo.trigger.startIndex);
        }
    }, [playbackInfo, allQuranData, handleStartPlayback]);

    const handlePlayPause = () => setPlaybackInfo(p => p ? { ...p, isPlaying: !p.isPlaying } : null);
    const handlePlay = useCallback(() => setPlaybackInfo(p => p ? { ...p, isPlaying: true } : null), []);
    const handlePause = useCallback(() => setPlaybackInfo(p => p ? { ...p, isPlaying: false } : null), []);
    const handleClosePlayback = () => setPlaybackInfo(null);
    const handleNext = useCallback(() => {
        setPlaybackInfo(p => {
            if (!p) return null;
            const nextIndex = p.currentIndex + 1;
            if (nextIndex >= p.playlist.length) return null;
            return { ...p, currentIndex: nextIndex };
        });
    }, []);
    const handlePrev = () => {
        setPlaybackInfo(p => {
            if (!p) return null;
            const prevIndex = p.currentIndex - 1;
            if (prevIndex < 0) return p;
            return { ...p, currentIndex: prevIndex };
        });
    };

    const currentlyPlayingAyahGlobalNumber = playbackInfo?.playlist[playbackInfo.currentIndex]?.number;
    const selectedAudioEditionDetails = useMemo(() => ALL_AUDIO_EDITIONS.find(e => e.identifier === selectedAudioEdition), [selectedAudioEdition]);

    return {
        playbackInfo,
        currentlyPlayingAyahGlobalNumber,
        selectedAudioEditionDetails,
        handleStartPlayback,
        handlePlayPause,
        handlePlay,
        handlePause,
        handleNext,
        handlePrev,
        handleClosePlayback,
        ALL_AUDIO_EDITIONS
    };
};