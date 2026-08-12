import React, { useState, useEffect, useRef } from 'react';
import type { FontSize, Ayah } from '../types';
import { ArrowRightIcon, HomeIcon, PlusIcon, MinusIcon, BookOpenIcon, ListBulletIcon, PlayIcon, SpinnerIcon } from './icons';
import { useSettingsContext } from '../contexts/SettingsContext';

interface ToolboxProps {
    isAudioPlayerVisible: boolean;
    onStartPlayback?: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
    isPlaybackLoading?: boolean;
    currentPath?: string;
}

const FONT_SIZES: FontSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

const Toolbox: React.FC<ToolboxProps> = ({
    isAudioPlayerVisible,
    onStartPlayback,
    isPlaybackLoading,
    currentPath,
}) => {
    const [isShown, setIsShown] = useState(true);
    const lastScrollY = useRef(0);
    const { fontSize, setFontSize, browsingMode, setBrowsingMode, selectedAudioEdition } = useSettingsContext();

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

    const handleBack = () => {
        const currentHash = window.location.hash || '#/';
        if (currentHash === '#/' || currentHash === '#') {
            window.history.back();
            return;
        }

        const previousHash = currentHash;
        window.history.back();

        setTimeout(() => {
            if ((window.location.hash || '#/') === previousHash) {
                window.location.hash = '#/';
            }
        }, 150);
    };

    const handlePlaySurah = () => {
        if (!navigator.onLine) {
            console.warn("Audio playback requires network connection.");
            return;
        }

        let startIndex = 0;
        const elements = document.querySelectorAll('[id^="ayah-"]');
        if (elements.length > 0) {
            let closestElement: Element | null = null;
            let closestDistance = Infinity;
            const targetY = 140;

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    const distance = Math.abs(rect.top - targetY);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestElement = el;
                    }
                }
            });

            if (closestElement) {
                const id = (closestElement as HTMLElement).id;
                const parts = id.split('-');
                if (parts.length === 3) {
                    const aNum = parseInt(parts[2], 10);
                    const pathStr = currentPath || window.location.hash || '#/';
                    const [path] = pathStr.substring(1).split('?');
                    const pathParts = path.split('/').filter(Boolean);

                    if (pathParts[0] === 'surah') {
                        startIndex = Math.max(0, aNum - 1);
                    } else if (pathParts[0] === 'page') {
                        const ayahElements = Array.from(elements);
                        const idx = ayahElements.indexOf(closestElement);
                        if (idx !== -1) {
                            startIndex = idx;
                        }
                    }
                }
            }
        }

        if (onStartPlayback) {
            onStartPlayback([], selectedAudioEdition, startIndex);
        }
    };

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
        <div className={`fixed left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${isAudioPlayerVisible ? 'bottom-28' : 'bottom-6 sm:bottom-8'}`}>
            <div className={`relative flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1.5 sm:p-2 rounded-full shadow-2xl border border-border-default transition-all duration-300 ${
                isShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
            }`}>
                
                {/* Navigation Group: Back & Home only */}
                <ToolButton onClick={handleBack} label="الخلف"><ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" /></ToolButton>
                <ToolButton onClick={() => window.location.hash = '#/'} label="الرئيسية"><HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" /></ToolButton>
                
                <div className="h-5 w-px bg-border-default mx-1"></div>

                {/* Play / Listen Button */}
                <ToolButton
                    onClick={handlePlaySurah}
                    disabled={isPlaybackLoading}
                    label="استماع من موضع القراءة الحالي"
                    isActive={isAudioPlayerVisible}
                >
                    {isPlaybackLoading ? (
                        <SpinnerIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" />
                    ) : (
                        <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    )}
                </ToolButton>

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
                    {browsingMode === 'full' ? (
                        <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                        <ListBulletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                </ToolButton>

            </div>
        </div>
    );
};

export default Toolbox;