import type { Ayah, QuranEdition } from '../types';
import { QURAN_INDEX } from '../quranIndex';

export const getGlobalAyahNumber = (surahNumber: number, numberInSurah: number): number => {
  let globalNum = 0;
  for (let i = 1; i < surahNumber; i++) {
    const surah = QURAN_INDEX.find(s => s.number === i);
    if (surah) {
      globalNum += surah.numberOfAyahs;
    }
  }
  return globalNum + numberInSurah;
};

export const getAudioUrl = (ayah: Ayah, audioEditionDetails: QuranEdition): string | undefined => {
  const { sourceApi, reciterIdentifier, identifier } = audioEditionDetails;
  const surahNum = ayah.surah?.number;
  if (!surahNum) return undefined;

  switch (sourceApi) {
    case 'versebyversequran.com': {
      if (!reciterIdentifier) return undefined;
      const surahNumPad = surahNum.toString().padStart(3, '0');
      const ayahNumPad = ayah.numberInSurah.toString().padStart(3, '0');
      return `https://everyayah.com/data/${reciterIdentifier}/${surahNumPad}${ayahNumPad}.mp3`;
    }
    case 'islamic-network':
    case 'alquran.cloud': {
      if (ayah.audio) return ayah.audio;
      const globalNum = ayah.number || getGlobalAyahNumber(surahNum, ayah.numberInSurah);
      return `https://cdn.islamic.network/quran/audio/128/${identifier}/${globalNum}.mp3`;
    }
    default: {
      const globalNum = ayah.number || getGlobalAyahNumber(surahNum, ayah.numberInSurah);
      return `https://cdn.islamic.network/quran/audio/128/${identifier || 'ar.alafasy'}/${globalNum}.mp3`;
    }
  }
};

export const getBismillahAudioUrl = (audioEditionDetails: QuranEdition): string | undefined => {
  const { sourceApi, reciterIdentifier, identifier } = audioEditionDetails;
  switch (sourceApi) {
    case 'versebyversequran.com':
      return reciterIdentifier ? `https://everyayah.com/data/${reciterIdentifier}/001001.mp3` : undefined;
    case 'alquran.cloud':
    case 'islamic-network':
      return `https://cdn.islamic.network/quran/audio/128/${identifier}/1.mp3`;
    default:
      return `https://cdn.islamic.network/quran/audio/128/${identifier || 'ar.alafasy'}/1.mp3`;
  }
};

export const getSecondaryAudioUrl = (ayah: Ayah, identifier: string): string | undefined => {
    // Specific fallback for Muhammad Ayyub to EveryAyah
    if (identifier === 'ar.muhammadayyoub' && ayah.surah) {
        const surahPad = ayah.surah.number.toString().padStart(3, '0');
        const ayahPad = ayah.numberInSurah.toString().padStart(3, '0');
        // Using 128kbps source from EveryAyah
        return `https://everyayah.com/data/Muhammad_Ayyoub_128kbps/${surahPad}${ayahPad}.mp3`;
    }
    return undefined;
};
