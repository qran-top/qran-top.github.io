import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GroupKhatmah, KhatmahPart } from '../../types';
import { khatmahService } from '../../services/khatmahService';
import { JUZ_INDEX } from '../../quranPartitions';
import {
  CheckIcon,
  PlusIcon,
  CopyIcon,
  WhatsAppIcon,
  TelegramIcon,
} from '../icons';
import CreateKhatmahModal from './CreateKhatmahModal';
import ReserveJuzModal from './ReserveJuzModal';
import PartActionModal from './PartActionModal';
import DuaaKhatmModal from './DuaaKhatmModal';
import { useSettingsContext } from '../../contexts/SettingsContext';

interface GroupKhatmahViewProps {
  initialKhatmahId?: string;
  onNavigateToJuz?: (surahNumber: number, ayahNumber: number) => void;
}

export const JUZ_SURAHS_NAMES = [
  'الفاتحة - البقرة',
  'البقرة',
  'البقرة - آل عمران',
  'آل عمران - النساء',
  'النساء',
  'النساء - المائدة',
  'المائدة - الأنعام',
  'الأنعام - الأعراف',
  'الأعراف - الأنفال',
  'الأنفال - التوبة',
  'التوبة - هود',
  'هود - يوسف',
  'يوسف - الرعد - إبراهيم',
  'الحجر - النحل',
  'الإسراء - الكهف',
  'الكهف - مريم - طه',
  'الأنبياء - الحج',
  'المؤمنون - الفرقان',
  'الفرقان - الشعراء - النمل',
  'النمل - القصص - العنكبوت',
  'العنكبوت إلى الأحزاب',
  'الأحزاب - سبأ - فاطر - يس',
  'يس - الصافات - ص - الزمر',
  'الزمر - غافر - فصلت',
  'فصلت إلى الجاثية',
  'الأحقاف إلى الذاريات',
  'الذاريات إلى الحديد',
  'المجادلة إلى التحريم',
  'الملك إلى المرسلات',
  'النبأ إلى الناس'
];

export const GroupKhatmahView: React.FC<GroupKhatmahViewProps> = ({
  initialKhatmahId,
  onNavigateToJuz,
}) => {
  const [currentKhatmahId, setCurrentKhatmahId] = useState<string | null>(() => {
    if (initialKhatmahId) return initialKhatmahId.toUpperCase();
    const hash = window.location.hash;
    const match = hash.match(/#\/khatmah\/([A-Za-z0-9_-]+)/i);
    return match ? match[1].toUpperCase() : null;
  });

  const [khatmah, setKhatmah] = useState<GroupKhatmah | null>(null);
  const [khatmahsList, setKhatmahsList] = useState<GroupKhatmah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDuaaModalOpen, setIsDuaaModalOpen] = useState(false);
  const [reservingPartNumber, setReservingPartNumber] = useState<number | null>(null);
  const [selectedPartForAction, setSelectedPartForAction] = useState<number | null>(null);

  const { setFontStyle, setSelectedEdition } = useSettingsContext();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Load single Khatmah data
  const loadKhatmahData = useCallback(async (id: string, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await khatmahService.getKhatmah(id);
      if (data) {
        setKhatmah(data);
      } else {
        setError('لم يتم العثور على هذه الختمة. قد تكون جديدة أو تم حذفها.');
      }
    } catch (err: any) {
      console.error('Error loading khatmah:', err);
      if (!silent) setError('تعذر تحميل بيانات الختمة. تحقق من الاتصال.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Load list of all available Khatmahs
  const loadKhatmahsList = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const list = await khatmahService.listRecentKhatmahs();
      setKhatmahsList(list);
      return list;
    } catch (err) {
      console.error('Error loading khatmahs list:', err);
      return [];
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await loadKhatmahsList(true);
      if (currentKhatmahId) {
        await loadKhatmahData(currentKhatmahId);
      }
      setIsLoading(false);
    };
    init();
  }, [currentKhatmahId, loadKhatmahData, loadKhatmahsList]);

  // Real-time live polling & sync (auto updates without manual refresh button)
  useEffect(() => {
    const unsubscribe = khatmahService.onSync(() => {
      if (currentKhatmahId) {
        loadKhatmahData(currentKhatmahId, true);
      }
      loadKhatmahsList(true);
    });

    const interval = setInterval(() => {
      if (currentKhatmahId) {
        loadKhatmahData(currentKhatmahId, true);
      } else {
        loadKhatmahsList(true);
      }
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentKhatmahId, loadKhatmahData, loadKhatmahsList]);

  // Ensure unique list of khatmahs by id
  const uniqueKhatmahsList = useMemo(() => {
    const map = new Map<string, GroupKhatmah>();
    khatmahsList.forEach((k, idx) => {
      if (k) {
        const idKey = k.id || `khatmah-${idx}`;
        if (!map.has(idKey)) {
          map.set(idKey, { ...k, id: idKey });
        }
      }
    });
    return Array.from(map.values());
  }, [khatmahsList]);

  // Listen to hash changes (#/khatmah or #/khatmah/KHT-1234)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/#\/khatmah\/([A-Za-z0-9_-]+)/i);
      if (match && match[1]) {
        const newId = match[1].toUpperCase();
        if (newId !== currentKhatmahId) {
          setCurrentKhatmahId(newId);
          loadKhatmahData(newId);
        }
      } else if (hash === '#/khatmah' || hash.startsWith('#/khatmah?')) {
        setCurrentKhatmahId(null);
        setKhatmah(null);
        loadKhatmahsList(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentKhatmahId, loadKhatmahData, loadKhatmahsList]);

  // Calculate statistics for active single khatmah
  const stats = useMemo(() => {
    if (!khatmah || !khatmah.parts) {
      return { completed: 0, reserved: 0, available: 30, percent: 0 };
    }
    let completed = 0;
    let reserved = 0;
    let available = 0;

    for (let i = 1; i <= 30; i++) {
      const p = khatmah.parts[i];
      if (p?.status === 'completed') completed++;
      else if (p?.status === 'reserved') reserved++;
      else available++;
    }

    const percent = Math.round((completed / 30) * 100);
    return { completed, reserved, available, percent };
  }, [khatmah]);

  // Helper for computing single khatmah completion percentage
  const getKhatmahProgress = (k: GroupKhatmah) => {
    let completed = 0;
    let reserved = 0;
    if (k.parts) {
      Object.values(k.parts).forEach(p => {
        if (p.status === 'completed') completed++;
        else if (p.status === 'reserved') reserved++;
      });
    }
    const percent = Math.round((completed / 30) * 100);
    const available = 30 - completed - reserved;
    return { completed, reserved, available, percent };
  };

  // Handlers for Khatmah actions
  const handleCreateKhatmah = async (params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
    khatmahType?: 'once' | 'monthly_recurring';
  }) => {
    const created = await khatmahService.createKhatmah(params);
    setCurrentKhatmahId(created.id);
    setKhatmah(created);
    window.location.hash = `#/khatmah/${created.id}`;
    await loadKhatmahsList(true);
    showToast(`تم إنشاء الختمة بنجاح! كود الختمة: ${created.id}`);
    return created.id;
  };

  const handleReserveConfirm = async (name: string, andReadNow = false) => {
    if (!khatmah || reservingPartNumber === null) return;
    const partNum = reservingPartNumber;
    const cleanName = name.trim() || 'مشارك';

    // 1. Instant optimistic update: change box color immediately
    const optimisticParts = {
      ...(khatmah.parts || {}),
      [partNum]: {
        partNumber: partNum,
        status: 'reserved' as const,
        reservedBy: cleanName,
        reservedAt: Date.now(),
      },
    };
    setKhatmah({
      ...khatmah,
      parts: optimisticParts,
    });
    setReservingPartNumber(null);

    try {
      const updated = await khatmahService.reservePart(khatmah.id, partNum, cleanName);
      setKhatmah({ ...updated, parts: { ...updated.parts } });
      showToast(`تم حجز الجزء ${partNum} باسم "${cleanName}" بنجاح.`);

      if (andReadNow) {
        handleNavigateToJuzReading(partNum);
      }
    } catch (err: any) {
      console.error('Reserve error:', err);
      showToast('حدث خطأ أثناء حجز الجزء، يرجى المحاولة ثانية.');
      loadKhatmahData(khatmah.id, true);
    }
  };

  const handleUnreserve = async (partNumber: number) => {
    if (!khatmah) return;

    // Instant optimistic update
    const optimisticParts = {
      ...(khatmah.parts || {}),
      [partNumber]: {
        partNumber,
        status: 'available' as const,
      },
    };
    setKhatmah({
      ...khatmah,
      parts: optimisticParts,
      isCompleted: false,
    });

    try {
      const updated = await khatmahService.unreservePart(khatmah.id, partNumber);
      setKhatmah({ ...updated, parts: { ...updated.parts } });
      showToast(`تم إلغاء حجز الجزء ${partNumber} وإتاحته للجميع`);
    } catch (err: any) {
      console.error('Unreserve error:', err);
      showToast('حدث خطأ أثناء إلغاء الحجز');
      loadKhatmahData(khatmah.id, true);
    }
  };

  const handleCompletePart = async (partNumber: number) => {
    if (!khatmah) return;

    const existingPart = khatmah.parts?.[partNumber];
    const completedBy = existingPart?.reservedBy || existingPart?.completedBy || 'فاعل خير';

    // Instant optimistic update
    const optimisticParts = {
      ...(khatmah.parts || {}),
      [partNumber]: {
        partNumber,
        status: 'completed' as const,
        completedBy,
        completedAt: Date.now(),
      },
    };

    let completedCount = 0;
    for (let i = 1; i <= 30; i++) {
      if (optimisticParts[i]?.status === 'completed') completedCount++;
    }
    const isCompleted = completedCount === 30;

    setKhatmah({
      ...khatmah,
      parts: optimisticParts,
      isCompleted,
      completedAt: isCompleted ? Date.now() : undefined,
    });

    try {
      const updated = await khatmahService.completePart(khatmah.id, partNumber, completedBy);
      setKhatmah({ ...updated, parts: { ...updated.parts } });
      showToast(`مبارك! تم تسجيل إتمام الجزء ${partNumber} بنجاح.`);
      if (updated.isCompleted) {
        setIsDuaaModalOpen(true);
      }
    } catch (err: any) {
      console.error('Complete part error:', err);
      showToast('حدث خطأ أثناء تأكيد الإتمام');
      loadKhatmahData(khatmah.id, true);
    }
  };

  const handleUncompletePart = async (partNumber: number) => {
    if (!khatmah) return;

    const prevPart = khatmah.parts?.[partNumber];
    const optimisticParts = {
      ...(khatmah.parts || {}),
      [partNumber]: {
        partNumber,
        status: prevPart?.reservedBy ? ('reserved' as const) : ('available' as const),
        reservedBy: prevPart?.reservedBy,
      },
    };

    setKhatmah({
      ...khatmah,
      parts: optimisticParts,
      isCompleted: false,
    });

    try {
      const updated = await khatmahService.uncompletePart(khatmah.id, partNumber);
      setKhatmah({ ...updated, parts: { ...updated.parts } });
      showToast(`تم التراجع عن إتمام الجزء ${partNumber}`);
    } catch (err: any) {
      console.error('Uncomplete part error:', err);
      showToast('حدث خطأ أثناء التراجع');
      loadKhatmahData(khatmah.id, true);
    }
  };

  // Jump to reading this Juz in the Quran reader
  const handleNavigateToJuzReading = (partNumber: number) => {
    const juzInfo = JUZ_INDEX.find(j => j.number === partNumber);
    if (!juzInfo) return;

    setFontStyle('uthmani');
    setSelectedEdition('quran-uthmani-quran-academy');

    if (onNavigateToJuz) {
      onNavigateToJuz(juzInfo.startSurah, juzInfo.startAyah);
    } else {
      window.location.hash = `#/surah/${juzInfo.startSurah}?ayah=${juzInfo.startAyah}`;
    }
  };

  // Share helpers with Program Name: "الباحث في القرآن الكريم"
  const getShareUrl = (khatmahId?: string) => {
    const origin = window.location.origin + window.location.pathname;
    if (khatmahId) {
      return `${origin}#/khatmah/${khatmahId}`;
    }
    if (currentKhatmahId) {
      return `${origin}#/khatmah/${currentKhatmahId}`;
    }
    return `${origin}#/khatmah`;
  };

  const handleCopyLink = async (targetId?: string) => {
    const k = (targetId && uniqueKhatmahsList.find(item => item.id === targetId)) || khatmah;
    const url = getShareUrl(targetId);
    const textToCopy = k
      ? `🌿 دعوة للمشاركة في ختمة قرآنية مباركة: "${k.title}"${k.dedication ? `\n🕊️ الإهداء: ${k.dedication}` : ''}\n📱 تطبيق الباحث في القرآن الكريم - QRAN.TOP\nشاركنا الأجر واختر جزءك عبر الرابط:\n${url}`
      : `🌿 الختمات القرآنية الجماعية - برنامج الباحث في القرآن الكريم (QRAN.TOP)\n${url}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('تم نسخ رابط الختمة بنجاح!');
    } catch {
      const input = document.createElement('input');
      input.value = textToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast('تم نسخ رابط الختمة بنجاح!');
    }
  };

  const handleWhatsAppShare = (targetKhatmah?: GroupKhatmah) => {
    const k = targetKhatmah || khatmah;
    const url = getShareUrl(k?.id);
    let text = '';
    if (k) {
      text = `🌿 *دعوة للمشاركة في ختمة قرآنية مباركة*\n📖 *${k.title}*${
        k.dedication ? `\n🕊️ *الإهداء:* ${k.dedication}` : ''
      }\n\n📱 *برنامج الباحث في القرآن الكريم (QRAN.TOP)*\nشاركنا الأجر واختر جزءك الآن عبر الرابط المباشر:\n${url}`;
    } else {
      text = `🌿 *ختمة القرآن الكريم الجماعية*\n📱 *برنامج الباحث في القرآن الكريم (QRAN.TOP)*\nشاركنا قراءة وختم القرآن الكريم وتوزيع الأجزاء عبر الرابط:\n${url}`;
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleTelegramShare = (targetKhatmah?: GroupKhatmah) => {
    const k = targetKhatmah || khatmah;
    const url = getShareUrl(k?.id);
    let text = '';
    if (k) {
      text = `🌿 دعوة للمشاركة في ختمة قرآنية مباركة: ${k.title}${
        k.dedication ? ` (${k.dedication})` : ''
      }\nبرنامج الباحث في القرآن الكريم - QRAN.TOP\nاختر جزءك وشاركنا الأجر عبر الرابط:\n${url}`;
    } else {
      text = `🌿 ختمة القرآن الكريم الجماعية - برنامج الباحث في القرآن الكريم (QRAN.TOP)\n${url}`;
    }
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

  // Open specific Khatmah
  const handleOpenKhatmah = (id: string) => {
    setCurrentKhatmahId(id);
    window.location.hash = `#/khatmah/${id}`;
    loadKhatmahData(id);
  };

  // Back to All Khatmahs list
  const handleBackToAllKhatmahs = () => {
    setCurrentKhatmahId(null);
    setKhatmah(null);
    window.location.hash = `#/khatmah`;
    loadKhatmahsList();
  };

  // Start new cycle for completed Khatmah
  const handleStartNewCycle = async () => {
    if (!khatmah) return;
    try {
      const reset = await khatmahService.resetKhatmahCycle(khatmah.id);
      setKhatmah(reset);
      showToast('تم بدء دورة جديدة لهذه الختمة بنجاح!');
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء تجديد الدورة');
    }
  };

  // Part Box Click Handler
  const handlePartClick = (partNum: number) => {
    if (!khatmah) return;
    const partData = khatmah.parts?.[partNum];
    if (!partData || partData.status === 'available') {
      setReservingPartNumber(partNum);
    } else {
      setSelectedPartForAction(partNum);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 animate-fade-in space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-text-primary text-surface px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-border-default animate-fade-in font-medium text-sm">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & SHARING TOOLBAR */}
      <div className="bg-surface border border-border-default rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Header Title / Back button */}
          <div className="flex items-center gap-3">
            {currentKhatmahId && (
              <button
                onClick={handleBackToAllKhatmahs}
                className="p-2.5 bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-primary rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold"
                title="الرجوع إلى قائمة كافة الختمات"
              >
                <span>←</span>
                <span>كافة الختمات</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">📖</span>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-text-primary">
                  {currentKhatmahId ? 'الختمة القرآنية المباركة' : 'الختمات القرآنية الجماعية'}
                </h1>
                <p className="text-xs text-text-muted">
                  {currentKhatmahId
                    ? 'اختر رقم الجزء للحجز أو تسجيل القراءة'
                    : 'شارك في ختمة قائمة أو أنشئ ختمة خاصة بالأهل والأصدقاء'}
                </p>
              </div>
            </div>
          </div>

          {/* Action and Sharing Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
            {/* Create New Khatmah */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              <span>إنشاء ختمة جديدة</span>
            </button>

            {/* Copy Share Link */}
            <button
              onClick={() => handleCopyLink()}
              className="px-3.5 py-2.5 bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-primary text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-1.5"
              title="نسخ الرابط للمشاركة"
            >
              <CopyIcon className="w-4 h-4 text-primary" />
              <span>نسخ الرابط</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={() => handleWhatsAppShare()}
              className="px-3.5 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs sm:text-sm font-bold rounded-2xl border border-[#25D366]/30 transition-all flex items-center gap-1.5"
              title="مشاركة عبر واتساب"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>واتساب</span>
            </button>

            {/* Telegram Share */}
            <button
              onClick={() => handleTelegramShare()}
              className="px-3.5 py-2.5 bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-[#0088cc] text-xs sm:text-sm font-bold rounded-2xl border border-[#0088cc]/30 transition-all flex items-center gap-1.5"
              title="مشاركة عبر تيليجرام"
            >
              <TelegramIcon className="w-4 h-4" />
              <span>تيليجرام</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ALL AVAILABLE KHATMAHS (Main Hub) */}
      {/* ========================================================================= */}
      {!currentKhatmahId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
              <span>📋</span>
              <span>الختمات القرآنية ({uniqueKhatmahsList.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadKhatmahsList(false)}
                className="px-2.5 py-1 text-xs bg-surface-subtle hover:bg-surface-hover border border-border-default rounded-xl font-bold text-text-secondary hover:text-text-primary transition-all flex items-center gap-1"
                title="تحديث قائمة الختمات"
              >
                <span>🔄</span>
                <span>تحديث</span>
              </button>
              <span className="text-xs text-text-muted hidden sm:inline">اضغط على أي ختمة لاختيار وحجز الأجزاء</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-text-secondary">جاري تحميل الختمات المتاحة...</p>
            </div>
          ) : uniqueKhatmahsList.length === 0 ? (
            <div className="p-8 sm:p-12 bg-surface border border-border-default rounded-3xl text-center space-y-4 shadow-sm">
              <span className="text-5xl">🌿</span>
              <h3 className="text-lg font-bold text-text-primary">لا توجد ختمات حالياً</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                كن أول من ينال الأجر ويبدأ ختمة قرآنية جديدة لمشاركتها مع الأهل والأصدقاء
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-2xl shadow hover:bg-primary/90 transition-all inline-flex items-center gap-2 text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span>إنشاء أول ختمة الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueKhatmahsList.map((k, idx) => {
                const prog = getKhatmahProgress(k);
                const isDone = k.isCompleted || prog.percent === 100;
                const isPeriodic = k.khatmahType === 'monthly_recurring';

                return (
                  <div
                    key={`khatmah-card-${k.id}-${idx}`}
                    className="bg-surface border border-border-default hover:border-primary rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer relative group"
                    onClick={() => handleOpenKhatmah(k.id)}
                  >
                    {/* Header: Title & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                          {k.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          {isPeriodic && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-500/20 whitespace-nowrap">
                              🔄 دورية شهرية
                            </span>
                          )}
                          {isDone ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                              <CheckIcon className="w-3 h-3" />
                              مكتملة
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-surface-subtle text-text-muted text-[10px] font-mono border border-border-default">
                              {k.id}
                            </span>
                          )}
                        </div>
                      </div>

                      {k.dedication && (
                        <p className="text-xs text-text-secondary line-clamp-1 flex items-center gap-1">
                          <span>🕊️</span>
                          <span>{k.dedication}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted pt-1">
                        {k.createdBy && <span>منشئ الختمة: {k.createdBy}</span>}
                        {k.targetDate && <span>موعد الختم: {k.targetDate}</span>}
                      </div>
                    </div>

                    {/* Progress Bar & Badges */}
                    <div className="space-y-2 pt-2 border-t border-border-subtle">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-text-primary">
                          الإنجاز: <span className="text-primary font-mono">{prog.percent}%</span>
                        </span>
                        <span className="text-text-muted text-[11px]">
                          {prog.completed} من 30 جزء
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden border border-border-default flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${(prog.completed / 30) * 100}%` }}
                        ></div>
                        <div
                          className="h-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${(prog.reserved / 30) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted pt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ✓ {prog.completed} مقروء
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          ⏳ {prog.reserved} محجوز
                        </span>
                        <span>
                          ⚪ {prog.available} متاح
                        </span>
                      </div>
                    </div>

                    {/* Actions & Open Button */}
                    <div
                      className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Social share icons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(k.id)}
                          className="p-2 text-text-muted hover:text-primary bg-surface-subtle hover:bg-surface border border-border-default rounded-xl transition-colors"
                          title="نسخ رابط الختمة"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(k)}
                          className="p-2 text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 rounded-xl transition-colors"
                          title="مشاركة واتساب"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTelegramShare(k)}
                          className="p-2 text-[#0088cc] bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/25 rounded-xl transition-colors"
                          title="مشاركة تيليجرام"
                        >
                          <TelegramIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Primary Open Button */}
                      <button
                        onClick={() => handleOpenKhatmah(k.id)}
                        className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-xl border border-primary/25 transition-all flex items-center gap-1"
                      >
                        <span>عرض الأجزاء</span>
                        <span>←</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SPECIFIC KHATMAH DETAILS & 30 JUZ NUMBERS GRID */}
      {/* ========================================================================= */}
      {currentKhatmahId && (
        <div className="space-y-6">
          {/* Active Khatmah Info Card */}
          {khatmah && (
            <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold border border-primary/20">
                      {khatmah.id}
                    </span>
                    {khatmah.khatmahType === 'monthly_recurring' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-500/25">
                        🔄 دورية شهرية (الدورة {khatmah.cycleNumber || 1})
                      </span>
                    )}
                    <h2 className="text-xl sm:text-2xl font-black text-text-primary">{khatmah.title}</h2>
                  </div>
                  {khatmah.dedication && (
                    <p className="text-sm text-text-secondary mt-1.5 flex items-center gap-1.5">
                      <span>🕊️</span>
                      <span>{khatmah.dedication}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mt-2">
                    {khatmah.createdBy && <span>منشئ الختمة: {khatmah.createdBy}</span>}
                    {khatmah.targetDate && <span>موعد الختم: {khatmah.targetDate}</span>}
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>مزامنة سحابية مباشرة</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackToAllKhatmahs}
                    className="px-3.5 py-2 bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-primary text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5"
                  >
                    <span>←</span>
                    <span>كافة الختمات</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-3 border-t border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-text-primary">
                    نسبة الإنجاز: <span className="text-primary font-mono text-base">{stats.percent}%</span>
                  </span>
                  <span className="text-text-secondary">
                    {stats.completed} من 30 جزء مكتمل
                  </span>
                </div>

                <div className="w-full h-3 bg-surface-subtle rounded-full overflow-hidden border border-border-default flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${(stats.completed / 30) * 100}%` }}
                  ></div>
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 ease-out"
                    style={{ width: `${(stats.reserved / 30) * 100}%` }}
                  ></div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold pt-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>مقروء: {stats.completed}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>محجوز: {stats.reserved}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-muted bg-surface-subtle px-3 py-1 rounded-xl border border-border-default">
                    <span className="w-2.5 h-2.5 rounded-full bg-border-default"></span>
                    <span>متاح: {stats.available}</span>
                  </div>

                  {khatmah.isCompleted && (
                    <button
                      onClick={() => setIsDuaaModalOpen(true)}
                      className="mr-auto px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow animate-bounce"
                    >
                      <span>🤲</span>
                      <span>دعاء ختم القرآن</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Celebratory Completed Banner */}
          {khatmah?.isCompleted && (
            <div className="p-6 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-emerald-500/40 rounded-3xl text-center space-y-4 shadow-md animate-fade-in">
              <div className="text-4xl sm:text-5xl">🎉 🤲 ✨</div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  مبارك! تم بحمد الله إتمام هذه الختمة المباركة بالكامل
                </h3>
                <p className="text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
                  تقبل الله من جميع القراء والمشاركين، وجعل هذا العمل في ميزان حسناتكم ونوراً لكم.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsDuaaModalOpen(true)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow flex items-center gap-2 transition-all"
                >
                  <span>🤲</span>
                  <span>قراءة دعاء ختم القرآن الكريم</span>
                </button>

                <button
                  onClick={handleStartNewCycle}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-hover text-text-primary border border-border-default font-bold rounded-2xl shadow-sm flex items-center gap-2 transition-all"
                >
                  <span>🔄</span>
                  <span>تجديد الختمة لدورة جديدة</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading state for single khatmah */}
          {isLoading && (
            <div className="text-center py-16 space-y-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-text-secondary">جاري تحديث بيانات الأجزاء...</p>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-center space-y-3">
              <p className="text-base font-bold text-red-600">{error}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => loadKhatmahData(currentKhatmahId || '')}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
                >
                  إعادة المحاولة
                </button>
                <button
                  onClick={handleBackToAllKhatmahs}
                  className="px-4 py-2 bg-surface border border-border-default text-text-primary text-xs font-bold rounded-xl"
                >
                  الرجوع لكافة الختمات
                </button>
              </div>
            </div>
          )}

          {/* 30 Juz Numbers Grid: Clean, intuitive number-only grid with status colors */}
          {!isLoading && khatmah && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
                  <span>📚</span>
                  <span>أجزاء القرآن الكريم (1 - 30)</span>
                </h3>

                {/* Color Legend */}
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span>مقروء</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    <span>محجوز</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <span className="w-3 h-3 rounded-full bg-surface border border-border-default inline-block"></span>
                    <span>متاح</span>
                  </span>
                </div>
              </div>

              {/* Responsive 30 Parts Board */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5 sm:gap-3">
                {Array.from({ length: 30 }, (_, idx) => {
                  const partNum = idx + 1;
                  const partData: KhatmahPart = khatmah.parts?.[partNum] || {
                    partNumber: partNum,
                    status: 'available',
                  };

                  const isCompleted = partData.status === 'completed';
                  const isReserved = partData.status === 'reserved';

                  const reader = isCompleted
                    ? (partData.completedBy || partData.reservedBy || 'مكتمل')
                    : isReserved
                    ? (partData.reservedBy || 'محجوز')
                    : 'متاح';

                  return (
                    <button
                      key={`part-box-${partNum}`}
                      type="button"
                      onClick={() => handlePartClick(partNum)}
                      title={`الجزء ${partNum}: ${
                        isCompleted
                          ? `تمت القراءة (${reader})`
                          : isReserved
                          ? `محجوز (${reader})`
                          : 'متاح للحجز'
                      }`}
                      className={`relative aspect-square rounded-2xl sm:rounded-3xl p-1 sm:p-2 border-2 transition-all flex flex-col items-center justify-center cursor-pointer select-none shadow-sm hover:scale-[1.04] active:scale-95 group ${
                        isCompleted
                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/60 hover:border-emerald-500 text-emerald-900 dark:text-emerald-100'
                          : isReserved
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/50 hover:border-amber-500 text-amber-900 dark:text-amber-100'
                          : 'bg-surface hover:bg-surface-subtle border-border-default hover:border-primary/60 text-text-primary'
                      }`}
                    >
                      {/* Top indicator badge */}
                      {isCompleted ? (
                        <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm font-bold">
                          ✓
                        </span>
                      ) : isReserved ? (
                        <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/40"></span>
                      ) : null}

                      {/* Part Number Prominent Display */}
                      <span
                        className={`text-xl sm:text-2xl md:text-3xl font-black font-mono leading-none tracking-tight ${
                          isCompleted
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : isReserved
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-text-primary group-hover:text-primary transition-colors'
                        }`}
                      >
                        {partNum}
                      </span>

                      {/* Bottom status text / reader name */}
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold truncate max-w-full px-1 mt-1 text-center leading-none ${
                          isCompleted
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : isReserved
                            ? 'text-amber-800 dark:text-amber-200'
                            : 'text-text-muted group-hover:text-primary'
                        }`}
                      >
                        {isCompleted ? reader : isReserved ? reader : '+ احجز'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reserve Part Modal */}
      {reservingPartNumber !== null && (
        <ReserveJuzModal
          juzNumber={reservingPartNumber}
          juzSurahName={JUZ_SURAHS_NAMES[reservingPartNumber - 1]}
          onClose={() => setReservingPartNumber(null)}
          onReserve={handleReserveConfirm}
        />
      )}

      {/* Part Action Modal (Complete / Read / Unreserve) */}
      {selectedPartForAction !== null && khatmah && khatmah.parts?.[selectedPartForAction] && (
        <PartActionModal
          juzNumber={selectedPartForAction}
          juzSurahName={JUZ_SURAHS_NAMES[selectedPartForAction - 1]}
          readerName={
            khatmah.parts[selectedPartForAction]?.completedBy ||
            khatmah.parts[selectedPartForAction]?.reservedBy
          }
          status={
            khatmah.parts[selectedPartForAction]?.status === 'completed'
              ? 'completed'
              : 'reserved'
          }
          onClose={() => setSelectedPartForAction(null)}
          onReadNow={() => handleNavigateToJuzReading(selectedPartForAction)}
          onComplete={() => handleCompletePart(selectedPartForAction)}
          onUnreserve={() => handleUnreserve(selectedPartForAction)}
          onUncomplete={() => handleUncompletePart(selectedPartForAction)}
        />
      )}

      {/* Create Khatmah Modal */}
      {isCreateModalOpen && (
        <CreateKhatmahModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateKhatmah}
        />
      )}

      {/* Duaa Khatm Al-Quran Modal */}
      <DuaaKhatmModal
        isOpen={isDuaaModalOpen}
        onClose={() => setIsDuaaModalOpen(false)}
      />
    </div>
  );
};

export default GroupKhatmahView;
