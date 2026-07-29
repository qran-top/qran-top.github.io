import React from 'react';
import { HomeIcon, BookmarkIcon, CogIcon, ShieldCheckIcon, UserCircleIcon, MicrophoneIcon, ChartBarIcon, InformationCircleIcon, GooglePlayIcon } from './icons';
import { openExternalLink } from '../utils/navigation';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentPath: string;
    // Navigation props
    onNavigate: (path: string) => void;
}

const NavLink: React.FC<{ href: string; icon: React.ReactNode; label: string; onNavigate: (path: string) => void; isActive: boolean }> = ({ href, icon, label, onNavigate, isActive }) => (
    <a
        href={href}
        onClick={(e) => { e.preventDefault(); onNavigate(href); }}
        className={`flex items-center gap-3 p-2.5 rounded-lg text-base transition-colors ${isActive ? 'bg-surface-active text-primary-text-strong font-bold' : 'text-text-secondary hover:bg-surface-hover'}`}
    >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
    </a>
);

const SidePanel: React.FC<SidePanelProps> = ({
    isOpen, onClose, currentPath, onNavigate
}) => {

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Panel */}
            <aside
                className={`fixed top-0 right-0 h-full bg-surface shadow-2xl z-40 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'} overflow-y-auto w-64 max-w-[80vw]`}
                role="dialog"
                aria-modal="true"
                aria-label="القائمة الجانبية"
            >
                <div className="flex flex-col h-full">
                    {/* Content */}
                    <div className="p-4 pt-8">
                        <nav className="space-y-1">
                            <NavLink href="#/" icon={<HomeIcon className="w-5 h-5" />} label="الفهرس" onNavigate={onNavigate} isActive={currentPath === '#/'} />
                            <NavLink href="#/audio-khatmiyah" icon={<MicrophoneIcon className="w-5 h-5" />} label="الختمة الصوتية" onNavigate={onNavigate} isActive={currentPath.startsWith('#/audio-khatmiyah')} />
                            <NavLink href="#/saved" icon={<BookmarkIcon className="w-5 h-5" />} label="دفتر التدبر" onNavigate={onNavigate} isActive={currentPath.startsWith('#/saved')} />
                            <NavLink href="#/analysis" icon={<ChartBarIcon className="w-5 h-5" />} label="تحليل مفردة" onNavigate={onNavigate} isActive={currentPath.startsWith('#/analysis')} />
                            <NavLink href="#/settings" icon={<CogIcon className="w-5 h-5" />} label="الإعدادات" onNavigate={onNavigate} isActive={currentPath.startsWith('#/settings')} />
                            
                            <div className="!mt-4 pt-4 border-t border-border-default space-y-1">
                                <NavLink href="#/about" icon={<InformationCircleIcon className="w-5 h-5" />} label="عن التطبيق والدليل" onNavigate={onNavigate} isActive={currentPath.startsWith('#/about')} />
                                <NavLink href="#/privacy-policy" icon={<ShieldCheckIcon className="w-5 h-5" />} label="سياسة الخصوصية" onNavigate={onNavigate} isActive={currentPath.startsWith('#/privacy-policy')} />
                                
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1"
                                    onClick={(e) => openExternalLink(e, "https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2.5 rounded-lg text-base transition-colors text-text-secondary hover:bg-surface-hover"
                                >
                                    <GooglePlayIcon className="w-5 h-5 text-[#22c55e]" />
                                    <span className="whitespace-nowrap font-medium">تحميل التطبيق</span>
                                </a>
                            </div>
                        </nav>
                    </div>
                    
                    {/* Spacer to push content down */}
                    <div className="flex-grow"></div>
                    
                    {/* Footer */}
                    <div className="p-4 border-t border-border-default flex-shrink-0">
                         <div className="flex items-center justify-between gap-2">
                            <a 
                                href="https://aboharon.com" 
                                onClick={(e) => openExternalLink(e, "https://aboharon.com")}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-surface-subtle text-text-secondary rounded-full hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                                aria-label="موقع المطور"
                                title="موقع المطور"
                            >
                                <UserCircleIcon className="w-5 h-5" />
                            </a>
                            <button 
                                onClick={() => window.location.reload()}
                                className="text-[11px] font-mono text-text-muted hover:text-primary transition-colors cursor-pointer select-none px-2 py-1 rounded bg-surface-subtle hover:bg-surface-hover border border-border-default/40 flex items-center gap-1 active:scale-95"
                                title="انقر هنا لإعادة تحميل التطبيق وتحديث الإصدار"
                            >
                                <span>v1.0.10</span>
                                <span className="text-[10px]">🔄</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SidePanel;