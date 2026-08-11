import React from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { ALL_AUDIO_EDITIONS } from '../../data/audioEditions';
import { SpeakerWaveIcon, CheckIcon } from '../icons';

const AudioSettings: React.FC = () => {
    const { selectedAudioEdition, setSelectedAudioEdition } = useSettingsContext();

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">إعدادات الصوت والتلاوة</h2>
                <p className="text-sm text-text-secondary">اختر القارئ المفضل والخيارات الصوتية للاستماع للتلاوات العطرة للقرآن الكريم.</p>
            </div>

            {/* Reciter Selector */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <SpeakerWaveIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">القارئ الافتراضي</h3>
                        <p className="text-xs text-text-muted">القارئ الذي سيتم التلاوة بصوته عند الضغط على زر التشغيل</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {ALL_AUDIO_EDITIONS.map((reciter) => {
                        const isSelected = selectedAudioEdition === reciter.identifier;
                        return (
                            <button
                                key={reciter.identifier}
                                onClick={() => setSelectedAudioEdition(reciter.identifier)}
                                className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between ${
                                    isSelected
                                        ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-primary/30'
                                }`}
                            >
                                <div>
                                    <div className="font-bold text-sm text-text-primary">{reciter.name}</div>
                                    <div className="text-xs text-text-muted mt-0.5" dir="ltr">{reciter.englishName}</div>
                                </div>
                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                                        <CheckIcon className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Audio Playback Features Info */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-3">
                <h3 className="font-bold text-base text-text-primary">ملاحظات التلاوة الصوتية</h3>
                <ul className="list-disc pr-5 text-xs sm:text-sm text-text-muted space-y-2 leading-relaxed">
                    <li>يتم تشغيل التلاوات الصوتية بجودة عالية عبر شبكات توصيل المحتوى القرآنية المفتوحة (EveryAyah / AlQuran API).</li>
                    <li>عند الانتقال بين الآيات أثناء التشغيل، يتم تظليل الآية الحالية تلقائياً مع تحريك الشاشة بسلاسة.</li>
                    <li>يمكنك التبديل بين القراء في أي وقت أثناء الاستماع عبر المشغل الصوتي الموجود أسفل الشاشة.</li>
                </ul>
            </div>
        </div>
    );
};

export default AudioSettings;
