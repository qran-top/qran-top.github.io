import React, { useState, useEffect } from 'react';
import { CheckIcon, TrashIcon } from '../icons';
import { safeLocalStorage } from '../../utils/storage';

const USER_API_KEY_KEY = 'qran_user_api_key';

const ApiKeySettings: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setApiKey(safeLocalStorage.getItem(USER_API_KEY_KEY) || '');
    }, []);

    const handleSave = () => {
        safeLocalStorage.setItem(USER_API_KEY_KEY, apiKey);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
    };

    const handleDelete = () => {
        if (window.confirm("هل أنت متأكد من حذف مفتاحك؟ ستحتاج إلى إدخاله مرة أخرى لاستخدام ميزة التحليل بالذكاء الاصطناعي.")) {
            safeLocalStorage.removeItem(USER_API_KEY_KEY);
            setApiKey('');
        }
    };
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2 text-text-primary">إدارة مفتاح الذكاء الاصطناعي</h2>
            <p className="text-text-secondary mb-8">
                استخدم هذه الواجهة لإضافة أو تعديل مفتاح API الخاص بك من Google AI Studio لاستخدام ميزة "معنى المثاني".
            </p>
            <div className="p-5 bg-surface-subtle rounded-lg border border-border-default max-w-2xl">
                <label htmlFor="api-key-input" className="block text-sm font-medium text-text-secondary mb-2">
                    مفتاح Gemini API الخاص بك
                </label>
                <input
                    id="api-key-input"
                    name="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="أدخل مفتاحك هنا..."
                    className="w-full p-2 border border-border-default rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-text-muted mt-2">
                    يتم حفظ المفتاح في متصفحك فقط ولا يتم إرساله إلى خوادمنا. <a href="#/manual" className="text-primary-text hover:underline">كيف أحصل على مفتاح؟</a>
                </p>
                <div className="flex items-center gap-3 mt-4">
                    <button onClick={handleSave} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors">
                        <CheckIcon className="w-5 h-5"/>
                        <span>حفظ المفتاح</span>
                    </button>
                    {apiKey && (
                        <button onClick={handleDelete} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">
                            <TrashIcon className="w-5 h-5"/>
                            <span>حذف</span>
                        </button>
                    )}
                </div>
                 {saveSuccess && (
                    <p className="text-green-600 dark:text-green-400 text-sm mt-3 text-center">تم حفظ المفتاح بنجاح.</p>
                )}
            </div>
        </div>
    );
};

export default ApiKeySettings;
