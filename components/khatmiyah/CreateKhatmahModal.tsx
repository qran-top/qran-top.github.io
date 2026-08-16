import React, { useState } from 'react';
import { SpinnerIcon, PlusIcon, ClearIcon } from '../icons';

interface CreateKhatmahModalProps {
  onClose: () => void;
  onCreate: (params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
  }) => Promise<string>;
}

const CreateKhatmahModal: React.FC<CreateKhatmahModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [dedication, setDedication] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى كتابة اسم الختمة');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const newId = await onCreate({
        title: title.trim(),
        dedication: dedication.trim() || undefined,
        targetDate: targetDate || undefined,
        createdBy: createdBy.trim() || undefined,
      });
      window.location.hash = `#/khatmah/${newId}`;
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إنشاء الختمة');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h2 className="text-xl font-bold text-text-primary">إنشاء ختمة جماعية جديدة</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-colors">
            <ClearIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="khatmah-title" className="block text-sm font-bold mb-1.5 text-text-primary">
              اسم الختمة <span className="text-red-500">*</span>
            </label>
            <input
              id="khatmah-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="مثال: ختمة الأهل والأصدقاء / ختمة شهر رمضان"
              className="w-full p-2.5 border rounded-xl bg-surface border-border-default text-text-primary text-base focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="khatmah-dedication" className="block text-sm font-bold mb-1.5 text-text-primary">
              الإهداء أو النية <span className="text-xs text-text-muted font-normal">(اختياري)</span>
            </label>
            <input
              id="khatmah-dedication"
              type="text"
              value={dedication}
              onChange={e => setDedication(e.target.value)}
              placeholder="مثال: بنية الشفاء العاجل / عن روح المرحوم..."
              className="w-full p-2.5 border rounded-xl bg-surface border-border-default text-text-primary text-base focus:border-primary outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="khatmah-target-date" className="block text-sm font-bold mb-1.5 text-text-primary">
                تاريخ النهاية المتوقع <span className="text-xs text-text-muted font-normal">(اختياري)</span>
              </label>
              <input
                id="khatmah-target-date"
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-surface border-border-default text-text-primary text-base focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="khatmah-creator" className="block text-sm font-bold mb-1.5 text-text-primary">
                اسم منشئ الختمة <span className="text-xs text-text-muted font-normal">(اختياري)</span>
              </label>
              <input
                id="khatmah-creator"
                type="text"
                value={createdBy}
                onChange={e => setCreatedBy(e.target.value)}
                placeholder="اسمك أو كنيتك"
                className="w-full p-2.5 border rounded-xl bg-surface border-border-default text-text-primary text-base focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-subtle border-t border-border-default flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-text-secondary hover:bg-surface rounded-xl">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isCreating ? <SpinnerIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            {isCreating ? 'جاري الإنشاء...' : 'إنشاء الختمة'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateKhatmahModal;
