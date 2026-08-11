

export interface SurahReference {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs?: number; // Made optional as it's not in all contexts
}

export interface Ayah {
  number: number;
  text?: string; // Made optional to support audio-only editions
  audio?: string; // Added for audio editions
  audioSecondary?: string[]; // Added for audio editions
  numberInSurah: number;
  juz?: number;
  manzil?: number;
  page?: number;
  ruku?: number;
  hizbQuarter?: number;
  sajda?: boolean;
  surah?: SurahReference; // Added to support search results which include surah info
}

export interface SurahData extends SurahReference {
  ayahs: Ayah[];
  numberOfAyahs: number; // Ensure it's required here
}

export interface QuranEdition {
    id?: string; // Added for Firestore management
    identifier: string;
    language: string;
    name: string;
    englishName: string;
    format: string;
    type: string;
    direction: string;
    sourceApi?: 'alquran.cloud' | 'fawazahmed0' | 'manual' | 'versebyversequran.com' | 'islamic-network';
    reciterIdentifier?: string; // For APIs like everyayah.com that use a specific folder name for the reciter
}

export interface QuranFont {
  id?: string; // Added for Firestore management
  name: string;
  font_family: string;
  url?: string; // URL for dynamic font loading
}

export interface Comment {
  id: string;
  topicId: string;
  text: string;
  createdAt: any; // Firestore Timestamp
  parentId: string | null;
  author?: {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
  };

  // New model properties for append-only moderation system
  type?: 'comment' | 'report' | 'deletion';
  targetId?: string; // For 'report' and 'deletion' types, points to the doc being actioned on.

  // Kept for potential data migration, but new logic avoids them
  replyCount?: number;
  isEdited?: boolean;
  isDeleted?: boolean;
  flagCount?: number;
}


// --- Types for Saved Items (Tadabbur Notebook) ---

export type SavedItemType = 'ayah' | 'search';

export interface SavedAyahItem {
  type: 'ayah';
  id: string; // e.g., "2:153"
  surah: number;
  ayah: number;
  text: string; // a snippet of the ayah text
  createdAt: number; // Timestamp
  notes?: string; // Added for Tadabbur
}

export interface SavedSearchItem {
  type: 'search';
  id: string; // The search query itself
  query: string;
  createdAt: number; // Timestamp
  notes?: string; // Added for Tadabbur
}

export type SavedItem = SavedAyahItem | SavedSearchItem;

export interface Collection {
  id: string;
  name: string;
  items: SavedItem[];
  createdAt: number; // Timestamp
}

export type Collections = Record<string, Collection>;

// --- Type for new settings ---
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type BrowsingMode = 'full' | 'page';
export type FontStyleType = 'imlai_1' | 'imlai_2' | 'uthmani';
export type PlaybackMode = 'continuous' | 'single' | 'selection_juz' | 'selection_surah';
export type WordClickBehavior = 'auto' | 'direct_search' | 'show_menu';
