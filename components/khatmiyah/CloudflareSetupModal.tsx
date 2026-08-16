import React, { useState, useEffect } from 'react';
import { ClearIcon, CheckIcon, SpinnerIcon, RefreshIcon } from '../icons';
import { getCloudflareWorkerUrl, setCloudflareWorkerUrl, getCloudflareStatus } from '../../services/khatmahService';

interface CloudflareSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CloudflareSetupModal: React.FC<CloudflareSetupModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [workerUrl, setUrl] = useState(getCloudflareWorkerUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Backend Cloudflare auto-status
  const [cfStatus, setCfStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const st = await getCloudflareStatus();
      setCfStatus(st);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setCloudflareWorkerUrl(workerUrl);
    onSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!workerUrl.trim()) {
      setTestResult({ success: false, message: 'يرجى إدخال رابط الـ Worker أولاً' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmahs`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setTestResult({ success: true, message: 'تم الاتصال بـ Cloudflare Worker بنجاح!' });
      } else {
        setTestResult({ success: false, message: `استجاب الخادم برمز خطأ: ${res.status}` });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: `فشل الاتصال: ${e.message || 'تأكد من تفعيل CORS في الـ Worker'}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = () => {
    fetch('/cloudflare-worker.js')
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-border-default rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">إعدادات سحابة Cloudflare والتخزين</h2>
              <p className="text-xs text-text-muted">المزامنة السحابية الفورية للختمة القرآنية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-colors">
            <ClearIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Automatic Server Integration Status */}
          <div className="p-4 rounded-2xl border border-border-default bg-surface-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span>🛡️</span>
                <span>حالة الربط السحابي التلقائي (الخادم)</span>
              </span>
              <button
                onClick={fetchStatus}
                disabled={isLoadingStatus}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>إعادة الفحص</span>
              </button>
            </div>

            {cfStatus ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-subtle">
                  <span className="text-text-muted">وضع التخزين:</span>
                  <span className={`font-bold ${cfStatus.storageMode === 'cloudflare_kv' ? 'text-emerald-600' : 'text-primary'}`}>
                    {cfStatus.storageMode === 'cloudflare_kv' ? '⚡ Cloudflare KV (سحابي)' : '💾 خادم التطبيق المباشر'}
                  </span>
                </div>

                {cfStatus.accountName && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-subtle">
                    <span className="text-text-muted">حساب Cloudflare:</span>
                    <span className="font-bold text-text-primary">{cfStatus.accountName}</span>
                  </div>
                )}

                {cfStatus.namespaceTitle && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-subtle">
                    <span className="text-text-muted">قاعدة البيانات (KV):</span>
                    <span className="font-mono font-bold text-emerald-600">{cfStatus.namespaceTitle}</span>
                  </div>
                )}

                <p className="text-xs text-text-secondary leading-relaxed pt-1">
                  {cfStatus.message}
                </p>
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-text-muted">
                جاري فحص حالة التخزين...
              </div>
            )}
          </div>

          {/* Cloudflare Worker URL field (Optional) */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-text-primary">
              رابط Cloudflare Worker API (اختياري للربط الخارجي المباشر)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={workerUrl}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://khatmah-api.your-subdomain.workers.dev"
                dir="ltr"
                className="flex-1 p-2.5 border rounded-xl bg-surface border-border-default text-text-primary text-xs sm:text-sm font-mono focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2.5 bg-surface-subtle hover:bg-surface-hover border border-border-default rounded-xl text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5"
              >
                {isTesting ? <SpinnerIcon className="w-4 h-4" /> : 'فحص'}
              </button>
            </div>
            {testResult && (
              <p className={`mt-2 text-xs font-semibold ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                {testResult.message}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full py-2.5 px-4 bg-surface-subtle hover:bg-surface-hover border border-border-default rounded-xl text-xs sm:text-sm font-bold text-text-primary transition-colors flex items-center justify-center gap-2"
            >
              <span>📋</span>
              <span>{copied ? 'تم نسخ كود الـ Worker إلى الحافظة!' : 'نسخ كود Cloudflare Worker الجاهز'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default bg-surface-subtle flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs sm:text-sm text-text-secondary hover:bg-surface rounded-xl">
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            حفظ وتأكيد
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudflareSetupModal;
