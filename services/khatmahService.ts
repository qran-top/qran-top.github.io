import { GroupKhatmah, KhatmahPart } from '../types';
import { safeLocalStorage } from '../utils/storage';

const KHATMAH_STORAGE_KEY = 'qran_group_khatmahs_v2';
const CLOUDFLARE_WORKER_URL_KEY = 'qran_cloudflare_khatmah_worker_url';
const DEFAULT_WORKER_URL = '';

// In-memory fallback and broadcast sync for instant cross-tab live updates
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

// Generate human-friendly ID like "KHT-7392"
export const generateKhatmahCode = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KHT-${num}`;
};

// Get stored local khatmahs
const getLocalKhatmahs = (): Record<string, GroupKhatmah> => {
  try {
    const raw = safeLocalStorage.getItem(KHATMAH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local khatmahs', e);
  }
  return {};
};

// Save local khatmahs
const saveLocalKhatmahs = (data: Record<string, GroupKhatmah>) => {
  try {
    safeLocalStorage.setItem(KHATMAH_STORAGE_KEY, JSON.stringify(data));
    broadcastChannel?.postMessage({ type: 'KHATMAH_UPDATED' });
  } catch (e) {
    console.error('Error saving local khatmahs', e);
  }
};

// Cloudflare Worker URL getter/setter
export const getCloudflareWorkerUrl = (): string => {
  return safeLocalStorage.getItem(CLOUDFLARE_WORKER_URL_KEY) || DEFAULT_WORKER_URL;
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
  storageMode: 'cloudflare_kv' | 'local_fallback';
  message: string;
}> {
  try {
    const res = await fetch('/api/cloudflare/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Could not reach /api/cloudflare/status', e);
  }
  return {
    hasToken: false,
    validToken: false,
    accountId: null,
    accountName: null,
    namespaceId: null,
    namespaceTitle: null,
    storageMode: 'local_fallback',
    message: 'وضع العمل المحلي النشط.',
  };
}

export const khatmahService = {
  // Fetch single Khatmah by ID
  async getKhatmah(id: string): Promise<GroupKhatmah | null> {
    const cleanId = id.trim().toUpperCase();

    // 1. Try server backend first
    try {
      const res = await fetch(`/api/khatmah/${encodeURIComponent(cleanId)}`);
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
      // Backend not reached, continue to worker/local
    }

    // 2. Try direct worker URL if configured
    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}`, {
          headers: { Accept: 'application/json' },
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
        console.warn('Worker fetch error:', err);
      }
    }

    // 3. Fallback to local storage
    const local = getLocalKhatmahs();
    return local[cleanId] || null;
  },

  // Create new Khatmah
  async createKhatmah(params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
  }): Promise<GroupKhatmah> {
    // 1. Try server backend
    try {
      const res = await fetch('/api/khatmah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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

    // 2. Try direct Worker
    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        const id = generateKhatmahCode();
        const newKhatmah: GroupKhatmah = {
          id,
          title: params.title.trim(),
          dedication: params.dedication?.trim() || undefined,
          targetDate: params.targetDate || undefined,
          createdBy: params.createdBy?.trim() || undefined,
          createdAt: Date.now(),
          isCompleted: false,
          parts: createInitialParts(),
        };

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

    // 3. Local fallback
    const id = generateKhatmahCode();
    const newKhatmah: GroupKhatmah = {
      id,
      title: params.title.trim(),
      dedication: params.dedication?.trim() || undefined,
      targetDate: params.targetDate || undefined,
      createdBy: params.createdBy?.trim() || undefined,
      createdAt: Date.now(),
      isCompleted: false,
      parts: createInitialParts(),
    };

    const local = getLocalKhatmahs();
    local[newKhatmah.id] = newKhatmah;
    saveLocalKhatmahs(local);
    return newKhatmah;
  },

  // Reserve a Juz (Part)
  async reservePart(khatmahId: string, partNumber: number, reservedBy: string): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();

    // 1. Try server backend
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
      // Fallback
    }

    // 2. Try worker
    const workerUrl = getCloudflareWorkerUrl();
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

    // 3. Local fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    const part = current.parts[partNumber] || { partNumber, status: 'available' };
    current.parts[partNumber] = {
      ...part,
      status: 'reserved',
      reservedBy: reservedBy.trim(),
      reservedAt: Date.now(),
    };

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // Unreserve a Juz (Cancel booking)
  async unreservePart(khatmahId: string, partNumber: number): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();

    // 1. Try server backend
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
      // Fallback
    }

    // 2. Try worker
    const workerUrl = getCloudflareWorkerUrl();
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

    // 3. Local fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    current.parts[partNumber] = {
      partNumber,
      status: 'available',
    };

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // Mark a Juz as completed
  async completePart(khatmahId: string, partNumber: number, completedBy?: string): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();

    // 1. Try server backend
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
      // Fallback
    }

    // 2. Try worker
    const workerUrl = getCloudflareWorkerUrl();
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

    // 3. Local fallback
    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    const part = current.parts[partNumber] || { partNumber, status: 'available' };
    const by = completedBy?.trim() || part.reservedBy || 'فاعل خير';
    current.parts[partNumber] = {
      ...part,
      status: 'completed',
      completedBy: by,
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

  // Undo completion
  async uncompletePart(khatmahId: string, partNumber: number): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();

    // 1. Try server backend
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
      // Fallback
    }

    const local = getLocalKhatmahs();
    const current = local[cleanId];
    if (!current) throw new Error('الختمة غير موجودة');

    const part = current.parts[partNumber];
    if (part) {
      if (part.reservedBy) {
        part.status = 'reserved';
        part.completedAt = undefined;
        part.completedBy = undefined;
      } else {
        part.status = 'available';
      }
    }

    local[cleanId] = current;
    saveLocalKhatmahs(local);
    return current;
  },

  // List all khatmahs
  async listRecentKhatmahs(): Promise<GroupKhatmah[]> {
    // 1. Try server backend first
    try {
      const res = await fetch('/api/khatmah');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const local = getLocalKhatmahs();
          list.forEach((k: GroupKhatmah) => {
            local[k.id] = k;
          });
          saveLocalKhatmahs(local);
          return list;
        }
      }
    } catch (err) {
      // Fallback
    }

    // 2. Try Worker
    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/khatmahs`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            const local = getLocalKhatmahs();
            list.forEach((k: GroupKhatmah) => {
              local[k.id] = k;
            });
            saveLocalKhatmahs(local);
            return list;
          }
        }
      } catch (err) {
        console.warn('Worker list error:', err);
      }
    }

    // 3. Fallback to local
    const local = getLocalKhatmahs();
    const list = Object.values(local);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
