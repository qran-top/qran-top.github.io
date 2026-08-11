import React from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { FontSize, FontStyleType, BrowsingMode } from '../../types';
import { BookOpenIcon, CheckIcon } from '../icons';

const FONT_SIZES: { id: FontSize; label: string; px: string }[] = [
    { id: 'xs', label: 'صغير جداً', px: '16px' },
    { id: 'sm', label: 'صغير', px: '20px' },
    { id: 'md', label: 'متوسط', px: '24px' },
    { id: 'lg', label: 'كبير', px: '28px' },
    { id: 'xl', label: 'كبير جداً', px: '32px' },
    { id: 'xxl', label: 'ضخم', px: '40px' },
];

const FONT_STYLES: { id: FontStyleType; name: string; description: string; className: string }[] = [
    { id: 'imlai_1', name: 'الخط الإملائي النظامي (التفاعلي السريع)', description: 'خط عالي الأداء مع وضوح عالي للتشكيل والحروف', className: 'font-quran-simple' },
    { id: 'uthmani', name: 'خط الحفص بالرسم العثماني الأصيل', description: 'مطابق لرسم مصحف المدينة المنورة مع كافة علامات الضبط والوقف', className: 'font-quran-title' },
    { id: 'imlai_2', name: 'الخط النسخي الأنيق', description: 'نسق كتابي كلاسيكي هادئ ومريح للعين', className: 'font-sans' },
];

const ReadingSettings: React.FC = () => {
    const { 
        fontSize, setFontSize, 
        fontStyle, setFontStyle, 
        browsingMode, setBrowsingMode, 
        selectedEdition, setSelectedEdition,
        enableTajweed, setEnableTajweed,
        enableWordAudio, setEnableWordAudio,
        wordClickBehavior, setWordClickBehavior,
        enableMorphology, setEnableMorphology
    } = useSettingsContext();

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">إعدادات القراءة والخطوط</h2>
                <p className="text-sm text-text-secondary">خصص نمط خط المصحف وحجمه وطريقة التصفح والتفاعل مع المفردات بما يضمن أقصى أداء وراحة لعينيك.</p>
            </div>

            {/* Word Click Behavior Section */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-primary/20 space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">سلوك الضغط والنقر على الكلمة</h3>
                    <p className="text-xs text-text-muted">حدد النتيجة المفضلة لديك عند الضغط على أي كلمة داخل الآية الكريمة</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => setWordClickBehavior('auto')}
                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            wordClickBehavior === 'auto'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base flex items-center gap-1.5">
                                ⚡ <span>تلقائي (حسب الخط)</span>
                            </div>
                            <div className="text-xs text-text-muted mt-2 leading-relaxed">
                                الإملائي 1 = بحث مباشر فوراً.<br/>
                                الإملائي 2 والعثماني = قائمة الخيارات.
                            </div>
                        </div>
                        {wordClickBehavior === 'auto' && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setWordClickBehavior('direct_search')}
                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            wordClickBehavior === 'direct_search'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base flex items-center gap-1.5">
                                🔍 <span>بحث مباشر فوراً</span>
                            </div>
                            <div className="text-xs text-text-muted mt-2 leading-relaxed">
                                إجراء بحث المثاني وتكرارات الكلمة فور الضغط عليها في جميع الأوضاع.
                            </div>
                        </div>
                        {wordClickBehavior === 'direct_search' && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setWordClickBehavior('show_menu')}
                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            wordClickBehavior === 'show_menu'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base flex items-center gap-1.5">
                                📋 <span>إظهار قائمة خيارات الكلمة</span>
                            </div>
                            <div className="text-xs text-text-muted mt-2 leading-relaxed">
                                إظهار قائمة منبثقة تتيح الاختيار بين (البحث، الإعراب، الاستماع الصوتية).
                            </div>
                        </div>
                        {wordClickBehavior === 'show_menu' && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Quran.com API v4 Features Options */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                        ميزات التفاعل اللغوي واللفظي
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Tajweed Mode Toggle */}
                    <div className={`p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        enableTajweed ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs' : 'bg-surface border-border-default'
                    }`}
                    onClick={() => setEnableTajweed(!enableTajweed)}
                    >
                        <div className="space-y-1">
                            <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                🎨 <span>التجويد الملون</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                تظليل أحكام التجويد بألوان مميزة.
                            </p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={enableTajweed} 
                            onChange={() => {}} 
                            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer flex-shrink-0" 
                        />
                    </div>

                    {/* Word Audio Pronunciation Toggle */}
                    <div className={`p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        enableWordAudio ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs' : 'bg-surface border-border-default'
                    }`}
                    onClick={() => setEnableWordAudio(!enableWordAudio)}
                    >
                        <div className="space-y-1">
                            <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                🔊 <span>نطق الكلمة المرتل</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                نطق نبرة الكلمة عند ضغطها.
                            </p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={enableWordAudio} 
                            onChange={() => {}} 
                            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer flex-shrink-0" 
                        />
                    </div>

                    {/* Word Morphology & Grammar Toggle */}
                    <div className={`p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        enableMorphology ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs' : 'bg-surface border-border-default'
                    }`}
                    onClick={() => setEnableMorphology(!enableMorphology)}
                    >
                        <div className="space-y-1">
                            <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                📐 <span>التحليل الصرفي والإعراب</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                عرض الجذر، الإعراب، والنوع اللغوي.
                            </p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={enableMorphology} 
                            onChange={() => {}} 
                            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer flex-shrink-0" 
                        />
                    </div>
                </div>
            </div>


            {/* Live Preview Box */}
            <div className="p-6 bg-surface-subtle border border-border-default rounded-2xl shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">معاينة فورية للخط</span>
                <div className="text-center py-6 px-4 bg-surface rounded-xl border border-border-subtle my-2 shadow-inner">
                    <p className={`text-text-primary leading-loose font-quran-title transition-all duration-200 text-${fontSize}`}>
                        ﴿ أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ۝ وَوَضَعْنَا عَنكَ وِزْرَكَ ۝ الَّذِي أَنقَضَ ظَهْرَكَ ۝ وَرَفَعْنَا لَكَ ذِكْرَكَ ﴾
                    </p>
                </div>
            </div>

            {/* Font Size Selector */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">حجم خط الآيات</h3>
                        <p className="text-xs text-text-muted">اختر الحجم الأنسب لعينيك أثناء القراءة والتدبر</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {FONT_SIZES.map((size) => (
                        <button
                            key={size.id}
                            onClick={() => setFontSize(size.id)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                                fontSize === size.id
                                    ? 'bg-primary text-white border-primary shadow-xs font-bold'
                                    : 'bg-surface text-text-primary border-border-default hover:border-primary/40'
                            }`}
                        >
                            <div className="text-sm">{size.label}</div>
                            <div className="text-xs opacity-75 mt-0.5" dir="ltr">{size.px}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Family / Style */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">نوع الخط القرآني</h3>
                    <p className="text-xs text-text-muted">اختر نوع الخط الافتراضي المستخدم في عرض الآيات</p>
                </div>
                <div className="space-y-3">
                    {FONT_STYLES.map((style) => (
                        <label
                            key={style.id}
                            onClick={() => setFontStyle(style.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                                fontStyle === style.id
                                    ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                    : 'bg-surface border-border-default hover:border-border-default/80'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                                    fontStyle === style.id ? 'border-primary bg-primary text-white' : 'border-border-default'
                                }`}>
                                    {fontStyle === style.id && <CheckIcon className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                    <div className="font-bold text-base text-text-primary">{style.name}</div>
                                    <div className="text-xs text-text-muted mt-0.5">{style.description}</div>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Default Quran Text Mode (Uthmani vs Imlai) */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">المصحف الافتراضي القائم</h3>
                    <p className="text-xs text-text-muted">التحكم في نص المصحف الأساسي المعروض عند تصفح السور والصفحات</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => setSelectedEdition('quran-uthmani-quran-academy')}
                        className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            selectedEdition.includes('uthmani')
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base">الرسم العثماني الأصيل</div>
                            <div className="text-xs text-text-muted mt-1 leading-relaxed">
                                يعرض النص بالرسم المعتمد لمصحف المدينة مع كافة علامات الضبط والوقف والمدود.
                            </div>
                        </div>
                        {selectedEdition.includes('uthmani') && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل الآن
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setSelectedEdition('quran-simple-clean')}
                        className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            selectedEdition.includes('simple-clean')
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base">الرسم الإملائي المبسط</div>
                            <div className="text-xs text-text-muted mt-1 leading-relaxed">
                                نص مبسط سريع التحميل مخصص للبحث والتدبر المباشر ووضوح القراءة.
                            </div>
                        </div>
                        {selectedEdition.includes('simple-clean') && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل الآن
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Browsing Mode */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">نمط التصفح الافتراضي</h3>
                    <p className="text-xs text-text-muted">اختر طريقة التنقل بين آيات السورة الكريمة</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => setBrowsingMode('full')}
                        className={`p-4 rounded-xl border text-right transition-all ${
                            browsingMode === 'full'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div className="font-bold text-text-primary text-base">العرض المستمر الشامل (كل السورة)</div>
                        <div className="text-xs text-text-muted mt-1">عرض جميع آيات السورة في قائمة واحدة متصلة وسلسة.</div>
                    </button>

                    <button
                        onClick={() => setBrowsingMode('page')}
                        className={`p-4 rounded-xl border text-right transition-all ${
                            browsingMode === 'page'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div className="font-bold text-text-primary text-base">التصفح حسب صفحات المصحف</div>
                        <div className="text-xs text-text-muted mt-1">تقسيم العرض حسب أرقام صفحات المصحف الشريف (604 صفحة).</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReadingSettings;
