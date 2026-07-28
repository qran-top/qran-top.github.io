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
                className={`fixed top-0 right-0 h-full bg-surface shadow-2xl z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto w-fit min-w-[220px] max-w-[85vw]`}
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
                                    <span className="whitespace-nowrap font-medium">تطبيق أندرويد (Google Play)</span>
                                </a>
                            </div>
                        </nav>

                        {/* Google Play Promo Card */}
                        <div className="mt-6 p-4 bg-surface-subtle border border-border-subtle rounded-xl flex flex-col items-center gap-3 text-center">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <GooglePlayIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-text-primary">تطبيق QRAN.TOP للأندرويد</h4>
                                <p className="text-[11px] text-text-secondary mt-1">تصفح المصحف واستمع للتلاوات وتدبر الآيات بكل سهولة عبر تطبيق الهاتف</p>
                            </div>
                            <a 
                                href="https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1"
                                onClick={(e) => openExternalLink(e, "https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
                            >
                                <GooglePlayIcon className="w-4 h-4 text-white" />
                                <span>تحميل من Google Play</span>
                            </a>
                        </div>
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
                            <span className="text-[10px] font-mono text-text-subtle select-none">
                                v1.0.9
                            </span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SidePanel;