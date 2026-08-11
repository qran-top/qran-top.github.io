import React, { useState, useEffect, useRef } from 'react';
import type { FontSize } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, PlusIcon, MinusIcon, DocumentDuplicateIcon, QueueListIcon, SpeakerWaveIcon, BookOpenIcon } from './icons';
import { useSettingsContext } from '../contexts/SettingsContext';
import RecitersModal from './RecitersModal';
import SurahPickerModal from './SurahPickerModal';

interface ToolboxProps {
    isAudioPlayerVisible: boolean;
}

const FONT_SIZES: FontSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

const Toolbox: React.FC<ToolboxProps> = ({
    isAudioPlayerVisible,
}) => {
    const [isShown, setIsShown] = useState(true);
    const [isRecitersOpen, setIsRecitersOpen] = useState(false);
    const [isSurahPickerOpen, setIsSurahPickerOpen] = useState(false);
    const lastScrollY = useRef(0);
    const { fontSize, setFontSize, browsingMode, setBrowsingMode } = useSettingsContext();

    // Effect to handle toolbox visibility on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollThreshold = 10;

            if (Math.abs(currentScrollY - lastScrollY.current) < scrollThreshold) {
                return;
            }
            
            if (currentScrollY < 80) { // Always show near top
                setIsShown(true);
            } else if (currentScrollY > lastScrollY.current) { // Scrolling down
                setIsShown(false);
            } else { // Scrolling up
                setIsShown(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleIncreaseFont = () => {
        const currentIndex = FONT_SIZES.indexOf(fontSize);
        if (currentIndex < FONT_SIZES.length - 1) {
            setFontSize(FONT_SIZES[currentIndex + 1]);
        }
    };

    const handleDecreaseFont = () => {
        const currentIndex = FONT_SIZES.indexOf(fontSize);
        if (currentIndex > 0) {
            setFontSize(FONT_SIZES[currentIndex - 1]);
        }
    };
    
    const ToolButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode; isActive?: boolean; disabled?: boolean }> = ({ onClick, label, children, isActive, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`p-2.5 sm:p-3 rounded-full transition-all cursor-pointer ${isActive ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    return (
        <>
            <div className={`fixed left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${isAudioPlayerVisible ? 'bottom-28' : 'bottom-6 sm:bottom-8'}`}>
                <div className={`relative flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1.5 sm:p-2 rounded-full shadow-2xl border border-border-default transition-all duration-300 ${
                    isShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
                }`}>
                    
                    {/* Navigation Group */}
                    <ToolButton onClick={() => window.history.back()} label="الخلف"><ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" /></ToolButton>
                    <ToolButton onClick={() => window.location.hash = '#/'} label="الرئيسية / الفهرس"><HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" /></ToolButton>
                    <ToolButton onClick={() => window.history.forward()} label="الأمام"><ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" /></ToolButton>
                    
                    <div className="h-5 w-px bg-border-default mx-1"></div>

                    {/* Surah List Picker */}
                    <ToolButton onClick={() => setIsSurahPickerOpen(true)} label="قائمة السور (فهرس القرآن)"><BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></ToolButton>

                    {/* Reciter List Picker */}
                    <ToolButton onClick={() => setIsRecitersOpen(true)} label="قائمة الأئمة والقراء"><SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></ToolButton>

                    <div className="h-5 w-px bg-border-default mx-1"></div>

                    {/* Font Size Group */}
                    <ToolButton 
                        onClick={handleDecreaseFont} 
                        label="تصغير الخط" 
                        disabled={fontSize === FONT_SIZES[0]}
                    >
                        <MinusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </ToolButton>
                    
                    <ToolButton 
                        onClick={handleIncreaseFont} 
                        label="تكبير الخط"
                        disabled={fontSize === FONT_SIZES[FONT_SIZES.length - 1]}
                    >
                        <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </ToolButton>
                    
                    <div className="h-5 w-px bg-border-default mx-1"></div>

                    {/* Browsing Mode Group */}
                    <ToolButton
                        onClick={() => setBrowsingMode(browsingMode === 'full' ? 'page' : 'full')}
                        label={browsingMode === 'full' ? 'التحويل إلى عرض الصفحات' : 'التحويل إلى العرض الكامل'}
                    >
                        {browsingMode === 'full' ? <DocumentDuplicateIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <QueueListIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </ToolButton>

                </div>
            </div>

            <RecitersModal isOpen={isRecitersOpen} onClose={() => setIsRecitersOpen(false)} />
            <SurahPickerModal isOpen={isSurahPickerOpen} onClose={() => setIsSurahPickerOpen(false)} />
        </>
    );
};

export default Toolbox;