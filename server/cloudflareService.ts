/**
 * Cloudflare REST API integration service
 * Allows automatic detection of account ID, auto-creation of KV Namespace,
 * direct KV read/write storage, and worker verification without manual user intervention.
 */

interface CloudflareAccount {
  id: string;
  name: string;
}

interface KVNamespace {
  id: string;
  title: string;
}

interface CloudflareStatus {
  hasToken: boolean;
  validToken: boolean;
  accountId: string | null;
  accountName: string | null;
  namespaceId: string | null;
  namespaceTitle: string | null;
  storageMode: 'cloudflare_kv' | 'local_fallback';
  message: string;
}

let cachedAccountId: string | null = null;
let cachedNamespaceId: string | null = null;
let lastStatus: CloudflareStatus = {
  hasToken: false,
  validToken: false,
  accountId: null,
  accountName: null,
  namespaceId: null,
  namespaceTitle: null,
  storageMode: 'local_fallback',
  message: 'لم يتم تفعيل رمز Cloudflare API Token بعد.',
};

function getApiToken(): string | null {
  return (
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    null
  );
}

export async function checkAndInitCloudflare(forceRefresh = false): Promise<CloudflareStatus> {
  const token = getApiToken();
  if (!token) {
    lastStatus = {
      hasToken: false,
      validToken: false,
      accountId: null,
      accountName: null,
      namespaceId: null,
      namespaceTitle: null,
      storageMode: 'local_fallback',
      message: 'الخادم يعمل في وضع التخزين المحلي. قم بإضافة متغير CLOUDFLARE_API_TOKEN في قائمة Secrets لتفعيل التخزين السحابي التلقائي.',
    };
    return lastStatus;
  }

  if (!forceRefresh && cachedAccountId && cachedNamespaceId) {
    return lastStatus;
  }

  try {
    // 1. Verify token
    const verifyRes = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = (await verifyRes.json()) as any;
    if (!verifyData.success) {
      lastStatus = {
        hasToken: true,
        validToken: false,
        accountId: null,
        accountName: null,
        namespaceId: null,
        namespaceTitle: null,
        storageMode: 'local_fallback',
        message: `رمز التوكن غير صالح أو منتهي الصلاحية: ${verifyData.errors?.[0]?.message || 'تحقق من التوكن'}`,
      };
      return lastStatus;
    }

    // 2. Discover Account ID
    const accRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const accData = (await accRes.json()) as any;
    if (!accData.success || !accData.result || accData.result.length === 0) {
      lastStatus = {
        hasToken: true,
        validToken: true,
        accountId: null,
        accountName: null,
        namespaceId: null,
        namespaceTitle: null,
        storageMode: 'local_fallback',
        message: 'التوكن صالح ولكن لم يتم العثور على حسابات Cloudflare مرتبطة به.',
      };
      return lastStatus;
    }

    const account: CloudflareAccount = accData.result[0];
    cachedAccountId = account.id;

    // 3. Find or Create KV Namespace (QRAN_KHATMAH_KV)
    const kvListRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account.id}/storage/kv/namespaces`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const kvListData = (await kvListRes.json()) as any;
    let targetNamespace: KVNamespace | undefined;

    if (kvListData.success && Array.isArray(kvListData.result)) {
      targetNamespace = kvListData.result.find(
        (ns: KVNamespace) =>
          ns.title === 'QRAN_KHATMAH_KV' ||
          ns.title === 'KHATMAH_STORAGE' ||
          ns.title === 'qran-khatmah'
      );
    }

    // If not found, automatically create it!
    if (!targetNamespace) {
      const createKvRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${account.id}/storage/kv/namespaces`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'QRAN_KHATMAH_KV' }),
        }
      );

      const createKvData = (await createKvRes.json()) as any;
      if (createKvData.success && createKvData.result) {
        targetNamespace = createKvData.result;
        console.log('✅ Auto-created Cloudflare KV Namespace: QRAN_KHATMAH_KV', targetNamespace);
      }
    }

    if (targetNamespace) {
      cachedNamespaceId = targetNamespace.id;
      lastStatus = {
        hasToken: true,
        validToken: true,
        accountId: account.id,
        accountName: account.name,
        namespaceId: targetNamespace.id,
        namespaceTitle: targetNamespace.title,
        storageMode: 'cloudflare_kv',
        message: `تم ربط Cloudflare KV بنجاح بحساب ${account.name} (قاعدة: ${targetNamespace.title}). التخزين السحابي التلقائي يعمل 100%.`,
      };
    } else {
      lastStatus = {
        hasToken: true,
        validToken: true,
        accountId: account.id,
        accountName: account.name,
        namespaceId: null,
        namespaceTitle: null,
        storageMode: 'local_fallback',
        message: 'التوكن صالح ولكن لم تتوفر صلاحية إنشاء Workers KV Storage. يرجى التأكد من إضافة صلاحية KV Storage:Edit للتوكن.',
      };
    }

    return lastStatus;
  } catch (err: any) {
    console.error('Error initializing Cloudflare:', err);
    lastStatus = {
      hasToken: true,
      validToken: false,
      accountId: null,
      accountName: null,
      namespaceId: null,
      namespaceTitle: null,
      storageMode: 'local_fallback',
      message: `خطأ أثناء الاتصال بـ Cloudflare: ${err.message}`,
    };
    return lastStatus;
  }
}

// KV Read helper
export async function getKvValue(key: string): Promise<string | null> {
  const token = getApiToken();
  if (!token || !cachedAccountId || !cachedNamespaceId) return null;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cachedAccountId}/storage/kv/namespaces/${cachedNamespaceId}/values/${encodeURIComponent(
        key
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error('Error fetching KV key:', key, e);
    return null;
  }
}

// KV Write helper
export async function putKvValue(key: string, value: string): Promise<boolean> {
  const token = getApiToken();
  if (!token || !cachedAccountId || !cachedNamespaceId) return false;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cachedAccountId}/storage/kv/namespaces/${cachedNamespaceId}/values/${encodeURIComponent(
        key
      )}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: value,
      }
    );

    return res.ok;
  } catch (e) {
    console.error('Error writing KV key:', key, e);
    return false;
  }
}

// KV List keys helper
export async function listKvKeys(prefix = ''): Promise<string[]> {
  const token = getApiToken();
  if (!token || !cachedAccountId || !cachedNamespaceId) return [];

  try {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${cachedAccountId}/storage/kv/namespaces/${cachedNamespaceId}/keys`
    );
    if (prefix) url.searchParams.set('prefix', prefix);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as any;
    if (data.success && Array.isArray(data.result)) {
      return data.result.map((k: any) => k.name);
    }
    return [];
  } catch (e) {
    console.error('Error listing KV keys:', e);
    return [];
  }
}

// KV Delete helper
export async function deleteKvKey(key: string): Promise<boolean> {
  const token = getApiToken();
  if (!token || !cachedAccountId || !cachedNamespaceId) return false;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cachedAccountId}/storage/kv/namespaces/${cachedNamespaceId}/values/${encodeURIComponent(
        key
      )}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.ok;
  } catch (e) {
    console.error('Error deleting KV key:', key, e);
    return false;
  }
}

// Wipe all khatmahs from Cloudflare KV completely
export async function clearAllKvKhatmahs(): Promise<number> {
  await checkAndInitCloudflare();
  const keys = await listKvKeys();
  let deletedCount = 0;
  for (const key of keys) {
    if (
      key.startsWith('khatmah') ||
      key.startsWith('kht_') ||
      key === 'khatmahs_index'
    ) {
      await deleteKvKey(key);
      deletedCount++;
    }
  }
  console.log(`🧹 Wiped ${deletedCount} keys from Cloudflare KV.`);
  return deletedCount;
}

