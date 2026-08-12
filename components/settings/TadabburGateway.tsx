import React, { useState, useRef } from 'react';
import { SpinnerIcon, UploadIcon, DownloadIcon } from '../icons';

interface TadabburGatewayProps {
    onExportNotebook: () => Promise<string>;
    onImportNotebook: (code: string) => Promise<void>;
}

const TadabburGateway: React.FC<TadabburGatewayProps> = ({ onExportNotebook, onImportNotebook }) => {
    const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const handleExport = async () => {
        setIsExporting(true);
        setExportMessage(null);
        setImportMessage(null);
        try {
            const message = await onExportNotebook();
            setExportMessage({ type: 'success', text: message });
        } catch (err) {
            setExportMessage({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportMessage(null);
        setExportMessage(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                await onImportNotebook(content);
                setImportMessage({ type: 'success', text: 'تم استيراد الدفتر بنجاح.' });
            } catch (err) {
                setImportMessage({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الاستيراد' });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset file input
                }
            }
        };
        reader.onerror = () => {
            setImportMessage({ type: 'error', text: 'حدث خطأ في قراءة ملف الدفتر' });
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2 text-text-primary">بوابة دفتر التدبر</h2>
            <p className="text-text-secondary mb-8">استخدم هذه الواجهة لحفظ نسخة احتياطية من بياناتك واستعادتها كملف .json.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-default flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-text-primary">نسخ احتياطي (تصدير)</h3>
                    <p className="text-sm text-text-secondary mb-4 flex-grow">
                        قم بحفظ نسخة من دفترك الحالي كملف على جهازك، يمكنك الاحتفاظ به واستعادته متى شئت.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                        {isExporting ? <SpinnerIcon className="w-5 h-5"/> : <UploadIcon className="w-5 h-5" />}
                        <span>{isExporting ? 'جاري تصدير الملف...' : 'تصدير الدفتر (حفظ محلي)'}</span>
                    </button>
                    {exportMessage && (
                        <div className={`mt-4 p-3 rounded-md text-sm ${exportMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200'}`}>
                            {exportMessage.text}
                        </div>
                    )}
                </div>
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-default flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-text-primary">استعادة دفتر التدبر (استيراد)</h3>
                    <p className="text-sm text-text-secondary mb-4 flex-grow">
                        قم باختيار ملف الدفتر بصيغة .json لاستعادة بياناتك على هذا المتصفح. 
                        <strong>(تنبيه: سيتم استبدال الدفتر الحالي بالملف المرفوع)</strong>
                    </p>
                    <div className="flex flex-col gap-3">
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            id="notebook-upload"
                            name="notebookUpload"
                        />
                        <label
                            htmlFor="notebook-upload"
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md cursor-pointer hover:bg-green-700 transition-colors ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {isImporting ? <SpinnerIcon className="w-5 h-5"/> : <DownloadIcon className="w-5 h-5" />}
                            <span>{isImporting ? 'جاري الاستيراد...' : 'اختيار ملف الدفتر واستيراده'}</span>
                        </label>
                    </div>
                    {importMessage && (
                        <div className={`mt-4 p-3 rounded-md text-sm ${importMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200'}`}>
                            {importMessage.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TadabburGateway;
