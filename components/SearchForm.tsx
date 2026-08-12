import React, { useState, useRef } from 'react';
import { MicrophoneIcon, SearchIcon } from './icons';

interface SearchFormProps {
    onSearch: (query: string) => void;
    disabled?: boolean;
    initialQuery?: string;
}

interface PermissionModalState {
    show: boolean;
    type: 'request' | 'denied' | 'unsupported';
    title: string;
    message: string;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, disabled = false, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [isListening, setIsListening] = useState(false);
    const [modalState, setModalState] = useState<PermissionModalState>({ show: false, type: 'request', title: '', message: '' });
    const recognitionRef = useRef<any>(null);

    React.useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };
    
    const playTone = (frequency: number, duration: number) => {
        try {
            const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
            if (!audioCtx) return;

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.error("Web Audio API error:", e);
        }
    };

    const startSpeechRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        playTone(880, 0.15);

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            let transcript = event.results[0][0].transcript;
            transcript = transcript.replace(/[.?!؟,]/g, '').trim();
            setQuery(transcript);
            onSearch(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            playTone(523, 0.2);
            setIsListening(false);
            recognitionRef.current = null;
        };
        
        recognition.start();
    };

    const requestMicrophoneAccess = async () => {
        setModalState({ show: false, type: 'request', title: '', message: '' });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            // Remember that permission was granted
            localStorage.setItem('qran_mic_permission_prompted', 'true');
            startSpeechRecognition();
        } catch (err: any) {
            console.warn("Microphone access declined or unavailable:", err?.name || err);
            localStorage.removeItem('qran_mic_permission_prompted');
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setModalState({
                    show: true,
                    type: 'denied',
                    title: 'اذن الميكروفون حُظر أو تم رفضه',
                    message: 'تم رفض إذن الوصول للميكروفون في المتصفح. لاستخدام البحث الصوتي يُرجى السماح بالوصول للميكروفون من إعدادات المتصفح أو علامة القفل 🔒.'
                });
            } else {
                setModalState({
                    show: true,
                    type: 'denied',
                    title: 'تعذر الاتصال بالميكروفون',
                    message: 'لم يتم العثور على ميكروفون متصل أو حدث خطأ أثناء الوصول إليه.'
                });
            }
        }
    };
    
    const handleVoiceSearch = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setModalState({
                show: true,
                type: 'unsupported',
                title: 'خاصية غير مدعومة',
                message: 'عذراً، تقنية التعرف على الصوت غير مدعومة في متصفحك الحالي.'
            });
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        // If user already granted permission before in this browser session, attempt direct request
        const isPrompted = localStorage.getItem('qran_mic_permission_prompted');
        if (isPrompted === 'true') {
            requestMicrophoneAccess();
            return;
        }

        // Show confirmation dialog asking "السماح بالوصول" or "عدم السماح"
        setModalState({
            show: true,
            type: 'request',
            title: 'إذن استخدام الميكروفون',
            message: 'يحتاج التطبيق للوصول إلى الميكروفون لتسهيل عملية البحث عن السور والآيات بصوتك. هل ترغب في السماح بالوصول؟'
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex-grow w-full max-w-xl flex items-center">
                <div className="relative w-full">
                    <input
                        id="search-quran-input"
                        name="q"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={disabled ? "جاري تحميل بيانات البحث..." : "ابحث عن كلمة، أو أدخل مرجعاً مثل (البقرة ٢٥٥)..."}
                        className="w-full text-base h-10 pl-14 pr-4 bg-surface border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        aria-label="بحث في المصحف الشريف"
                        disabled={disabled}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={handleVoiceSearch} className={`p-1 text-text-subtle rounded-full ${isListening ? 'text-red-500 animate-pulse-mic' : 'hover:text-primary'} disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="بحث صوتي" title="بحث صوتي" disabled={disabled}>
                            <MicrophoneIcon className="w-4 h-4" />
                        </button>
                        <button type="submit" className="p-1 text-text-subtle hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" aria-label="بحث" disabled={disabled}>
                            <SearchIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>

            {/* Custom Permission / Voice Search Modal */}
            {modalState.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" dir="rtl">
                    <div className="bg-surface border border-border-default rounded-2xl p-6 max-w-md w-full shadow-2xl text-right space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                                <MicrophoneIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">{modalState.title}</h3>
                        </div>

                        <p className="text-sm text-text-secondary leading-relaxed">
                            {modalState.message}
                        </p>

                        {modalState.type === 'denied' && (
                            <div className="bg-surface-subtle p-3.5 rounded-xl border border-border-subtle text-xs text-text-muted space-y-2">
                                <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                                    💡 طريقة تفعيل إذن الميكروفون:
                                </div>
                                <ul className="list-disc list-inside space-y-1 pr-1 leading-normal">
                                    <li><strong>في المتصفح:</strong> انقر على رمز القفل 🔒 أو إعدادات الشريط بجوار عنوان الموقع (qran.top) ➔ الأذونات ➔ الميكروفون ➔ <b>سماح</b>.</li>
                                    <li><strong>في تطبيق الهاتف:</strong> الإعدادات ➔ التطبيقات ➔ تطبيق القرآن ➔ الأذونات ➔ الميكروفون ➔ <b>سماح</b>.</li>
                                </ul>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            {modalState.type === 'request' && (
                                <>
                                    <button
                                        onClick={requestMicrophoneAccess}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                                    >
                                        <MicrophoneIcon className="w-4 h-4" />
                                        <span>السماح بالوصول</span>
                                    </button>
                                    <button
                                        onClick={() => setModalState({ show: false, type: 'request', title: '', message: '' })}
                                        className="px-4 py-2.5 bg-surface-subtle text-text-muted border border-border-default rounded-xl text-sm font-semibold hover:bg-surface-hover hover:text-text-primary active:scale-95 transition-all cursor-pointer"
                                    >
                                        عدم السماح
                                    </button>
                                </>
                            )}

                            {modalState.type === 'denied' && (
                                <>
                                    <button
                                        onClick={requestMicrophoneAccess}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer"
                                    >
                                        إعادة المحاولة
                                    </button>
                                    <button
                                        onClick={() => setModalState({ show: false, type: 'request', title: '', message: '' })}
                                        className="px-4 py-2 bg-surface-subtle text-text-primary border border-border-default rounded-xl text-sm font-semibold hover:bg-surface-hover active:scale-95 transition-all cursor-pointer"
                                    >
                                        إلغاء
                                    </button>
                                </>
                            )}

                            {modalState.type === 'unsupported' && (
                                <button
                                    onClick={() => setModalState({ show: false, type: 'request', title: '', message: '' })}
                                    className="px-4 py-2 bg-surface-subtle text-text-primary border border-border-default rounded-xl text-sm font-semibold hover:bg-surface-hover active:scale-95 transition-all cursor-pointer"
                                >
                                    حسناً، فهمت
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SearchForm;