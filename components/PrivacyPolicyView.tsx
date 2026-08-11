import React, { useState, useEffect } from 'react';
import { openExternalLink } from '../utils/navigation';

const privacyStyles = `
    .qran-top-privacy-body {
        font-family: 'Tajawal', sans-serif;
        background-color: var(--color-background);
        color: var(--color-text-primary);
        line-height: 1.8;
        margin: 0;
        padding: 0;
    }
    .qran-top-privacy-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 2.5rem;
        background-color: var(--color-surface);
        border-radius: 1.5rem;
        border: 1px solid var(--color-border-default);
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .qran-top-privacy-body header {
        border-bottom: 2px solid var(--color-primary);
        padding-bottom: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
    }
    .qran-top-privacy-body h1 {
        color: var(--color-primary-text-strong);
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
    }
    .qran-top-privacy-body h2 {
        color: var(--color-primary-text);
        font-size: 1.6rem;
        font-weight: 700;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--color-border-subtle);
        padding-bottom: 0.5rem;
    }
    .qran-top-privacy-body h3 {
        color: var(--color-text-primary);
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.75rem;
        margin-bottom: 0.75rem;
    }
    .qran-top-privacy-body p, .qran-top-privacy-body li {
        font-size: 1.05rem;
        margin-bottom: 1rem;
        color: var(--color-text-secondary);
    }
    .qran-top-privacy-body ul {
        padding-right: 22px;
    }
    .qran-top-privacy-body strong {
        color: var(--color-text-primary);
    }
    .qran-top-privacy-body a {
        color: var(--color-primary-text);
        text-decoration: none;
        font-weight: 600;
    }
    .qran-top-privacy-body a:hover {
        text-decoration: underline;
    }
    .qran-top-privacy-body footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--color-border-default);
        color: var(--color-text-muted);
    }
    .qran-top-privacy-body .lang-en {
        direction: ltr;
        text-align: left;
        font-family: system-ui, -apple-system, Roboto, sans-serif;
    }
    .qran-top-privacy-body .lang-en ul {
         padding-right: 0;
         padding-left: 22px;
    }
    .qran-top-privacy-body .lang-toggle {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    .qran-top-privacy-body .lang-toggle button {
        background-color: var(--color-surface-hover);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
        padding: 0.5rem 1.25rem;
        border-radius: 9999px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    .qran-top-privacy-body .lang-toggle button.active {
        background-color: var(--color-primary);
        color: #ffffff;
        border-color: var(--color-primary);
    }
`;

const PrivacyPolicyView: React.FC = () => {
    const [lang, setLang] = useState<'ar' | 'en'>('ar');

    useEffect(() => {
        const originalLang = document.documentElement.lang;
        const originalDir = document.documentElement.dir;

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        return () => {
            document.documentElement.lang = originalLang;
            document.documentElement.dir = originalDir;
        };
    }, [lang]);

    const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = '#/';
    }

    return (
        <>
            <style>{privacyStyles}</style>
            <div className="qran-top-privacy-body animate-fade-in">
                <div className="qran-top-privacy-container">
                    <header>
                        <h1 id="header-title">{lang === 'ar' ? 'سياسة الخصوصية لتطبيق QRAN.TOP' : 'Privacy Policy - QRAN.TOP'}</h1>
                        <p id="header-date" className="text-sm mt-2 opacity-80">{lang === 'ar' ? 'آخر تحديث: 11 أغسطس 2026' : 'Last updated: August 11, 2026'}</p>
                    </header>
                    
                    <div className="lang-toggle">
                        <button id="btn-ar" className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>العربية</button>
                        <button id="btn-en" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
                    </div>

                    <div id="arabic-content" style={{ display: lang === 'ar' ? 'block' : 'none' }}>
                        <section>
                            <h2>مقدمة</h2>
                            <p>نحن في تطبيق <strong>QRAN.TOP</strong> نلتزم بأعلى معايير الخصوصية لحماية زوارنا ومستخدمينا. تهدف هذه السياسة إلى توضيح كيفية التعامل مع البيانات مع التأكيد القاطع على أننا لا نجمع أي بيانات شخصية أو هوية تعريفية للمستخدمين.</p>
                        </section>

                        <section>
                            <h2>البيانات المخزنة محلياً على جهازك</h2>
                            <p>لضمان سرعة الأداء وحفظ التفضيلات الشخصية، يعتمد التطبيق على التخزين المحلي في متصفحك (localStorage & IndexDB). هذه البيانات تظل بالكامل على جهازك دون إرسالها لأي سيرفر:</p>
                            <ul>
                                <li><strong>تفضيلات القراءة والعرض:</strong> تشمل اختيار المظهر (فاتح/داكن)، حجم ونوع الخط المصحفي، القارئ الصوتي المفضل، والتفاسير والترجمات المفعّلة.</li>
                                <li><strong>دفتر التدبر والملاحظات:</strong> الآيات المحفوظة، المجموعات المخصصة، والملاحظات والتدبرات الشخصية تحفظ محلياً على جهازك فقط.</li>
                                <li><strong>مفتاح Gemini API:</strong> في حال إدخالك لمفتاح API الخاص بك لتفعيل خدمات الذكاء الاصطناعي، يتم حفظه محلياً ومشفراً في متصفحك ولا نصل إليه مطلقاً.</li>
                                <li><strong>التخزين المؤقت للقرآن (Cache):</strong> يتم حفظ بيانات الآيات والتطبيقات الأساسية محلياً لتسريع التحميل ودعم التشغيل السريع.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>البيانات التفاعلية العامة (مجهولة الهوية)</h2>
                            <p>لتمكين الميزات الجماعية التفاعلية، يتم التعامل مع بيانات مجهولة الهوية تماماً عبر خوادم Firebase:</p>
                            <ul>
                                <li><strong>النقاشات والتعليقات:</strong> عند كتابة تعليق أو تدبر عام، يُحفظ النص مجهول الهوية دون أي ربط بحساب أو هوية رقمية.</li>
                                <li><strong>الختمات الجماعية:</strong> يتم تحديث الختمات المشتركة بأعداد الصفحات المنجزة مجهولة الهوية لتشجيع القراءة الجماعية.</li>
                                <li><strong>مزامنة دفتر التدبر (المؤقتة):</strong> عند تصدير دفتر التدبر، يُحفظ رمز مشفر ومجهول مؤقتاً لتسهيل نقله لجهاز آخر ثم يُحذف نهائياً.</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2>تقنية التطبيق المتقدم (PWA & Service Worker)</h2>
                            <p>يستخدم التطبيق تقنيات الويب الحديثة (Service Worker) لتخزين واجهة التطبيق والأيقونات في الذاكرة المؤقتة لجهازك ليعمل التطبيق بكفاءة عالية وبسرعة فائقة حتى عند ضعف الاتصال بالإنترنت.</p>
                        </section>

                        <section>
                            <h2>الإشراف والتواصل</h2>
                            <p>يحتفظ القائمون على التطبيق بحق مراجعة أي تعليقات عامة تفتقر إلى اللياقة أو تخالف الضوابط العامة وحذفها لحفظ بيئة تدبر نقية.</p>
                        </section>

                        <section>
                            <h2>التواصل معنا</h2>
                            <p>لأي استفسارات حول سياسة الخصوصية أو التطبيق، يرجى التواصل عبر حساب التلغرام: <a href="https://t.me/aboharon_com" onClick={(e) => openExternalLink(e, "https://t.me/aboharon_com")} target="_blank" rel="noopener noreferrer">t.me/aboharon_com</a>.</p>
                        </section>
                    </div>
                    
                    <div id="english-content" className="lang-en" style={{ display: lang === 'en' ? 'block' : 'none' }}>
                        <section>
                            <h2>Introduction</h2>
                            <p>At <strong>QRAN.TOP</strong>, we are committed to protecting your privacy. This policy explains our privacy practices, highlighting that we do not collect any personal or identifiable information from our users.</p>
                        </section>

                        <section>
                            <h2>Locally Stored Data</h2>
                            <p>To deliver a personalized and instant experience, certain settings are stored directly in your browser's local storage. This data never leaves your device:</p>
                            <ul>
                                <li><strong>Reading Preferences:</strong> Theme selection (light/dark), font face and size, preferred audio reciters, and active tafsirs/translations.</li>
                                <li><strong>Tadabbur Notebook:</strong> Saved ayahs, custom collections, and personal study notes are kept entirely inside your browser.</li>
                                <li><strong>Gemini API Key:</strong> If provided for AI features, your API key is encrypted and saved locally only. We never send it to external servers.</li>
                                <li><strong>Quran Caching:</strong> Core app assets and text are cached locally for fast load times and offline readiness.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>Anonymized Community Features</h2>
                            <p>To enable shared features, fully anonymous interactions are stored securely on Firebase:</p>
                            <ul>
                                <li><strong>Comments & Discussions:</strong> Public study notes are stored anonymously without any link to user identities.</li>
                                <li><strong>Group Khatmiyah:</strong> Anonymous page counts are updated to facilitate group reading progress.</li>
                                <li><strong>Temporary Sync:</strong> Notebook exports use a temporary, randomized token to help you move data between devices.</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2>Service Worker & PWA</h2>
                            <p>The application utilizes Service Worker technology to store essential layout assets on your device, ensuring fast page loads and offline responsiveness.</p>
                        </section>

                        <section>
                            <h2>Contact Us</h2>
                            <p>For questions regarding our privacy policy or practices, reach out via Telegram: <a href="https://t.me/aboharon_com" onClick={(e) => openExternalLink(e, "https://t.me/aboharon_com")} target="_blank" rel="noopener noreferrer">t.me/aboharon_com</a>.</p>
                        </section>
                    </div>

                    <footer>
                        <a href="#/" onClick={handleHomeClick}>العودة إلى التطبيق الرئيسي</a>
                        <p className="mt-2 text-xs opacity-75">&copy; 2026 - <a href="https://aboharon.com" onClick={(e) => openExternalLink(e, "https://aboharon.com")} target="_blank" rel="noopener noreferrer">aboharon.com</a>. جميع الحقوق محفوظة.</p>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicyView;
