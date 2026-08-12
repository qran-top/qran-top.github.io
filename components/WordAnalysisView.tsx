import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SurahData } from '../types';
import { normalizeArabicText } from '../utils/text';
import { ChartBarIcon, CheckIcon, CopyIcon, SpinnerIcon, SparklesIcon, ComputerDesktopIcon, QueueListIcon, ClearIcon, ArrowUpTrayIcon, RefreshIcon, PlusIcon } from './icons';
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import PromptViewerModal from './analysis/PromptViewerModal';
import ApiKeyModal from './analysis/ApiKeyModal';


interface WordAnalysisViewProps {
    simpleCleanData: SurahData[];
    initialWord?: string;
}

interface ExampleWord {
    word: string;
    count: number;
}

interface AnalysisResult {
    bigram: string;
    occurrences: number;
    examples: ExampleWord[]; 
}

interface ParsedMeaning {
    meaning: string;
    status: 'idle' | 'saving' | 'saved';
}

interface AnalysisDoc {
    id: string;
    result: string;
    prompt: string;
    createdAt: any;
}

// Simplified Prompt - No placeholders needed
const DEFAULT_AI_INSTRUCTIONS = `أنت باحث لغوي محايد ودقيق.
المطلوب منك هو استنباط المعنى الدقيق للكلمة المذكورة أعلاه بناءً حصرياً على بيانات "المثاني" (الثنائيات الحرفية) المقدمة لك في الأسفل.

التعليمات:
1. ادرس كل مقطع ثنائي (Bigram) على حدة. انظر في الكلمات التي ورد فيها هذا المقطع، وحاول استنباط "المعنى الجذري" أو "الأثر الحسي/المعنوي" المشترك.
2. اكتب بجانب كل مقطع نتيجة دراستك له باختصار.
3. في النهاية، قم بجمع هذه الاستنتاجات لتكوين "صورة شاملة" أو "تعريف دقيق" للكلمة الأصلية.

شروط صارمة:
- الحيادية التامة: لا تستخدم قواميس أو معرفتك المسبقة. اعتمد فقط على البيانات (تأثير المقاطع في الكلمات الأخرى).
- ممنوع تحريف النتائج لتتوافق مع المعنى المعروف. اذا كانت البيانات تشير لمعنى مختلف، اكتبه كما هو.

الصيغة المطلوبة للإجابة:
- تحليل المقاطع:
  * [المقطع]: [الاستنتاج]
- الخلاصة التركيبية (معنى المثاني):
  [العبارة النهائية الجامعة]`;

const WordAnalysisView: React.FC<WordAnalysisViewProps> = ({ simpleCleanData, initialWord }) => {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // AI State from Hook
    const {
        isProcessing: isAiProcessing,
        aiResult,
        setAiResult,
        triggerAnalysis,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        handleApiKeySave
    } = useAiAnalysis(input);
    
    // UI state
    const [customPrompt, setCustomPrompt] = useState(DEFAULT_AI_INSTRUCTIONS);
    const [aiCopySuccess, setAiCopySuccess] = useState(false);
    const [parsedAiMeanings, setParsedAiMeanings] = useState<Map<string, ParsedMeaning>>(new Map());
    const [aiSummary, setAiSummary] = useState('');
    const [promptInView, setPromptInView] = useState<string | null>(null);

    const hasAnalyzedInitial = useRef(false);

    const getBigrams = (text: string): string[] => {
        const normalized = normalizeArabicText(text.trim()).replace(/\s+/g, '');
        const bigrams: string[] = [];
        if (normalized.length < 2) return [];
        
        for (let i = 0; i < normalized.length - 1; i++) {
            bigrams.push(normalized.substring(i, i + 2));
        }
        return bigrams;
    };

    const handleAnalyze = useCallback(async () => {
        if (!input.trim()) return;

        setIsAnalyzing(true);
        setResults([]);
        setProgress(0);
        setAiResult('');
        setParsedAiMeanings(new Map());
        setAiSummary('');

        const bigrams = getBigrams(input);
        const total = bigrams.length;
        
        if (total === 0) {
            alert("الرجاء إدخال كلمة مكونة من حرفين على الأقل.");
            setIsAnalyzing(false);
            return;
        }

        const newResults: AnalysisResult[] = [];

        for (let i = 0; i < total; i++) {
            const bigram = bigrams[i];
            
            await new Promise(resolve => setTimeout(resolve, 5));
            setProgress(Math.round(((i) / total) * 100));

            const wordCounts = new Map<string, number>();
            let totalBigramCount = 0;

            for (const surah of simpleCleanData) {
                for (const ayah of surah.ayahs) {
                    if (ayah.text && ayah.text.includes(bigram)) {
                        const words = ayah.text.split(' ');
                        for (const w of words) {
                            if (w.includes(bigram)) {
                                const currentCount = wordCounts.get(w) || 0;
                                wordCounts.set(w, currentCount + 1);
                                totalBigramCount++;
                            }
                        }
                    }
                }
            }

            const sortedExamples: ExampleWord[] = Array.from(wordCounts.entries())
                .map(([word, count]) => ({ word, count }))
                .sort((a, b) => b.count - a.count);

            newResults.push({
                bigram,
                occurrences: totalBigramCount,
                examples: sortedExamples
            });
        }

        setResults(newResults);
        setProgress(100);
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowDetails(false); // Default to collapsed
        }, 500);
    }, [input, simpleCleanData, setAiResult]);
    
    useEffect(() => {
        if (initialWord) {
            setInput(initialWord);
        }
    }, [initialWord]);

    useEffect(() => {
        if (initialWord && input === initialWord && !hasAnalyzedInitial.current) {
            hasAnalyzedInitial.current = true;
            handleAnalyze();
        }
    }, [input, initialWord, handleAnalyze]);

    const generateSummaryText = () => {
        if (results.length === 0) return '';
        let text = `تحليل مفردة: ${input}\n`;
        text += `التفكيك: ${results.map(r => r.bigram).join(' + ')}\n`;
        text += `========================\n`;
        
        results.forEach(r => {
            text += `الثنائية [${r.bigram}]: وردت ${r.occurrences} مرة (في ${r.examples.length} كلمة فريدة).\n`;
            
            const examplesToExport = r.examples;
            
            const examplesStr = examplesToExport.map(e => `${e.word} (${e.count})`).join('، ');
            
            text += `الأمثلة: ${examplesStr}\n`;
            text += `------------------------\n`;
        });
        
        return text;
    };

    const handleCopy = () => {
        const text = generateSummaryText();
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const parseAiResult = useCallback((text: string) => {
        const newMeanings = new Map<string, ParsedMeaning>();
        const summaryRegex = /- الخلاصة التركيبية \(معنى المثاني\):\s*([\s\S]+)/;
        const summaryMatch = text.match(summaryRegex);
        setAiSummary(summaryMatch ? summaryMatch[1].trim() : "");

        const bigramSectionRegex = /- تحليل المقاطع:\s*([\s\S]*?)(?=- الخلاصة التركيبية|$)/;
        const bigramSectionMatch = text.match(bigramSectionRegex);

        if (bigramSectionMatch && bigramSectionMatch[1]) {
            const bigramRegex = /\*\s*\[([^\]]+)\]:\s*([^\n*]+)/g;
            let match;
            while ((match = bigramRegex.exec(bigramSectionMatch[1])) !== null) {
                const bigram = match[1].trim();
                const meaning = match[2].trim();
                newMeanings.set(bigram, { meaning, status: 'idle' });
            }
        }
        setParsedAiMeanings(newMeanings);
    }, []);

    useEffect(() => {
        if (aiResult) {
            parseAiResult(aiResult);
        }
    }, [aiResult, parseAiResult]);

    const handleAiAnalysis = () => {
        if (!input || results.length === 0) return;
        
        let dataString = "";
        results.forEach(r => {
            const topExamples = r.examples.slice(0, 30).map(e => e.word).join("، ");
            dataString += `- الثنائية (${r.bigram}): وردت في كلمات مثل: [${topExamples}]\n`;
        });
        
        triggerAnalysis(customPrompt, dataString);
    };

    const handleAiCopy = () => {
        navigator.clipboard.writeText(aiResult).then(() => {
            setAiCopySuccess(true);
            setTimeout(() => setAiCopySuccess(false), 2000);
        });
    };
    
    const renderAiContent = () => {
        return (
            <div>
                <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-semibold text-text-muted">تعليمات التحليل (Prompt):</label>
                        <span className="text-xs text-text-subtle bg-surface-subtle px-2 py-1 rounded">
                            البيانات الإحصائية والكلمة تضاف تلقائياً عند التحليل.
                        </span>
                    </div>
                    <textarea 
                        id="custom-prompt-textarea"
                        name="customPrompt"
                        aria-label="تعليمات التحليل"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="w-full h-32 p-3 text-sm border border-blue-200 dark:border-blue-900 rounded-md bg-blue-50 dark:bg-blue-900/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-secondary"
                        placeholder="اكتب التعليمات للذكاء الاصطناعي هنا..."
                    />
                </div>
                <button
                    onClick={handleAiAnalysis}
                    disabled={isAiProcessing}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-6"
                >
                    {isAiProcessing ? <SpinnerIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
                    <span>{isAiProcessing ? 'جاري التحليل والاستنباط...' : 'تطبيق معنى المثاني'}</span>
                </button>
                {(isAiProcessing || aiResult) && renderParsedAiResult()}
            </div>
        );
    };

    const renderParsedAiResult = () => (
        <div className="bg-surface border border-blue-500/50 p-4 rounded-lg shadow-inner relative animate-fade-in">
            <div className="flex justify-between items-center mb-3 border-b border-border-subtle pb-2">
                <h4 className="font-bold text-blue-700 dark:text-blue-300">نتيجة التحليل:</h4>
                <button
                    onClick={handleAiCopy}
                    className="flex items-center gap-2 px-2 py-1 text-xs bg-surface-hover rounded border border-border-default hover:text-blue-600 transition-colors"
                >
                    {aiCopySuccess ? <CheckIcon className="w-3 h-3 text-green-500"/> : <CopyIcon className="w-3 h-3"/>}
                    <span>نسخ النتيجة</span>
                </button>
            </div>
            {isAiProcessing && !aiResult && (
                <div className="flex justify-center items-center h-40">
                    <SpinnerIcon className="w-10 h-10 text-blue-500"/>
                </div>
            )}
            
            {parsedAiMeanings.size > 0 && !isAiProcessing ? (
                <div className="space-y-4">
                    <div>
                        <h5 className="font-bold text-text-primary mb-2">تحليل المقاطع:</h5>
                        <ul className="space-y-2">
                            {Array.from(parsedAiMeanings.entries()).map(([bigram, data]) => (
                                <li key={bigram} className="flex items-start gap-3 p-2 bg-surface-subtle rounded-md border border-border-subtle">
                                    <span className="font-bold text-lg text-primary-text mt-1">[{bigram}]:</span>
                                    <p className="flex-grow text-text-primary pt-1">{data.meaning}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {aiSummary && (
                        <div className="pt-4 mt-4 border-t border-border-default">
                            <h5 className="font-bold text-text-primary mb-2">الخلاصة التركيبية (معنى المثاني):</h5>
                            <p className="whitespace-pre-wrap text-text-secondary leading-relaxed font-medium bg-surface-subtle p-3 rounded-md">{aiSummary}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="whitespace-pre-wrap text-text-primary leading-relaxed font-medium">
                    {aiResult}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto px-4 py-8">
            {isApiKeyModalOpen && (
                <ApiKeyModal
                    onClose={() => setIsApiKeyModalOpen(false)}
                    onSave={(key) => {
                        handleApiKeySave(key);
                        handleAiAnalysis(); // retry
                    }}
                />
            )}
            {promptInView && <PromptViewerModal prompt={promptInView} onClose={() => setPromptInView(null)} />}
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-primary-text-strong flex items-center justify-center gap-3">
                    <ChartBarIcon className="w-10 h-10" />
                    تحليل مفردة
                </h1>
                <p className="text-text-secondary mt-2">
                    أداة لتفكيك الكلمات واستكشاف الثنائيات الحرفية في القرآن الكريم، مرتبة حسب الأكثر شيوعاً.
                </p>
            </header>

            <main className="bg-surface p-6 sm:p-8 rounded-lg shadow-md border border-border-default">
                <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="mb-8">
                    <div className="flex flex-col gap-4">
                        <input
                            id="word-analysis-input"
                            name="wordInput"
                            aria-label="اكتب كلمة للتحليل"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="اكتب كلمة هنا (مثل إبراهيم)، أو ابحث في القرآن واستخدم زر التحليل من النتائج"
                            className="w-full p-3 text-lg border border-border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isAnalyzing}
                        />
                        <button
                            type="submit"
                            disabled={isAnalyzing || !input.trim()}
                            className="w-full px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? <SpinnerIcon className="w-5 h-5" /> : <ChartBarIcon className="w-5 h-5" />}
                            <span>تحليل</span>
                        </button>
                        <p className="text-xs text-text-muted text-center">
                            * النتائج تظهر مرتبة من الأكثر تكراراً إلى الأقل.
                        </p>
                    </div>
                </form>

                {isAnalyzing && (
                    <div className="mb-8">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-primary-text">
                                جاري المسح الشامل...
                            </span>
                            <span className="text-sm font-medium text-primary-text">{progress}%</span>
                        </div>
                        <div className="w-full bg-surface-subtle rounded-full h-2.5">
                            <div className="h-2.5 rounded-full transition-all duration-300 bg-primary" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {results.length > 0 && !isAnalyzing && (
                    <div className="space-y-8 animate-fade-in">
                        
                        <div className="bg-surface-subtle p-4 rounded-lg border border-border-default">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-text-primary">ملخص التحليل (قابل للنسخ)</h3>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface hover:bg-surface-hover rounded-md border border-border-default transition-colors"
                                >
                                    {copySuccess ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4"/>}
                                    <span>{copySuccess ? 'تم النسخ' : 'نسخ النص كاملاً'}</span>
                                </button>
                            </div>
                            <textarea
                                id="summary-output-textarea"
                                name="summaryOutput"
                                aria-label="الملخص النصي للنتائج"
                                readOnly
                                value={generateSummaryText()}
                                className="w-full h-48 p-3 text-sm font-mono border border-border-default rounded-md bg-surface text-text-secondary focus:outline-none resize-none"
                                dir="rtl"
                            />
                        </div>

                        {(results.length > 0) && (
                            <div className="border-t-2 border-blue-500/30 pt-6 mt-8">
                                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                                    <ComputerDesktopIcon className="w-6 h-6" />
                                    معنى المثاني (تحليل الذكاء الاصطناعي)
                                </h3>
                                {renderAiContent()}
                            </div>
                        )}

                        <div className="flex justify-center">
                            <button 
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-semibold"
                            >
                                <QueueListIcon className="w-5 h-5" />
                                <span>{showDetails ? 'إخفاء التفاصيل' : 'عرض النتائج التفصيلية (المثاني)'}</span>
                            </button>
                        </div>

                        {showDetails && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
                                {results.map((result, index) => {
                                    const displayLimit = 50;
                                    const displayedExamples = result.examples.slice(0, displayLimit);
                                    const hiddenCount = result.examples.length - displayedExamples.length;

                                    return (
                                        <div key={index} className="bg-surface border border-border-default p-4 rounded-lg hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-center mb-3 border-b border-border-subtle pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-primary-text-strong font-bold px-3 py-1 rounded-md text-lg bg-primary/10`}>
                                                        {result.bigram}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-sm font-bold text-text-primary">
                                                        {result.occurrences} تكرار
                                                    </span>
                                                    <span className="text-xs text-text-muted">
                                                        في {result.examples.length} كلمة فريدة
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted mb-2">أهم الكلمات (مرتبة بالتكرار):</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {displayedExamples.length > 0 ? (
                                                        displayedExamples.map((item, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-1 text-sm bg-surface-subtle border border-border-subtle text-text-secondary px-2 py-1 rounded hover:bg-primary/10 transition-colors" title={`${item.count} مرات`}>
                                                                <span>{item.word}</span>
                                                                <span className="text-[10px] font-bold bg-surface-active px-1.5 rounded-full text-text-muted">{item.count}</span>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-text-muted italic">لا توجد نتائج</span>
                                                    )}
                                                    
                                                    {hiddenCount > 0 && (
                                                        <span className="text-xs font-bold text-text-muted px-2 py-1 bg-surface-active rounded-full" title="موجودة في النسخ الكامل">
                                                            +{hiddenCount} أخرى...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WordAnalysisView;
