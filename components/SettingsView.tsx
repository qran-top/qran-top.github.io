import React, { useState, useEffect } from 'react';
import { SparklesIcon, BookOpenIcon, SpeakerWaveIcon, SunIcon, PaperIcon, FolderIcon, TrashIcon } from './icons';
import TadabburGateway from './settings/TadabburGateway';
import ExportFormatSettings from './settings/ExportFormatSettings';
import ApiKeySettings from './settings/ApiKeySettings';
import ReadingSettings from './settings/ReadingSettings';
import AudioSettings from './settings/AudioSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import DataAndStorageSettings from './settings/DataAndStorageSettings';

interface SettingsViewProps {
    onExportNotebook: () => Promise<string>;
    onImportNotebook: (code: string) => Promise<void>;
}

type Tab = 'reading' | 'audio' | 'appearance' | 'tadabbur' | 'export_format' | 'api_key' | 'storage';

const SettingsView: React.FC<SettingsViewProps> = ({ 
    onExportNotebook, onImportNotebook
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('reading');
    
    useEffect(() => {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
            const params = new URLSearchParams(hash.substring(queryIndex + 1));
            const tabParam = params.get('tab') as Tab;
            if (['reading', 'audio', 'appearance', 'tadabbur', 'export_format', 'api_key', 'storage'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, [window.location.hash]);

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'reading', label: 'القراءة والخطوط', icon: <BookOpenIcon className="w-5 h-5" /> },
        { id: 'audio', label: 'الصوتيات والقراء', icon: <SpeakerWaveIcon className="w-5 h-5" /> },
        { id: 'appearance', label: 'المظهر والواجهة', icon: <SunIcon className="w-5 h-5" /> },
        { id: 'tadabbur', label: 'دفتر التدبر', icon: <FolderIcon className="w-5 h-5" /> },
        { id: 'export_format', label: 'تنسيق التصدير', icon: <PaperIcon className="w-5 h-5" /> },
        { id: 'api_key', label: 'الذكاء الاصطناعي', icon: <SparklesIcon className="w-5 h-5" /> },
        { id: 'storage', label: 'البيانات والذاكرة', icon: <TrashIcon className="w-5 h-5" /> },
    ];
    
    return (
        <div className="animate-fade-in w-full max-w-6xl mx-auto px-4 py-6">
            {/* Header Title */}
            <div className="mb-6 text-center sm:text-right">
                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">إعدادات التطبيق الشاملة</h1>
                <p className="text-sm text-text-muted mt-1">خصص كل تفاصيل تجربتك القرآنية والبحثية والتحليلية بما يتناسب مع تفضيلاتك.</p>
            </div>

            <main className="bg-surface p-4 sm:p-8 rounded-2xl shadow-lg border border-border-default transition-colors duration-300 relative">
                {/* Scrollable Tab Navigation */}
                <div className="flex border-b border-border-default mb-8 overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-1">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-4 py-3 text-sm sm:text-base font-bold transition-all rounded-xl flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                                }`}
                                aria-current={isActive}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Contents */}
                <div className="min-h-[400px]">
                    {activeTab === 'reading' && <ReadingSettings />}
                    {activeTab === 'audio' && <AudioSettings />}
                    {activeTab === 'appearance' && <AppearanceSettings />}
                    {activeTab === 'tadabbur' && (
                        <TadabburGateway 
                            onExportNotebook={onExportNotebook}
                            onImportNotebook={onImportNotebook}
                        />
                    )}
                    {activeTab === 'export_format' && <ExportFormatSettings />}
                    {activeTab === 'api_key' && <ApiKeySettings />}
                    {activeTab === 'storage' && <DataAndStorageSettings />}
                </div>
            </main>
        </div>
    );
};

export default SettingsView;
