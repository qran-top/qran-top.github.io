import React, { useState, useEffect } from 'react';
import { CheckIcon, RefreshIcon } from '../icons';
import { safeLocalStorage } from '../../utils/storage';

const EXPORT_TEMPLATE_KEY = 'qran_app_export_template';

const DEFAULT_EXPORT_TEMPLATE = `ملخص البحث عن: "{{query}}"
- عدد الآيات المطابقة: {{ayah_count}}
- إجمالي التكرارات: {{general_occurrences}}
- المطابقات التامة: {{exact_occurrences}}
- خيار التطابق: {{exact_match_status}}

====================================

{{#results}}
"{{ayah_text}}" (سورة {{surah_name}} - الآية {{ayah_number_in_surah}})

---

{{/results}}
`;

const ExportFormatSettings: React.FC = () => {
    const [template, setTemplate] = useState(DEFAULT_EXPORT_TEMPLATE);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const savedTemplate = safeLocalStorage.getItem(EXPORT_TEMPLATE_KEY);
        if (savedTemplate) {
            setTemplate(savedTemplate);
        }
    }, []);

    const handleSave = () => {
        safeLocalStorage.setItem(EXPORT_TEMPLATE_KEY, template);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
    };

    const handleReset = () => {
        if (window.confirm("هل أنت متأكد من إعادة القالب إلى الوضع الافتراضي؟")) {
            setTemplate(DEFAULT_EXPORT_TEMPLATE);
            safeLocalStorage.setItem(EXPORT_TEMPLATE_KEY, DEFAULT_EXPORT_TEMPLATE);
        }
    };
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2 text-text-primary">ضبط تنسيق ملف البحث</h2>
            <p className="text-text-secondary mb-8">خصص شكل المخرجات النصية عند استخدام أدوات 'نسخ كل النتائج' أو 'تحميل النتائج'. استخدم المتغيرات المتاحة لتضمين البيانات التي تحتاجها بالترتيب الذي تفضله.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-default">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">محرر القالب</h3>
                    <textarea
                        id="export-template-editor"
                        name="exportTemplate"
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="w-full h-80 p-3 font-mono text-sm border border-border-default rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition"
                        dir="ltr"
                        aria-label="محرر قالب التصدير"
                    />
                    <div className="flex items-center gap-3 mt-4">
                        <button onClick={handleSave} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors">
                            <CheckIcon className="w-5 h-5"/>
                            <span>حفظ القالب</span>
                        </button>
                        <button onClick={handleReset} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors">
                            <RefreshIcon className="w-5 h-5"/>
                            <span>إعادة الضبط</span>
                        </button>
                    </div>
                     {saveSuccess && (
                        <p className="text-green-600 dark:text-green-400 text-sm mt-3 text-center">تم حفظ القالب بنجاح.</p>
                    )}
                </div>
                <div className="p-5">
                     <h3 className="text-xl font-semibold mb-3 text-text-primary">شرح المتغيرات</h3>
                     <div className="space-y-4 text-text-secondary">
                        <div>
                             <h4 className="font-bold text-md mb-1">المتغيرات العامة</h4>
                             <ul className="list-disc pr-5 space-y-1 text-sm">
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{query}}`}</code>: كلمة البحث التي أدخلها المستخدم.</li>
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{ayah_count}}`}</code>: عدد الآيات في النتائج.</li>
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{general_occurrences}}`}</code>: إجمالي تكرارات الكلمة (لبحث النصوص فقط).</li>
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{exact_occurrences}}`}</code>: عدد المطابقات التامة (لبحث النصوص فقط).</li>
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{exact_match_status}}`}</code>: حالة خيار التطابق: "مفعل" أو "غير مفعل".</li>
                             </ul>
                        </div>
                        <div>
                             <h4 className="font-bold text-md mb-1">حلقة النتائج</h4>
                             <p className="text-sm mb-2">استخدم هذا الهيكل لتكرار عرض كل آية في النتائج:</p>
                             <code dir="ltr" className="block p-2 bg-surface-hover rounded text-sm text-center">{`{{#results}} ... {{/results}}`}</code>
                             <h4 className="font-bold text-md mt-3 mb-1">المتغيرات داخل الحلقة</h4>
                             <ul className="list-disc pr-5 space-y-1 text-sm">
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{ayah_text}}`}</code>: نص الآية الكامل.</li>
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{surah_name}}`}</code>: اسم السورة.</li>
                                <li><code dir="ltr" className="bg-surface-hover px-1 rounded">{`{{ayah_number_in_surah}}`}</code>: رقم الآية داخل السورة.</li>
                             </ul>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ExportFormatSettings;
