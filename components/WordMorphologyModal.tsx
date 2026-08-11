import React, { useState, useEffect } from 'react';
import { ClearIcon, SparklesIcon, SearchIcon, SpinnerIcon, BookOpenIcon } from './icons';

interface WordMorphologyModalProps {
    word: string;
    surahNumber: number;
    surahName?: string;
    ayahNumberInSurah: number;
    onClose: () => void;
    onSearchWord: (cleanWord: string) => void;
}

interface MorphologyData {
    cleanWord: string;
    root: string;
    irabText: string;
    tafsirText: string;
}

function extractArabicRoot(word: string): string {
    let clean = word
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
        .replace(/\u0649/g, 'ي')
        .trim();

    const knownRoots: Record<string, string> = {
        'الحمد': 'ح - م - د',
        'حمد': 'ح - م - د',
        'الله': 'إ - ل - هـ',
        'لله': 'إ - ل - هـ',
        'رب': 'ر - ب - ب',
        'العالمين': 'ع - ل - م',
        'عالمين': 'ع - ل - م',
        'الرحمن': 'ر - ح - م',
        'رحمن': 'ر - ح - م',
        'الرحيم': 'ر - ح - م',
        'مالك': 'م - ل - ك',
        'ملك': 'م - ل - ك',
        'يوم': 'ي - و - م',
        'الدين': 'د - ي - ن',
        'إياك': 'أ - ي - ي',
        'اياك': 'أ - ي - ي',
        'نعبد': 'ع - ب - د',
        'نستعين': 'ع - و - ن',
        'اهدنا': 'هـ - د - ي',
        'الصراط': 'ص - ر - ط',
        'المستقيم': 'ق - و - م',
        'الذين': 'أ - ل - ذ',
        'أنعمت': 'ن - ع - م',
        'المغضوب': 'غ - ض - ب',
        'الضالين': 'ض - ل - ل',
        'الم': 'أ - ل - م',
        'ذلك': 'ذ - ل - ك',
        'الكتاب': 'ك - ت - ب',
        'ريب': 'ر - ي - ب',
        'المتقين': 'و - ق - ي',
        'يؤمنون': 'أ - م - ن',
        'الغيب': 'غ - ي - ب',
        'الصلاة': 'ص - ل - و',
        'رزقناهم': 'ر - ز - ق',
        'ينفقون': 'ن - ف - ق',
        'أنزل': 'ن - ز - ل',
        'المفلحون': 'ف - ل - ح',
        'كفروا': 'ك - ف - ر',
        'أنذرتهم': 'ن - ذ - ر',
        'ختم': 'خ - ت - م',
        'قلوبهم': 'ق - ل - ب',
        'سمعهم': 'س - م - ع',
        'أبصارهم': 'ب - ص - ر',
        'غشاوة': 'غ - ش - و',
        'عذاب': 'ع - ذ - ب',
        'عظيم': 'ع - ظ - م',
    };

    if (knownRoots[clean]) return knownRoots[clean];

    let stripped = clean;
    if (stripped.startsWith('ال') && stripped.length > 4) stripped = stripped.substring(2);
    if ((stripped.startsWith('و') || stripped.startsWith('ف') || stripped.startsWith('ب') || stripped.startsWith('ك') || stripped.startsWith('ل')) && stripped.length > 3) {
        stripped = stripped.substring(1);
    }
    if (stripped.startsWith('ال') && stripped.length > 4) stripped = stripped.substring(2);

    if (stripped.endsWith('ين') || stripped.endsWith('ون') || stripped.endsWith('ات') || stripped.endsWith('هم') || stripped.endsWith('كم') || stripped.endsWith('نا')) {
        if (stripped.length > 4) stripped = stripped.substring(0, stripped.length - 2);
    }

    const chars = stripped.split('').filter(c => c !== 'ا' && c !== ' ' && c.length === 1);
    if (chars.length >= 3) {
        return chars.slice(0, 3).join(' - ');
    }
    return stripped.split('').join(' - ') || 'أ - ص - ل';
}

const WordMorphologyModal: React.FC<WordMorphologyModalProps> = ({
    word,
    surahNumber,
    surahName,
    ayahNumberInSurah,
    onClose,
    onSearchWord
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'irab' | 'tafsir'>('irab');
    const [morphology, setMorphology] = useState<MorphologyData | null>(null);

    const cleanWord = word
        .replace(/<[^>]*>/g, '')
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .trim();

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const verseKey = `${surahNumber}:${ayahNumberInSurah}`;

        Promise.all([
            fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/ar.jalalayn`).then(res => res.json()).catch(() => null),
            fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/ar.muyassar`).then(res => res.json()).catch(() => null)
        ]).then(([jalalaynRes, muyassarRes]) => {
            if (!isMounted) return;

            const jalalaynText = jalalaynRes?.data?.text || '';
            const muyassarText = muyassarRes?.data?.text || '';

            setMorphology({
                cleanWord,
                root: extractArabicRoot(cleanWord),
                irabText: jalalaynText || 'الإعراب والبيان الدقيق للآية الكريمة والمفردة.',
                tafsirText: muyassarText || 'التفسير الميسر والتبيان الدلالي للآية الكريمة.'
            });
            setLoading(false);
        }).catch(() => {
            if (!isMounted) return;
            setLoading(false);
        });

        return () => { isMounted = false; };
    }, [surahNumber, ayahNumberInSurah, cleanWord]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl border border-primary/30 p-5 sm:p-6 space-y-4 text-text-primary overflow-hidden max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-default flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-lg text-text-primary">التحليل الصرفي والإعراب</h3>
                            <p className="text-xs text-text-muted">{surahName || `سورة ${surahNumber}`} • الآية {ayahNumberInSurah}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary p-2 rounded-full hover:bg-surface-hover transition-colors"
                        title="إغلاق"
                    >
                        <ClearIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Word & Root Card */}
                <div className="flex items-center justify-between p-4 bg-surface-subtle rounded-2xl border border-primary/20 flex-shrink-0 gap-3">
                    <div>
                        <div className="text-xs text-text-muted mb-1 font-semibold">المفردة القرآنية:</div>
                        <span className="text-xl sm:text-2xl font-bold font-quran-title text-primary">
                            ﴿ {cleanWord} ﴾
                        </span>
                    </div>
                    <div className="text-left flex flex-col items-end">
                        <div className="text-xs text-text-muted mb-1 font-semibold">الجذر اللغوي:</div>
                        <button
                            onClick={() => {
                                const rawRoot = morphology?.root || '';
                                const rootSearchTerm = rawRoot.replace(/[\s\-\u0640]/g, '').replace(/[\u0622\u0623\u0625\u0671]/g, 'ا').replace(/هـ/g, 'ه');
                                if (rootSearchTerm) {
                                    onSearchWord(rootSearchTerm);
                                    onClose();
                                }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-mono font-bold text-sm rounded-xl border border-primary/30 dir-ltr transition-colors cursor-pointer"
                            title="بحث عن مواضع هذا الجذر اللغوي"
                        >
                            <SearchIcon className="w-3.5 h-3.5" />
                            <span>{morphology?.root || '...'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 bg-surface-subtle rounded-xl border border-border-default flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('irab')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'irab'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>الإعراب والبيان اللغوي (الجلالين)</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('tafsir')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'tafsir'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        <span>التفسير الميسر والمعنى</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-muted">
                            <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs">جاري جلب بيانات الإعراب والتفسير من المصادر المعتمدة...</span>
                        </div>
                    ) : (
                        <div className="p-4 bg-surface-subtle rounded-2xl border border-border-default space-y-2 leading-relaxed text-sm">
                            {activeTab === 'irab' ? (
                                <>
                                    <div className="text-xs font-bold text-primary flex items-center gap-1">
                                        📌 <span>الإعراب واللغويات (تفسير الجلالين):</span>
                                    </div>
                                    <p className="text-text-primary text-sm font-quran-text leading-loose">
                                        {morphology?.irabText}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="text-xs font-bold text-primary flex items-center gap-1">
                                        📖 <span>المعنى والتفسير (التفسير الميسر):</span>
                                    </div>
                                    <p className="text-text-primary text-sm font-quran-text leading-loose">
                                        {morphology?.tafsirText}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2 flex-shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                onSearchWord(cleanWord);
                                onClose();
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <SearchIcon className="w-4 h-4" />
                            <span>بحث بالكلمة ({cleanWord})</span>
                        </button>

                        <button
                            onClick={() => {
                                const rawRoot = morphology?.root || '';
                                const rootSearchTerm = rawRoot.replace(/[\s\-\u0640]/g, '').replace(/[\u0622\u0623\u0625\u0671]/g, 'ا').replace(/هـ/g, 'ه');
                                if (rootSearchTerm) {
                                    onSearchWord(rootSearchTerm);
                                    onClose();
                                }
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-surface-subtle border border-primary/40 text-primary font-bold text-xs hover:bg-primary/10 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            <span>بحث بالجذر ({morphology?.root ? morphology.root.replace(/[\s-]/g, '') : '...'})</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 rounded-xl bg-surface-subtle border border-border-default font-semibold text-xs hover:bg-surface-hover transition-colors cursor-pointer text-text-muted hover:text-text-primary"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WordMorphologyModal;
