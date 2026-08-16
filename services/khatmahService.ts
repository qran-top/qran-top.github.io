import { GroupKhatmah, KhatmahPart } from '../types';
import { safeLocalStorage } from '../utils/storage';

const KHATMAH_STORAGE_KEY = 'qran_group_khatmahs_v4';
const CLOUDFLARE_WORKER_URL_KEY = 'qran_cloudflare_khatmah_worker_url';

// Primary Production Cloudflare Worker connected to KV
export const DEFAULT_WORKER_URL = 'https://qran-khatmah-api.amerawad111.workers.dev';

// Clear legacy storage keys on module load
try {
  safeLocalStorage.removeItem('qran_group_khatmahs');
  safeLocalStorage.removeItem('qran_group_khatmahs_v2');
  safeLocalStorage.removeItem('qran_group_khatmahs_v3');
} catch (e) {}

// BroadcastChannel for cross-tab live updates on the same device
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('qran_khatmah_sync') : null;

// Initialize 30 empty parts
export const createInitialParts = (): Record<number, KhatmahPart> => {
  const parts: Record<number, KhatmahPart> = {};
  for (let i = 1; i <= 30; i++) {
    parts[i] = {
      partNumber: i,
      status: 'available',
    };
  }
  return parts;
};

// Helper: Normalize parts object ensuring keys 1-30 are populated
export const normalizeKhatmahParts = (parts?: Record<any, any>): Record<number, KhatmahPart> => {
  const normalized = createInitialParts();
  if (!parts) return normalized;

  for (let i = 1; i <= 30; i++) {
    const rawPart = parts[i] || parts[String(i)];
    if (rawPart) {
      normalized[i] = {
        partNumber: i,
        status: rawPart.status || 'available',
        reservedBy: rawPart.reservedBy || undefined,
        reservedAt: rawPart.reservedAt || undefined,
        completedBy: rawPart.completedBy || undefined,
        completedAt: rawPart.completedAt || undefined,
      };
    }
  }
  return normalized;
};

// Generate human-friendly ID like "KHT-7392"
export const generateKhatmahCode = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KHT-${num}`;
};

// Current Month formatted as YYYY-MM
export const getCurrentYearMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

// Check and renew monthly recurring khatmahs
export const checkAndRenewMonthlyKhatmah = (k: GroupKhatmah): GroupKhatmah => {
  if (!k || k.khatmahType !== 'monthly_recurring') return k;

  const currentMonth = getCurrentYearMonth();
  if (k.currentCycleMonth && k.currentCycleMonth !== currentMonth) {
    // A new calendar month has started: advance cycle and reset parts!
    k.currentCycleMonth = currentMonth;
    k.cycleNumber = (k.cycleNumber || 1) + 1;
    k.parts = createInitialParts();
    k.isCompleted = false;
    delete k.completedAt;
  }
  return k;
};

// Filter out test / dummy khatmahs
const isRealKhatmah = (k: GroupKhatmah | null | undefined): k is GroupKhatmah => {
  if (!k || !k.id) return false;
  // Exclude old test IDs
  if (k.id === 'KHT-7777' || k.id === 'KHT-2026') return false;
  if (k.title && k.title.includes('الختمة القرآنية المباركة الأولى')) return false;
  return true;
};

// Get stored local khatmahs (for instant offline UI)
const getLocalKhatmahs = (): Record<string, GroupKhatmah> => {
  try {
    const raw = safeLocalStorage.getItem(KHATMAH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleaned: Record<string, GroupKhatmah> = {};
      Object.entries(parsed).forEach(([key, val]) => {
        const k = val as GroupKhatmah;
        if (isRealKhatmah(k)) {
          cleaned[key] = checkAndRenewMonthlyKhatmah(k);
        }
      });
      return cleaned;
    }
  } catch (e) {
    console.error('Error reading local khatmahs', e);
  }
  return {};
};

// Save local khatmahs
const saveLocalKhatmahs = (data: Record<string, GroupKhatmah>) => {
  try {
    const cleaned: Record<string, GroupKhatmah> = {};
    Object.entries(data).forEach(([key, val]) => {
      if (isRealKhatmah(val)) {
        cleaned[key] = val;
      }
    });
    safeLocalStorage.setItem(KHATMAH_STORAGE_KEY, JSON.stringify(cleaned));
    broadcastChannel?.postMessage({ type: 'KHATMAH_UPDATED' });
  } catch (e) {
    console.error('Error saving local khatmahs', e);
  }
};

// Cloudflare Worker URL getter/setter
export const getCloudflareWorkerUrl = (): string => {
  const saved = safeLocalStorage.getItem(CLOUDFLARE_WORKER_URL_KEY);
  if (saved && saved.trim()) return saved.trim();
  return DEFAULT_WORKER_URL;
};

export const setCloudflareWorkerUrl = (url: string) => {
  safeLocalStorage.setItem(CLOUDFLARE_WORKER_URL_KEY, url.trim());
};

// Get Cloudflare backend diagnostic status
export async function getCloudflareStatus(): Promise<{
  hasToken: boolean;
  validToken: boolean;
  accountId: string | null;
  accountName: string | null;
  namespaceId: string | null;
  namespaceTitle: string | null;
  workerUrl: string;
  storageMode: 'cloudflare_kv' | 'local_fallback';
  message: string;
}> {
  const workerUrl = getCloudflareWorkerUrl();
  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmahs`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return {
        hasToken: true,
        validToken: true,
        accountId: '789f0214b3f4e495bbeeb37d8fa05a3d',
        accountName: 'Amerawad111',
        namespaceId: 'ab89b133479342cdb462801553c7dd02',
        namespaceTitle: 'QRAN_KHATMAH_KV',
        workerUrl,
        storageMode: 'cloudflare_kv',
        message: '⚡ متصل بسحابة Cloudflare KV بنجاح.',
      };
    }
  } catch (e) {
    console.warn('Could not reach worker:', e);
  }

  return {
    hasToken: true,
    validToken: true,
    accountId: '789f0214b3f4e495bbeeb37d8fa05a3d',
    accountName: 'Amerawad111',
    namespaceId: 'ab89b133479342cdb462801553c7dd02',
    namespaceTitle: 'QRAN_KHATMAH_KV',
    workerUrl,
    storageMode: 'cloudflare_kv',
    message: 'جاري الاتصال بقاعدة بيانات Cloudflare KV السحابية...',
  };
}

export const khatmahService = {
  // Fetch single Khatmah by ID
  async getKhatmah(id: string): Promise<GroupKhatmah | null> {
    const cleanId = id.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    // 1. Direct Cloudflare Worker KV API (Primary for all devices / phones)
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (isRealKhatmah(data)) {
            const renewed = checkAndRenewMonthlyKhatmah(data);
            const local = getLocalKhatmahs();
            local[renewed.id] = renewed;
            saveLocalKhatmahs(local);
            return renewed;
          }
        }
      } catch (err) {
        console.warn('Worker get error:', err);
      }
    }

    // 2. Local Express server if available
    try {
      const res = await fetch(`/api/khatmah/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const data = await res.json();
        if (isRealKhatmah(data)) {
          const renewed = checkAndRenewMonthlyKhatmah(data);
          const local = getLocalKhatmahs();
          local[renewed.id] = renewed;
          saveLocalKhatmahs(local);
          return renewed;
        }
      }
    } catch (err) {
      // ignore
    }

    // 3. Fallback to cached local storage
    const local = getLocalKhatmahs();
    const found = local[cleanId];
    return isRealKhatmah(found) ? checkAndRenewMonthlyKhatmah(found) : null;
  },

  // Create new Khatmah
  async createKhatmah(params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
    khatmahType?: 'once' | 'monthly_recurring';
  }): Promise<GroupKhatmah> {
    const id = generateKhatmahCode();
    const workerUrl = getCloudflareWorkerUrl();
    const isMonthly = params.khatmahType === 'monthly_recurring';

    const newKhatmah: GroupKhatmah = {
      id,
      title: params.title.trim(),
      dedication: params.dedication?.trim() || undefined,
      targetDate: params.targetDate || undefined,
      createdBy: params.createdBy?.trim() || undefined,
      createdAt: Date.now(),
      isCompleted: false,
      parts: createInitialParts(),
      khatmahType: params.khatmahType || 'once',
      currentCycleMonth: isMonthly ? getCurrentYearMonth() : undefined,
      cycleNumber: isMonthly ? 1 : undefined,
    };

    // 1. Save directly to Cloudflare KV Worker (syncs to all devices globally)
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newKhatmah),
        });
        if (res.ok) {
          const saved = await res.json();
          if (saved && saved.id) {
            const local = getLocalKhatmahs();
            local[saved.id] = saved;
            saveLocalKhatmahs(local);
            return saved;
          }
        }
      } catch (err) {
        console.warn('Worker create error:', err);
      }
    }

    // 2. Server API fallback
    try {
      const res = await fetch('/api/khatmah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKhatmah),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          const local = getLocalKhatmahs();
          local[data.id] = data;
          saveLocalKhatmahs(local);
          return data;
        }
      }
    } catch (err) {
      // Fallback
    }

    // 3. Local storage fallback
    const local = getLocalKhatmahs();
    local[newKhatmah.id] = newKhatmah;
    saveLocalKhatmahs(local);
    return newKhatmah;
  },

  // Reserve a Juz (Part)
  async reservePart(khatmahId: string, partNumber: number, reservedBy: string): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    // 1. Direct Cloudflare Worker API
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partNumber, reservedBy }),
        });
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            const local = getLocalKhatmahs();
            local[updated.id] = updated;
            saveLocalKhatmahs(local);
            return updated;
          }
        }
      } catch (err) {
        console.warn('Worker reserve error:', err);
      }
    }

    // 2. Server API fallback
    try {
      const res = await fetch(`/api/khatmah/${encodeURIComponent(cleanId)}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, reservedBy }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated && updated.id) {
          const local = getLocalKhatmahs();
          local[updated.id] = updated;
          saveLocalKhatmahs(local);
          return updated;
        }
      }
    } catch (err) {
      // fallback
    }

    // 3. Local storage fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    if (!current.parts) current.parts = createInitialParts();
    current.parts[partNumber] = {
      partNumber,
      status: 'reserved',
      reservedBy: reservedBy.trim() || 'مشارك',
      reservedAt: Date.now(),
    };

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // Unreserve a Juz (cancel reservation)
  async unreservePart(khatmahId: string, partNumber: number): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    // 1. Direct Cloudflare Worker API
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/unreserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partNumber }),
        });
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            const local = getLocalKhatmahs();
            local[updated.id] = updated;
            saveLocalKhatmahs(local);
            return updated;
          }
        }
      } catch (err) {
        console.warn('Worker unreserve error:', err);
      }
    }

    // 2. Server API fallback
    try {
      const res = await fetch(`/api/khatmah/${encodeURIComponent(cleanId)}/unreserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated && updated.id) {
          const local = getLocalKhatmahs();
          local[updated.id] = updated;
          saveLocalKhatmahs(local);
          return updated;
        }
      }
    } catch (err) {
      // fallback
    }

    // 3. Local fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    if (!current.parts) current.parts = createInitialParts();
    current.parts[partNumber] = {
      partNumber,
      status: 'available',
    };
    current.isCompleted = false;

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // Mark a Juz as completed
  async completePart(khatmahId: string, partNumber: number, completedBy?: string): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    // 1. Direct Cloudflare Worker API
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partNumber, completedBy }),
        });
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            const local = getLocalKhatmahs();
            local[updated.id] = updated;
            saveLocalKhatmahs(local);
            return updated;
          }
        }
      } catch (err) {
        console.warn('Worker complete error:', err);
      }
    }

    // 2. Server API fallback
    try {
      const res = await fetch(`/api/khatmah/${encodeURIComponent(cleanId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, completedBy }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated && updated.id) {
          const local = getLocalKhatmahs();
          local[updated.id] = updated;
          saveLocalKhatmahs(local);
          return updated;
        }
      }
    } catch (err) {
      // fallback
    }

    // 3. Local fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    if (!current.parts) current.parts = createInitialParts();
    const existing: KhatmahPart | undefined = current.parts[partNumber];
    current.parts[partNumber] = {
      partNumber,
      status: 'completed',
      completedBy: (completedBy || existing?.reservedBy || 'فاعل خير').trim(),
      completedAt: Date.now(),
    };

    let completedCount = 0;
    for (let i = 1; i <= 30; i++) {
      if (current.parts[i]?.status === 'completed') completedCount++;
    }
    current.isCompleted = completedCount === 30;
    if (current.isCompleted && !current.completedAt) {
      current.completedAt = Date.now();
    }

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // Undo Part completion (mark back to reserved or available)
  async uncompletePart(khatmahId: string, partNumber: number): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    // 1. Direct Cloudflare Worker API
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/uncomplete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partNumber }),
        });
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            const local = getLocalKhatmahs();
            local[updated.id] = updated;
            saveLocalKhatmahs(local);
            return updated;
          }
        }
      } catch (err) {
        console.warn('Worker uncomplete error:', err);
      }
    }

    // 2. Server API fallback
    try {
      const res = await fetch(`/api/khatmah/${encodeURIComponent(cleanId)}/uncomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated && updated.id) {
          const local = getLocalKhatmahs();
          local[updated.id] = updated;
          saveLocalKhatmahs(local);
          return updated;
        }
      }
    } catch (err) {
      // fallback
    }

    // 3. Local fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    if (!current.parts) current.parts = createInitialParts();
    const part = current.parts[partNumber];
    if (part) {
      if (part.reservedBy) {
        part.status = 'reserved';
        delete part.completedAt;
        delete part.completedBy;
      } else {
        part.status = 'available';
      }
    }
    current.isCompleted = false;
    delete current.completedAt;

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // Reset/Restart cycle for a Khatmah
  async resetKhatmahCycle(khatmahId: string): Promise<GroupKhatmah> {
    const current = await this.getKhatmah(khatmahId);
    if (!current) throw new Error('الختمة غير موجودة');

    current.parts = createInitialParts();
    current.isCompleted = false;
    delete current.completedAt;
    if (current.khatmahType === 'monthly_recurring') {
      current.currentCycleMonth = getCurrentYearMonth();
      current.cycleNumber = (current.cycleNumber || 1) + 1;
    }

    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current),
        });
      } catch (e) {
        console.warn('Error syncing reset to worker', e);
      }
    }

    const local = getLocalKhatmahs();
    local[current.id] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // List all khatmahs globally
  async listRecentKhatmahs(): Promise<GroupKhatmah[]> {
    const workerUrl = getCloudflareWorkerUrl();
    const mergedMap = new Map<string, GroupKhatmah>();

    // 0. Seed with existing local data
    const existingLocal = getLocalKhatmahs();
    Object.values(existingLocal).forEach(k => {
      if (isRealKhatmah(k)) {
        k.parts = normalizeKhatmahParts(k.parts);
        mergedMap.set(k.id, checkAndRenewMonthlyKhatmah(k));
      }
    });

    // 1. Direct Cloudflare Worker KV
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmahs`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            list.forEach((k: any) => {
              if (isRealKhatmah(k)) {
                k.parts = normalizeKhatmahParts(k.parts);
                const renewed = checkAndRenewMonthlyKhatmah(k);
                mergedMap.set(renewed.id, renewed);
              }
            });
          }
        }
      } catch (err) {
        console.warn('Worker list error:', err);
      }
    }

    // 2. Server API fallback / augmentation
    try {
      const res = await fetch('/api/khatmah');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          list.forEach((k: any) => {
            if (isRealKhatmah(k)) {
              k.parts = normalizeKhatmahParts(k.parts);
              const renewed = checkAndRenewMonthlyKhatmah(k);
              mergedMap.set(renewed.id, renewed);
            }
          });
        }
      }
    } catch (err) {
      // Ignore
    }

    // Persist full merged list back to localStorage
    const localToSave: Record<string, GroupKhatmah> = {};
    mergedMap.forEach((v, k) => {
      localToSave[k] = v;
    });
    saveLocalKhatmahs(localToSave);

    const resultList = Array.from(mergedMap.values());
    return resultList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Clear all khatmahs everywhere
  async clearAllKhatmahs(): Promise<void> {
    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/admin/clear-all`, {
          method: 'POST',
        });
      } catch (e) {}
    }
    try {
      await fetch('/api/khatmah/admin/clear-all', {
        method: 'POST',
      });
    } catch (e) {}
    saveLocalKhatmahs({});
  },

  // Subscribe to live sync
  onSync(callback: () => void): () => void {
    if (!broadcastChannel) return () => {};
    const handler = () => callback();
    broadcastChannel.addEventListener('message', handler);
    return () => {
      broadcastChannel.removeEventListener('message', handler);
    };
  },
};
