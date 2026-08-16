import React, { useState, useEffect } from 'react';
import { SpinnerIcon, PlusIcon, ClearIcon } from '../icons';

interface CreateKhatmahModalProps {
  onClose: () => void;
  onCreate: (params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
    khatmahType?: 'once' | 'monthly_recurring';
  }) => Promise<string>;
}

type DurationChoice = '3days' | '1week' | '2weeks' | '1month' | 'custom' | 'none';

const CreateKhatmahModal: React.FC<CreateKhatmahModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [dedication, setDedication] = useState('');
  const [khatmahType, setKhatmahType] = useState<'once' | 'monthly_recurring'>('once');
  const [durationChoice, setDurationChoice] = useState<DurationChoice>('1week');
  const [customDays, setCustomDays] = useState<number>(5);
  const [targetDate, setTargetDate] = useState<string>('');
  const [createdBy, setCreatedBy] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate target date based on duration choice
  useEffect(() => {
    if (khatmahType === 'monthly_recurring') {
      // Monthly recurring ends at the end of current month
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setTargetDate(endOfMonth.toISOString().split('T')[0]);
      return;
    }

    if (durationChoice === 'none') {
      setTargetDate('');
      return;
    }

    let daysToAdd = 7;
    if (durationChoice === '3days') daysToAdd = 3;
    else if (durationChoice === '1week') daysToAdd = 7;
    else if (durationChoice === '2weeks') daysToAdd = 14;
    else if (durationChoice === '1month') daysToAdd = 30;
    else if (durationChoice === 'custom') daysToAdd = Math.max(1, Number(customDays) || 1);

    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = d.toISOString().split('T')[0];
    setTargetDate(dateStr);
  }, [durationChoice, customDays, khatmahType]);

  // Format date in Arabic for friendly display
  const formatArabicDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('ar-SA-u-ca-gregory', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
        khatmahType,
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
      <form onSubmit={handleSubmit} className="bg-surface border border-border-default rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Khatmah Type Selection */}
          <div>
            <label className="block text-sm font-bold mb-2 text-text-primary">
              نوع الختمة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setKhatmahType('once')}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                  khatmahType === 'once'
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm ring-1 ring-primary'
                    : 'bg-surface border-border-default text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">📌 ختمة لمرة واحدة</span>
                  {khatmahType === 'once' && <span className="text-xs">✓</span>}
                </div>
                <span className="text-[11px] text-text-muted font-normal">
                  تنتهي باكتمال قراءة الأجزاء الثلاثين
                </span>
              </button>

              <button
                type="button"
                onClick={() => setKhatmahType('monthly_recurring')}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                  khatmahType === 'monthly_recurring'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500'
                    : 'bg-surface border-border-default text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">🔄 ختمة دورية شهرية</span>
                  {khatmahType === 'monthly_recurring' && <span className="text-xs">✓</span>}
                </div>
                <span className="text-[11px] text-text-muted font-normal">
                  ثابتة تتجدد تلقائياً بداية كل شهر
                </span>
              </button>
            </div>
          </div>

          {/* Title */}
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
              placeholder="مثال: ختمة الأهل والأصدقاء / ختمة سورة البقرة"
              className="w-full p-3 border rounded-xl bg-surface border-border-default text-text-primary text-sm focus:border-primary outline-none transition-colors"
            />
          </div>

          {/* Dedication */}
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
              className="w-full p-3 border rounded-xl bg-surface border-border-default text-text-primary text-sm focus:border-primary outline-none transition-colors"
            />
          </div>

          {/* Duration Selector (for non-recurring khatmahs) */}
          {khatmahType === 'once' ? (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text-primary">
                مدة الختمة المتوقعة
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { key: '3days', label: '3 أيام' },
                  { key: '1week', label: 'أسبوع' },
                  { key: '2weeks', label: 'أسبوعان' },
                  { key: '1month', label: 'شهر' },
                  { key: 'custom', label: 'مخصص' },
                  { key: 'none', label: 'مفتوحة' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDurationChoice(opt.key as DurationChoice)}
                    className={`py-2 px-1 text-xs rounded-xl border font-bold transition-all ${
                      durationChoice === opt.key
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface border-border-default text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom days input */}
              {durationChoice === 'custom' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-text-muted font-bold">عدد الأيام:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={e => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 p-2 border rounded-xl bg-surface border-border-default text-center text-sm font-bold text-text-primary focus:border-primary outline-none"
                  />
                  <span className="text-xs text-text-muted">يوماً من اليوم</span>
                </div>
              )}

              {/* Calculated target date display */}
              {targetDate && durationChoice !== 'none' && (
                <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-text-muted">موعد الختم المحسوب:</span>
                  <span className="font-bold text-primary">{formatArabicDate(targetDate)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span>🔄</span>
                <span>ختمة دورية شهرية مستمرة</span>
              </div>
              <p className="text-text-secondary leading-relaxed">
                تظل هذه الختمة بنفس الرابط الثابت دائماً، وتتجدد تلقائياً في بداية كل شهر جديد ليتمكن المشاركون من حجز أجزائهم مجدداً.
              </p>
            </div>
          )}

          {/* Creator Name */}
          <div>
            <label htmlFor="khatmah-creator" className="block text-sm font-bold mb-1.5 text-text-primary">
              اسم منشئ الختمة <span className="text-xs text-text-muted font-normal">(اختياري)</span>
            </label>
            <input
              id="khatmah-creator"
              type="text"
              value={createdBy}
              onChange={e => setCreatedBy(e.target.value)}
              placeholder="اسمك أو كنيتك (مثل: فاعل خير / أبو محمد)"
              className="w-full p-3 border rounded-xl bg-surface border-border-default text-text-primary text-sm focus:border-primary outline-none transition-colors"
            />
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
