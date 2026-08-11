import React, { useState, useEffect } from 'react';
import { TrashIcon, RefreshIcon, CheckIcon } from '../icons';

const DataAndStorageSettings: React.FC = () => {
    const [storageInfo, setStorageInfo] = useState<{ keysCount: number; estimatedKb: string }>({ keysCount: 0, estimatedKb: '0' });
    const [isCleared, setIsCleared] = useState(false);

    const calculateStorage = () => {
        try {
            let total = 0;
            let count = localStorage.length;
            for (let x = 0; x < count; x++) {
                const key = localStorage.key(x);
                if (key) {
                    const val = localStorage.getItem(key) || '';
                    total += key.length + val.length;
                }
            }
            const kb = (total / 1024).toFixed(2);
            setStorageInfo({ keysCount: count, estimatedKb: kb });
        } catch (e) {
            setStorageInfo({ keysCount: 0, estimatedKb: '0' });
        }
    };

    useEffect(() => {
        calculateStorage();
    }, []);

    const handleClearCache = () => {
        if (window.confirm("هل أنت متأكد من مسح الذاكرة المؤقتة للبحث والتصفح؟ (لن يتم حذف الملاحظات أو المفضلة)")) {
            try {
                // Keep notebook saved items
                const notebookData = localStorage.getItem('qran_app_notebook');
                const userApiKey = localStorage.getItem('qran_user_api_key');
                const themeData = localStorage.getItem('theme');

                localStorage.clear();

                if (notebookData) localStorage.setItem('qran_app_notebook', notebookData);
                if (userApiKey) localStorage.setItem('qran_user_api_key', userApiKey);
                if (themeData) localStorage.setItem('theme', themeData);

                calculateStorage();
                setIsCleared(true);
                setTimeout(() => setIsCleared(false), 3000);
            } catch (e) {}
        }
    };

    const handleResetAllSettings = () => {
        if (window.confirm("هل أنت متأكد من إعادة جميع إعدادات الخط والأصوات والمظهر للوضع الافتراضي؟")) {
            try {
                localStorage.removeItem('qran_app_edition');
                localStorage.removeItem('qran_app_font_size');
                localStorage.removeItem('qran_app_font_style');
                localStorage.removeItem('qran_app_audio_edition');
                localStorage.removeItem('qran_app_browsing_mode');
                window.location.reload();
            } catch (e) {}
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">البيانات والذاكرة المؤقتة</h2>
                <p className="text-sm text-text-secondary">إدارة التخزين المحلي، مسح البيانات المؤقتة، وضبط أداء التطبيق.</p>
            </div>

            {/* Storage overview */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <h3 className="font-bold text-lg text-text-primary">إحصائيات التخزين المحلي</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                        <div className="text-xs text-text-muted">عدد السجلات المحفوظة</div>
                        <div className="text-2xl font-bold text-primary mt-1">{storageInfo.keysCount} عنصر</div>
                    </div>
                    <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                        <div className="text-xs text-text-muted">حجم البيانات التقريبي</div>
                        <div className="text-2xl font-bold text-primary mt-1" dir="ltr">{storageInfo.estimatedKb} KB</div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <h3 className="font-bold text-lg text-text-primary">أدوات تنظيف الذاكرة والضبط</h3>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                        onClick={handleClearCache}
                        className="flex-1 p-4 rounded-xl bg-surface border border-border-default hover:border-amber-500 hover:bg-amber-500/5 text-right transition-all flex items-center justify-between"
                    >
                        <div>
                            <div className="font-bold text-text-primary text-sm">مسح المؤقت وتفريغ الكاش</div>
                            <div className="text-xs text-text-muted mt-0.5">تنظيف الذاكرة المؤقتة مع الحفاظ على ملاحظاتك ومفضلاتك.</div>
                        </div>
                        <TrashIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    </button>

                    <button
                        onClick={handleResetAllSettings}
                        className="flex-1 p-4 rounded-xl bg-surface border border-border-default hover:border-red-500 hover:bg-red-500/5 text-right transition-all flex items-center justify-between"
                    >
                        <div>
                            <div className="font-bold text-text-primary text-sm">إعادة ضبط الإعدادات للافتراضي</div>
                            <div className="text-xs text-text-muted mt-0.5">إعادة خيارات القراءة والأصوات والمظهر لحالتها الأولى.</div>
                        </div>
                        <RefreshIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </button>
                </div>

                {isCleared && (
                    <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold flex items-center gap-2 justify-center">
                        <CheckIcon className="w-4 h-4" />
                        <span>تم تنظيف الذاكرة المؤقتة بنجاح.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAndStorageSettings;
