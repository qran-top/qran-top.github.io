import React from 'react';
import { ClearIcon, BookOpenIcon, JuzOneIcon, QueueListIcon, ListBulletIcon } from '../icons';
import type { PlaybackMode } from '../../types';

interface PlaybackModeModalProps {
    onClose: () => void;
    onModeSelect: (mode: PlaybackMode) => void;
    onJuzSelectionStart: () => void;
    onSurahSelectionStart: () => void;
}

const PlaybackModeModal: React.FC<PlaybackModeModalProps> = ({ onClose, onModeSelect, onJuzSelectionStart, onSurahSelectionStart }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100000] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl border border-border-default shadow-2xl w-full max-w-md mx-auto overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-default flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-primary">تحديد نطاق القراءة</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover"><ClearIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3">
                    <button onClick={() => { onModeSelect('continuous'); onClose(); }} className="w-full text-right p-4 flex items-center gap-4 bg-surface-subtle rounded-lg hover:bg-surface-hover transition-colors">
                        <BookOpenIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                        <div>
                            <h3 className="font-bold text-lg">ختمة كاملة</h3>
                            <p className="text-sm text-text-muted">الاستمرار في القراءة من مكان وقوفك في المصحف كاملاً.</p>
                        </div>
                    </button>
                    <button onClick={() => { onModeSelect('single'); onClose(); }} className="w-full text-right p-4 flex items-center gap-4 bg-surface-subtle rounded-lg hover:bg-surface-hover transition-colors">
                        <JuzOneIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                        <div>
                            <h3 className="font-bold text-lg">جزء واحد فقط</h3>
                            <p className="text-sm text-text-muted">قراءة الجزء الحالي فقط ثم التوقف تلقائياً.</p>
                        </div>
                    </button>
                    <button onClick={onJuzSelectionStart} className="w-full text-right p-4 flex items-center gap-4 bg-surface-subtle rounded-lg hover:bg-surface-hover transition-colors">
                        <QueueListIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                        <div>
                            <h3 className="font-bold text-lg">تحديد أجزاء</h3>
                            <p className="text-sm text-text-muted">اختر أجزاء متتالية أو متفرقة للقراءة.</p>
                        </div>
                    </button>
                    <button onClick={onSurahSelectionStart} className="w-full text-right p-4 flex items-center gap-4 bg-surface-subtle rounded-lg hover:bg-surface-hover transition-colors">
                        <ListBulletIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                        <div>
                            <h3 className="font-bold text-lg">تحديد سور</h3>
                            <p className="text-sm text-text-muted">اختر سورة أو عدة سور للقراءة.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaybackModeModal;
