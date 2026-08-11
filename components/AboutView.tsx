import React from 'react';
import { 
    LogoIcon, SearchIcon, ShieldCheckIcon, UsersIcon, ArrowLeftIcon, 
    UserCircleIcon, MenuIcon, SpeakerWaveIcon, BookmarkIcon, SparklesIcon, CogIcon,
    BookOpenIcon
} from './icons';
import { openExternalLink } from '../utils/navigation';

const AboutView: React.FC = () => {
    
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (href) {
            window.location.hash = href;
        }
    };

    const FeatureItem: React.FC<{icon: React.ReactNode, title: string, description: React.ReactNode}> = ({icon, title, description}) => (
        <li className="bg-surface p-6 rounded-2xl shadow-xs border border-border-default flex items-start gap-4 hover:border-primary/40 transition-all">
            <div className="text-primary flex-shrink-0 p-2 rounded-xl bg-primary/10 mt-1">{icon}</div>
            <div>
                <h3 className="font-bold text-lg text-text-primary">{title}</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{description}</p>
            </div>
        </li>
    );

    const SignItem: React.FC<{symbol: string, title: string, description: string, symbolStyle?: React.CSSProperties}> = ({symbol, title, description, symbolStyle}) => (
        <li className="bg-surface p-4 rounded-xl shadow-xs border border-border-default flex items-center gap-4 hover:border-primary/30 transition-all">
             <div className="sign-symbol flex-shrink-0 w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center font-quran-title text-xl text-primary font-bold" style={symbolStyle}>
                {symbol}
            </div>
            <div>
                <h3 className="font-bold text-base text-text-primary">{title}</h3>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-snug">{description}</p>
            </div>
        </li>
    );
    
    return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto px-4 py-8">
            <header className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-xs">
                    <LogoIcon className="w-16 h-16 text-primary mx-auto"/>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">عن تطبيق QRAN.TOP</h1>
                <p className="text-lg sm:text-xl text-text-secondary mt-2 max-w-2xl mx-auto">
                    منصة قرآنية متكاملة تجمع بين أصالة الرسم العثماني وقوة البحث والتدبر الرقمي
                </p>
            </header>
            
            <main className="space-y-12">
                <section id="general-idea" className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-default shadow-xs">
                    <h2 className="text-2xl font-bold mb-4 text-text-primary border-r-4 border-primary pr-3">رؤية التطبيق وفكرته</h2>
                    <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
                        تطبيق <strong>QRAN.TOP</strong> هو مستكشف قرآني حديث صُمم لخدمة قارئ القرآن الكريم والباحث فيه. يجمع التطبيق بين دقة القراءة العثمانية المعتمدة للآيات مع التشكيل الكامل، وبين المحرك الإملائي المتقدم للبحث الفوري والسريع. يهدف التطبيق لتقديم تجربة تدبر مريحة وشاملة تدعم الاستماع مع كبار القراء، وتصفح التفاسير والترجمات، وتدوين الملاحظات والتدبرات الشخصية بأمان.
                    </p>
                </section>

                <section id="quran-signs">
                    <h2 className="text-2xl font-bold mb-6 text-text-primary border-r-4 border-primary pr-3">دليل علامات المصحف الشريف</h2>
                    <p className="text-text-secondary mb-6 leading-relaxed">
                        يحتوي المصحف الشريف بالرسم العثماني على علامات واصطلاحات ضبط مخصصة لتيسير القراءة وضبط أصول الوقف والتجويد:
                    </p>
                    
                    <h3 className="text-xl font-bold mb-4 text-text-primary flex items-center gap-2">
                        <BookOpenIcon className="w-5 h-5 text-primary" />
                        <span>أولاً: علامات الوقف</span>
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <SignItem symbol="مـ" title="الوقف اللازم" description="يلزم الوقف هنا لبيان المعنى ومنع التباسه." />
                        <SignItem symbol="لا" title="الوقف الممنوع" description="يحرم أو يكره الوقف هنا لاتصال المعنى بما بعده." />
                        <SignItem symbol="ج" title="الوقف الجائز" description="يجوز الوقف ويجوز الوصل بمستوى متساوٍ." />
                        <SignItem symbol="صلى" title="الوصل أولى" description="يجوز الوقف، ولكن وصل الكلام أفضل للمعنى." />
                        <SignItem symbol="قلى" title="الوقف أولى" description="يجوز الوصل، ولكن الوقف أتم وأولى." />
                        <SignItem symbol="∴ ∴" title="وقف التعانق" description="إذا وقفت على الموضع الأول لا تقف على الثاني، والعكس." symbolStyle={{fontSize: '0.9rem'}}/>
                    </ul>

                    <h3 className="text-xl font-bold mb-4 pt-4 border-t border-border-default text-text-primary flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        <span>ثانياً: علامات التجويد والضبط</span>
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SignItem symbol="~" title="علامة المد" description="توضع فوق الحرف للدلالة على مد زائد عن المد الطبيعي." />
                        <SignItem symbol="ۢ" title="الميم الصغيرة (الإقلاب)" description="تدل على إقلاب النون الساكنة أو التنوين ميماً عند الباء." />
                        <SignItem symbol="حـ" title="رأس الخاء (الإظهار)" description="تدل على السكون المظهر ووجوب بيان الحرف." />
                        <SignItem symbol="○" title="الصفر المستدير" description="يدل على زيادة الحرف وعدم نطقه وصلاً ولا وقفا." />
                    </ul>
                </section>

                <section id="key-features">
                    <h2 className="text-2xl font-bold mb-6 text-text-primary border-r-4 border-primary pr-3">أبرز مميزات التطبيق</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FeatureItem icon={<MenuIcon className="w-6 h-6"/>} title="تصفح مرن وفهرسة متكاملة" description="تصفح المصحف بالسورة، الصفحة، الجزء، أو الحزب، مع القراءة بالرسم العثماني الأصيل والإملائي المبسط." />
                        <FeatureItem icon={<SpeakerWaveIcon className="w-6 h-6"/>} title="استماع صوتي متكامل" description="مشغل صوتي للاستماع لتلاوات خاشعة من نخبة من كبار القراء، مع التحكم بالتشغيل والانتقال بين الآيات." />
                        <FeatureItem icon={<SearchIcon className="w-6 h-6"/>} title="محيط البحث والتحليل" description="محرك بحث ذكي وسريع بالكلمات أو بالصوت، مع تحليل جذور المفردات وإحصائيات التكرار عبر المصحف." />
                        <FeatureItem icon={<BookmarkIcon className="w-6 h-6"/>} title="دفتر التدبر والمجموعات" description="احفظ الآيات المفضلة، ودوّن تدبراتك وملاحظاتك الشخصية، مع إمكانية التصدير والاستيراد بأمان." />
                        <FeatureItem icon={<SparklesIcon className="w-6 h-6"/>} title="معنى المثاني والذكاء الاصطناعي" description="استكشف الروابط اللغوية والتفسيرية العميقة بين الآيات المتشابهة بدعم تقنيات الذكاء الاصطناعي." />
                        <FeatureItem icon={<CogIcon className="w-6 h-6"/>} title="تخصيص كامل للواجهة" description="اختر من بين عدة خطوط قرآنية، وتحكم في الحجم، والمظهر (فاتح/داكن)، مع تخصيص التفاسير والترجمات." />
                        <FeatureItem icon={<UsersIcon className="w-6 h-6"/>} title="ختمات ونقاشات قرآنية" description="شارك في ختمات قرآنية جماعية، واطلع على النقاشات المثرية حول مفردات القرآن الكريم." />
                        <FeatureItem icon={<ShieldCheckIcon className="w-6 h-6"/>} title="تطبيق ويب متتقدم (PWA)" description="يعمل على كل الأجهزة والهواتف، ويمكن تثبيته على الشاشة الرئيسية وتصفحه بسرعة فائقة." />
                    </ul>
                </section>

                <section id="ai-api-key">
                    <h2 className="text-2xl font-bold mb-4 text-text-primary border-r-4 border-primary pr-3">مفتاح الذكاء الاصطناعي (Gemini API)</h2>
                    <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-default shadow-xs space-y-4">
                        <p className="text-text-secondary leading-relaxed">
                            لتفعيل الميزات المتقدمة القائمة على الذكاء الاصطناعي مثل تحليل المعاني العميقة والربط بين الآيات، يمكنك استخدام مفتاح API مجاني خاص بك من Google AI Studio.
                        </p>
                        <h3 className="text-lg font-bold text-text-primary pt-2">خطوات الحصول على المفتاح:</h3>
                        <ol className="list-decimal pr-6 text-text-secondary space-y-2 leading-relaxed">
                            <li>افتح موقع <a href="https://aistudio.google.com/app/apikey" onClick={(e) => openExternalLink(e, "https://aistudio.google.com/app/apikey")} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Google AI Studio</a>.</li>
                            <li>سجل دخولك بحساب Google وانقر على <strong>Create API key</strong>.</li>
                            <li>انسخ المفتاح الظاهر وانسخه داخل التطبيق في قسم <strong>الإعدادات &larr; الذكاء الاصطناعي</strong>.</li>
                        </ol>
                        <div className="mt-4 p-4 bg-amber-500/10 border-r-4 border-amber-500 text-sm text-text-primary rounded-r-xl">
                           <strong>تنويه للأمان:</strong> يتم حفظ المفتاح في التخزين المحلي لمتصفحك فقط ولا يتم إرساله أو مشاركته مع أي طرف ثالث.
                        </div>
                    </div>
                </section>

                <section id="sources">
                    <h2 className="text-2xl font-bold mb-4 text-text-primary border-r-4 border-primary pr-3">مصادر البيانات والشفافية</h2>
                    <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border-default shadow-xs space-y-4">
                        <p className="text-text-secondary leading-relaxed">
                            يعتمد التطبيق على المصادر الموثوقة والمفتوحة للنصوص والتلاوات القرآنية:
                        </p>
                        <ul className="list-disc pr-6 space-y-2 text-sm text-text-muted leading-relaxed">
                            <li><strong>النص القرآني والتفاسير:</strong> مستمدة من واجهات المجمعات المعتمدة عبر <a href="https://alquran.cloud/api" onClick={(e) => openExternalLink(e, "https://alquran.cloud/api")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">alquran.cloud</a>.</li>
                            <li><strong>التلاوات الصوتية:</strong> مقدمة عبر شبكات التوزيع والمكتبات الصوتية المفتوحة مثل <a href="https://everyayah.com/" onClick={(e) => openExternalLink(e, "https://everyayah.com/")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">everyayah.com</a> و <a href="https://cdn.islamic.network/" onClick={(e) => openExternalLink(e, "https://cdn.islamic.network/")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">islamic.network</a>.</li>
                        </ul>
                    </div>
                </section>

                <section className="text-center pt-4">
                     <div className="inline-flex flex-col items-center gap-3 p-6 bg-surface rounded-3xl border border-border-default shadow-xs max-w-lg mx-auto">
                        <UserCircleIcon className="w-14 h-14 text-primary"/>
                        <div>
                            <p className="font-bold text-text-primary text-base">
                                تم التطوير بواسطة <a href="https://aboharon.com" onClick={(e) => openExternalLink(e, "https://aboharon.com")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aboharon.com</a>
                            </p>
                            <p className="text-xs text-text-muted mt-1">حقوق الطبع والتحديث محفوظة &copy; 2026</p>
                        </div>
                        <a href="https://t.me/aboharon_com" onClick={(e) => openExternalLink(e, "https://t.me/aboharon_com")} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                            للتواصل والإبلاغ عن أي ملاحظات عبر تلغرام
                        </a>
                    </div>
                </section>
            </main>
            
            <footer className="mt-12 pt-8 border-t border-border-default text-center">
                 <a href="#/" onClick={handleLinkClick} className="inline-flex items-center gap-2 text-base font-bold text-primary hover:text-primary-hover transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>العودة إلى الفهرس الرئيسي</span>
                </a>
            </footer>
        </div>
    );
};

export default AboutView;
