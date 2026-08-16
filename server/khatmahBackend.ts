import { GroupKhatmah, KhatmahPart } from '../types';
import {
  checkAndInitCloudflare,
  getKvValue,
  putKvValue,
  listKvKeys,
} from './cloudflareService';

// In-memory cache for ultra-fast response
const memoryKhatmahs = new Map<string, GroupKhatmah>();
let isInitialized = false;

function generateKhatmahId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KHT-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function initializeEmptyParts(): Record<number, KhatmahPart> {
  const parts: Record<number, KhatmahPart> = {};
  for (let i = 1; i <= 30; i++) {
    parts[i] = {
      partNumber: i,
      status: 'available',
    };
  }
  return parts;
}

export async function initBackendStorage() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const status = await checkAndInitCloudflare();
    console.log('📦 Khatmah Backend initialized. Status:', status.message);

    if (status.storageMode === 'cloudflare_kv') {
      // Load initial index from KV
      const indexRaw = await getKvValue('khatmahs_index');
      if (indexRaw) {
        try {
          const ids: string[] = JSON.parse(indexRaw);
          for (const id of ids) {
            const dataRaw = await getKvValue(`khatmah_${id}`);
            if (dataRaw) {
              const k: GroupKhatmah = JSON.parse(dataRaw);
              memoryKhatmahs.set(k.id, k);
            }
          }
          console.log(`✅ Loaded ${memoryKhatmahs.size} khatmahs from Cloudflare KV.`);
        } catch (e) {
          console.error('Error parsing index from KV', e);
        }
      }
    }

    // If still empty, create default first Khatmah
    if (memoryKhatmahs.size === 0) {
      const defaultK: GroupKhatmah = {
        id: 'KHT-2026',
        title: 'الختمة القرآنية المباركة الأولى',
        dedication: 'ختمة قرآنية جماعية للمغفرة والرحمة والبركة',
        createdBy: 'إدارة الموقع',
        createdAt: new Date().toISOString(),
        parts: initializeEmptyParts(),
        isCompleted: false,
        totalCompletedParts: 0,
      };
      await saveKhatmah(defaultK);
    }
  } catch (err) {
    console.error('Error initializing backend storage:', err);
  }
}

async function saveKhatmah(khatmah: GroupKhatmah): Promise<void> {
  memoryKhatmahs.set(khatmah.id, khatmah);

  // Background sync to Cloudflare KV
  try {
    const status = await checkAndInitCloudflare();
    if (status.storageMode === 'cloudflare_kv') {
      await putKvValue(`khatmah_${khatmah.id}`, JSON.stringify(khatmah));

      const allIds = Array.from(memoryKhatmahs.keys());
      await putKvValue('khatmahs_index', JSON.stringify(allIds));
    }
  } catch (err) {
    console.error('Failed to sync to Cloudflare KV:', err);
  }
}

export async function getAllKhatmahs(): Promise<GroupKhatmah[]> {
  await initBackendStorage();
  return Array.from(memoryKhatmahs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getKhatmahById(id: string): Promise<GroupKhatmah | null> {
  await initBackendStorage();
  const normalizedId = id.toUpperCase();

  if (memoryKhatmahs.has(normalizedId)) {
    return memoryKhatmahs.get(normalizedId)!;
  }

  // Try fetching directly from Cloudflare KV if not in memory
  try {
    const raw = await getKvValue(`khatmah_${normalizedId}`);
    if (raw) {
      const parsed: GroupKhatmah = JSON.parse(raw);
      memoryKhatmahs.set(parsed.id, parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Error checking KV for khatmah:', id, e);
  }

  return null;
}

export async function createNewKhatmah(params: {
  title: string;
  dedication?: string;
  targetDate?: string;
  createdBy?: string;
}): Promise<GroupKhatmah> {
  await initBackendStorage();

  let id = generateKhatmahId();
  while (memoryKhatmahs.has(id)) {
    id = generateKhatmahId();
  }

  const newKhatmah: GroupKhatmah = {
    id,
    title: params.title || 'ختمة مباركة',
    dedication: params.dedication || '',
    targetDate: params.targetDate || '',
    createdBy: params.createdBy || 'فاعل خير',
    createdAt: new Date().toISOString(),
    parts: initializeEmptyParts(),
    isCompleted: false,
    totalCompletedParts: 0,
  };

  await saveKhatmah(newKhatmah);
  return newKhatmah;
}

export async function reserveKhatmahPart(
  khatmahId: string,
  partNumber: number,
  reservedBy: string
): Promise<GroupKhatmah> {
  const khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) throw new Error('الختمة غير موجودة');

  if (!khatmah.parts) khatmah.parts = initializeEmptyParts();

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'reserved';
  part.reservedBy = reservedBy.trim() || 'فاعل خير';
  part.reservedAt = new Date().toISOString();
  khatmah.parts[partNumber] = part;

  await saveKhatmah(khatmah);
  return khatmah;
}

export async function unreserveKhatmahPart(
  khatmahId: string,
  partNumber: number
): Promise<GroupKhatmah> {
  const khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) throw new Error('الختمة غير موجودة');

  if (!khatmah.parts) khatmah.parts = initializeEmptyParts();

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'available';
  delete part.reservedBy;
  delete part.reservedAt;
  delete part.completedBy;
  delete part.completedAt;
  khatmah.parts[partNumber] = part;

  // Recompute isCompleted
  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

export async function completeKhatmahPart(
  khatmahId: string,
  partNumber: number,
  completedBy?: string
): Promise<GroupKhatmah> {
  const khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) throw new Error('الختمة غير موجودة');

  if (!khatmah.parts) khatmah.parts = initializeEmptyParts();

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'completed';
  part.completedBy = completedBy || part.reservedBy || 'فاعل خير';
  part.completedAt = new Date().toISOString();
  khatmah.parts[partNumber] = part;

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

export async function uncompleteKhatmahPart(
  khatmahId: string,
  partNumber: number
): Promise<GroupKhatmah> {
  const khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) throw new Error('الختمة غير موجودة');

  if (!khatmah.parts) khatmah.parts = initializeEmptyParts();

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'reserved';
  delete part.completedAt;
  khatmah.parts[partNumber] = part;

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

function recomputeKhatmahStatus(k: GroupKhatmah) {
  let completedCount = 0;
  for (let i = 1; i <= 30; i++) {
    if (k.parts?.[i]?.status === 'completed') {
      completedCount++;
    }
  }
  k.totalCompletedParts = completedCount;
  k.isCompleted = completedCount === 30;
  if (k.isCompleted && !k.completedAt) {
    k.completedAt = new Date().toISOString();
  } else if (!k.isCompleted) {
    delete k.completedAt;
  }
}
