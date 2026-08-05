import React, { useState, useEffect } from 'react';

const inspirationalPhrases = [
  "«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»",
  "«اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ»",
  "«الَّذِي يَقْرَأُ القُرْآنَ وَهُوَ مَاهِرٌ بِهِ مَعَ السَّفَرَةِ الكِرَامِ البَرَرَةِ»",
  "«إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ»",
  "«أَفَلا يَتَدَبَّرُونَ الْقُرْآنَ»"
];

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Select a random initial phrase
    setPhraseIndex(Math.floor(Math.random() * inspirationalPhrases.length));

    // Smooth loading progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 8) + 2;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    // Rotate phrases if loading takes longer
    const phraseInterval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % inspirationalPhrases.length);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearInterval(phraseInterval);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-text-primary px-6 transition-colors duration-300 select-none" 
      role="status" 
      aria-label="جاري تحميل التطبيق"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-fade-in">
        
        {/* Animated Islamic Star Symbol Container */}
        <div className="relative flex items-center justify-center w-24 h-24 my-2">
          {/* Subtle Outer Glowing Halo Ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-25"></div>
          
          {/* Rotating Decorative Star Aura */}
          <div className="absolute inset-2 rounded-2xl bg-primary/10 border border-primary/30 rotate-45 animate-spin-slow"></div>
          <div className="absolute inset-2 rounded-2xl bg-primary/5 border border-primary/20 -rotate-12"></div>

          {/* Central Star Character */}
          <span className="relative text-6xl text-primary font-serif font-bold transform drop-shadow-xs transition-transform duration-300">
            ۞
          </span>
        </div>

        {/* Title & Branding */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-wider text-text-primary font-sans">
            QRAN<span className="text-primary">.TOP</span>
          </h1>
          <p className="text-xs font-medium text-text-muted">
            مستكشف القرآن الكريم
          </p>
        </div>

        {/* Progress Section: Slim Bar & Percentage */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono px-1">
            <span>جاري التحضير...</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-surface-subtle border border-border-default rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-l from-primary via-emerald-500 to-teal-400 rounded-full transition-all duration-200 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Inspirational Phrase Box */}
        <div className="pt-3 min-h-[3.5rem] flex items-center justify-center">
          <p className="text-xs sm:text-sm text-text-secondary italic font-serif leading-relaxed px-3 py-2 bg-surface-subtle/60 border border-border-subtle/80 rounded-xl transition-all duration-500">
            {inspirationalPhrases[phraseIndex]}
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoadingScreen;
