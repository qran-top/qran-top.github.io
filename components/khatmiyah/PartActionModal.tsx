import React from 'react';
import { SpinnerIcon, CheckIcon, ClearIcon, BookOpenIcon } from '../icons';

interface PartActionModalProps {
  juzNumber: number;
  juzSurahName?: string;
  readerName?: string;
  status: 'reserved' | 'completed';
  onClose: () => void;
  onReadNow: () => void;
  onComplete: () => Promise<void>;
  onUnreserve: () => Promise<void>;
  onUncomplete: () => Promise<void>;
}

export const PartActionModal: React.FC<PartActionModalProps> = ({
  juzNumber,
  juzSurahName,
  readerName,
  status,
  onClose,
  onReadNow,
  onComplete,
  onUnreserve,
  onUncomplete,
}) => {
  const isCompleted = status === 'completed';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-default rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-bold text-base flex items-center justify-center font-mono border border-primary/20">
              {juzNumber}
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary">الجزء {juzNumber}</h2>
              {juzSurahName && (
                <p className="text-xs text-text-muted">{juzSurahName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-colors"
          >
            <ClearIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Reader Status */}
        <div className="p-5 space-y-4">
          <div
            className={`p-3.5 rounded-2xl border ${
              isCompleted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <span>{isCompleted ? '✨' : '👤'}</span>
              <span>{isCompleted ? 'تمت القراءة بواسطة:' : 'محجوز حالياً باسم:'}</span>
            </div>
            <p className="text-base font-black mt-1 text-text-primary">
              {readerName || 'فاعل خير'}
            </p>
          </div>

          {/* Action options */}
          <div className="space-y-2 pt-1">
            {/* Read now */}
            <button
              onClick={() => {
                onReadNow();
                onClose();
              }}
              className="w-full py-3 px-4 bg-surface hover:bg-surface-hover border border-border-default text-text-primary text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <BookOpenIcon className="w-4 h-4 text-primary" />
              <span>قراءة الجزء في المصحف الآن</span>
            </button>

            {/* If reserved: Complete it or Cancel reservation */}
            {!isCompleted ? (
              <>
                <button
                  onClick={async () => {
                    await onComplete();
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>تأكيد إتمام القراءة (أتممتُه)</span>
                </button>

                <button
                  onClick={async () => {
                    await onUnreserve();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-surface-subtle hover:bg-red-500/15 text-text-secondary hover:text-red-500 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>إلغاء الحجز وإتاحة الجزء للآخرين</span>
                </button>
              </>
            ) : (
              /* If completed: option to undo */
              <button
                onClick={async () => {
                  await onUncomplete();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-surface-subtle hover:bg-amber-500/15 text-text-secondary hover:text-amber-600 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-1.5"
              >
                <span>تراجع عن إتمام القراءة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartActionModal;
