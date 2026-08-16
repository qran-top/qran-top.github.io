import { GroupKhatmah, KhatmahPart } from '../types';
import {
  checkAndInitCloudflare,
  getKvValue,
  putKvValue,
  clearAllKvKhatmahs,
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

function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function checkAndRenewMonthlyKhatmah(k: GroupKhatmah): GroupKhatmah {
  if (!k || k.khatmahType !== 'monthly_recurring') return k;

  const currentMonth = getCurrentYearMonth();
  if (k.currentCycleMonth && k.currentCycleMonth !== currentMonth) {
    k.currentCycleMonth = currentMonth;
    k.cycleNumber = (k.cycleNumber || 1) + 1;
    k.parts = initializeEmptyParts();
    k.isCompleted = false;
    delete k.completedAt;
  }
  return k;
}

function isRealKhatmah(k: GroupKhatmah | null | undefined): k is GroupKhatmah {
  if (!k || !k.id) return false;
  if (k.id === 'KHT-7777' || k.id === 'KHT-2026') return false;
  if (k.title && k.title.includes('الختمة القرآنية المباركة الأولى')) return false;
  return true;
}

export async function clearAllBackendKhatmahs(): Promise<void> {
  memoryKhatmahs.clear();
  try {
    await clearAllKvKhatmahs();
  } catch (err) {
    console.error('Error clearing KV:', err);
  }
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
          const items: any[] = JSON.parse(indexRaw);
          for (const item of items) {
            if (typeof item === 'object' && item && item.id && isRealKhatmah(item)) {
              memoryKhatmahs.set(item.id, checkAndRenewMonthlyKhatmah(item));
            } else if (typeof item === 'string') {
              const id = item.toUpperCase();
              if (id === 'KHT-7777' || id === 'KHT-2026') continue;
              const dataRaw = (await getKvValue(`khatmah:${id}`)) || (await getKvValue(`khatmah_${id}`));
              if (dataRaw) {
                const k: GroupKhatmah = JSON.parse(dataRaw);
                if (isRealKhatmah(k)) {
                  memoryKhatmahs.set(k.id, checkAndRenewMonthlyKhatmah(k));
                }
              }
            }
          }
          console.log(`✅ Loaded ${memoryKhatmahs.size} active khatmahs from Cloudflare KV.`);
        } catch (e) {
          console.error('Error parsing index from KV', e);
        }
      }
    }
  } catch (err) {
    console.error('Error initializing backend storage:', err);
  }
}

async function saveKhatmah(khatmah: GroupKhatmah): Promise<void> {
  if (!isRealKhatmah(khatmah)) return;
  memoryKhatmahs.set(khatmah.id, khatmah);

  // Background sync to Cloudflare KV
  try {
    const status = await checkAndInitCloudflare();
    if (status.storageMode === 'cloudflare_kv') {
      // Store under both formats for total interoperability with Worker
      const json = JSON.stringify(khatmah);
      await putKvValue(`khatmah:${khatmah.id}`, json);
      await putKvValue(`khatmah_${khatmah.id}`, json);

      const allList = Array.from(memoryKhatmahs.values()).filter(isRealKhatmah);
      await putKvValue('khatmahs_index', JSON.stringify(allList));
    }
  } catch (err) {
    console.error('Failed to sync to Cloudflare KV:', err);
  }
}

export async function getAllKhatmahs(): Promise<GroupKhatmah[]> {
  await initBackendStorage();
  const list = Array.from(memoryKhatmahs.values())
    .filter(isRealKhatmah)
    .map(checkAndRenewMonthlyKhatmah);
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getKhatmahById(id: string): Promise<GroupKhatmah | null> {
  await initBackendStorage();
  const normalizedId = id.toUpperCase();
  if (normalizedId === 'KHT-7777' || normalizedId === 'KHT-2026') return null;

  if (memoryKhatmahs.has(normalizedId)) {
    const k = memoryKhatmahs.get(normalizedId)!;
    return checkAndRenewMonthlyKhatmah(k);
  }

  // Try fetching directly from Cloudflare KV if not in memory
  try {
    const raw = (await getKvValue(`khatmah:${normalizedId}`)) || (await getKvValue(`khatmah_${normalizedId}`));
    if (raw) {
      const parsed: GroupKhatmah = JSON.parse(raw);
      if (isRealKhatmah(parsed)) {
        const renewed = checkAndRenewMonthlyKhatmah(parsed);
        memoryKhatmahs.set(renewed.id, renewed);
        return renewed;
      }
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
  khatmahType?: 'once' | 'monthly_recurring';
}): Promise<GroupKhatmah> {
  await initBackendStorage();

  let id = generateKhatmahId();
  while (memoryKhatmahs.has(id)) {
    id = generateKhatmahId();
  }

  const isMonthly = params.khatmahType === 'monthly_recurring';

  const newKhatmah: GroupKhatmah = {
    id,
    title: params.title.trim(),
    dedication: params.dedication || '',
    targetDate: params.targetDate || '',
    createdBy: params.createdBy || 'فاعل خير',
    createdAt: Date.now(),
    parts: initializeEmptyParts(),
    isCompleted: false,
    khatmahType: params.khatmahType || 'once',
    currentCycleMonth: isMonthly ? getCurrentYearMonth() : undefined,
    cycleNumber: isMonthly ? 1 : undefined,
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
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (partNumber < 1 || partNumber > 30) {
    throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
  }

  if (!khatmah.parts) {
    khatmah.parts = initializeEmptyParts();
  }

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'reserved';
  part.reservedBy = reservedBy.trim() || 'فاعل خير';
  part.reservedAt = Date.now();
  khatmah.parts[partNumber] = part;

  await saveKhatmah(khatmah);
  return khatmah;
}

export async function unreserveKhatmahPart(
  khatmahId: string,
  partNumber: number
): Promise<GroupKhatmah> {
  const khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (!khatmah.parts) {
    khatmah.parts = initializeEmptyParts();
  }

  const part = khatmah.parts[partNumber];
  if (part) {
    part.status = 'available';
    delete part.reservedBy;
    delete part.reservedAt;
  }

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
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (!khatmah.parts) {
    khatmah.parts = initializeEmptyParts();
  }

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'completed';
  part.completedBy = completedBy || part.reservedBy || 'فاعل خير';
  part.completedAt = Date.now();
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
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (!khatmah.parts) {
    khatmah.parts = initializeEmptyParts();
  }

  const part = khatmah.parts[partNumber];
  if (part) {
    if (part.reservedBy) {
      part.status = 'reserved';
      delete part.completedAt;
      delete part.completedBy;
    } else {
      part.status = 'available';
      delete part.completedAt;
      delete part.completedBy;
    }
  }

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

function recomputeKhatmahStatus(k: GroupKhatmah) {
  let completedCount = 0;
  for (let i = 1; i <= 30; i++) {
    if (k.parts[i]?.status === 'completed') {
      completedCount++;
    }
  }
  k.isCompleted = completedCount === 30;
  if (k.isCompleted && !k.completedAt) {
    k.completedAt = Date.now();
  } else if (!k.isCompleted) {
    delete k.completedAt;
  }
}
