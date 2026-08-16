/**
 * Cloudflare Worker for Group Khatmah (الختمة الجماعية) - QRAN.TOP
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Support both binding names
    const kv = env.QRAN_KHATMAH_KV || env.KHATMAH_KV;

    // CORS Headers to allow direct requests from any device/browser
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    };

    // Helper: read from KV
    const getKhatmahData = async (id) => {
      if (kv) {
        const str = await kv.get(`khatmah:${id}`);
        return str ? JSON.parse(str) : null;
      }
      return null;
    };

    // Helper: save to KV
    const saveKhatmahData = async (khatmah) => {
      if (kv) {
        await kv.put(`khatmah:${khatmah.id}`, JSON.stringify(khatmah));
        
        // Also update recent index list
        let indexList = [];
        const indexStr = await kv.get('khatmahs_index');
        if (indexStr) {
          try { indexList = JSON.parse(indexStr); } catch (e) {}
        }
        indexList = indexList.filter(k => k.id !== khatmah.id);
        indexList.unshift(khatmah);
        if (indexList.length > 100) indexList = indexList.slice(0, 100);
        await kv.put('khatmahs_index', JSON.stringify(indexList));
      }
    };

    try {
      // 1. List all recent Khatmahs
      if (method === 'GET' && (path === '/api/khatmahs' || path === '/api/khatmah')) {
        if (kv) {
          const indexStr = await kv.get('khatmahs_index');
          let list = indexStr ? JSON.parse(indexStr) : [];
          // Ensure default first khatmah exists if empty
          if (list.length === 0) {
            const defaultParts = {};
            for (let i = 1; i <= 30; i++) {
              defaultParts[i] = { partNumber: i, status: 'available' };
            }
            const defaultK = {
              id: 'KHT-2026',
              title: 'الختمة القرآنية المباركة العامة',
              dedication: 'ختمة قرآنية جماعية للمغفرة والرحمة والبركة',
              createdBy: 'إدارة الموقع',
              createdAt: Date.now(),
              isCompleted: false,
              parts: defaultParts,
            };
            await saveKhatmahData(defaultK);
            list = [defaultK];
          }
          return jsonResponse(list);
        }
        return jsonResponse([]);
      }

      // 2. Get single Khatmah
      if (method === 'GET' && path.startsWith('/api/khatmah/')) {
        const id = decodeURIComponent(path.replace('/api/khatmah/', '')).toUpperCase();
        const data = await getKhatmahData(id);
        if (!data) {
          return jsonResponse({ error: 'الختمة غير موجودة' }, 404);
        }
        return jsonResponse(data);
      }

      // 3. Create new Khatmah
      if (method === 'POST' && (path === '/api/khatmah' || path === '/api/khatmahs')) {
        const body = await request.json();
        if (!body.title) {
          return jsonResponse({ error: 'بيانات غير مكتملة' }, 400);
        }
        if (!body.id) {
          const num = Math.floor(1000 + Math.random() * 9000);
          body.id = `KHT-${num}`;
        }
        body.id = body.id.toUpperCase();
        if (!body.createdAt) body.createdAt = Date.now();
        if (!body.parts) {
          body.parts = {};
          for (let i = 1; i <= 30; i++) {
            body.parts[i] = { partNumber: i, status: 'available' };
          }
        }
        body.isCompleted = false;

        await saveKhatmahData(body);
        return jsonResponse(body, 201);
      }

      // 4. Reserve a Juz
      if (method === 'POST' && path.match(/^\/api\/khatmah\/[^\/]+\/reserve$/)) {
        const parts = path.split('/');
        const id = decodeURIComponent(parts[3]).toUpperCase();
        const { partNumber, reservedBy } = await request.json();
        const data = await getKhatmahData(id);
        if (!data) return jsonResponse({ error: 'الختمة غير موجودة' }, 404);

        if (!data.parts) data.parts = {};
        data.parts[partNumber] = {
          partNumber: Number(partNumber),
          status: 'reserved',
          reservedBy: (reservedBy || 'مشارك').trim(),
          reservedAt: Date.now(),
        };

        // Check completion
        let allCompleted = true;
        for (let i = 1; i <= 30; i++) {
          if (data.parts[i]?.status !== 'completed') { allCompleted = false; break; }
        }
        data.isCompleted = allCompleted;

        await saveKhatmahData(data);
        return jsonResponse(data);
      }

      // 5. Unreserve a Juz (cancel)
      if (method === 'POST' && path.match(/^\/api\/khatmah\/[^\/]+\/unreserve$/)) {
        const parts = path.split('/');
        const id = decodeURIComponent(parts[3]).toUpperCase();
        const { partNumber } = await request.json();
        const data = await getKhatmahData(id);
        if (!data) return jsonResponse({ error: 'الختمة غير موجودة' }, 404);

        if (!data.parts) data.parts = {};
        data.parts[partNumber] = {
          partNumber: Number(partNumber),
          status: 'available',
        };
        data.isCompleted = false;

        await saveKhatmahData(data);
        return jsonResponse(data);
      }

      // 6. Mark a Juz as completed
      if (method === 'POST' && path.match(/^\/api\/khatmah\/[^\/]+\/complete$/)) {
        const parts = path.split('/');
        const id = decodeURIComponent(parts[3]).toUpperCase();
        const { partNumber, completedBy } = await request.json();
        const data = await getKhatmahData(id);
        if (!data) return jsonResponse({ error: 'الختمة غير موجودة' }, 404);

        if (!data.parts) data.parts = {};
        const prev = data.parts[partNumber] || {};
        data.parts[partNumber] = {
          partNumber: Number(partNumber),
          status: 'completed',
          completedBy: (completedBy || prev.reservedBy || 'فاعل خير').trim(),
          completedAt: Date.now(),
        };

        // Check if all 30 are completed
        let allCompleted = true;
        for (let i = 1; i <= 30; i++) {
          if (data.parts[i]?.status !== 'completed') { allCompleted = false; break; }
        }
        data.isCompleted = allCompleted;
        if (allCompleted && !data.completedAt) {
          data.completedAt = Date.now();
        }

        await saveKhatmahData(data);
        return jsonResponse(data);
      }

      // 7. Undo completion
      if (method === 'POST' && path.match(/^\/api\/khatmah\/[^\/]+\/uncomplete$/)) {
        const parts = path.split('/');
        const id = decodeURIComponent(parts[3]).toUpperCase();
        const { partNumber } = await request.json();
        const data = await getKhatmahData(id);
        if (!data) return jsonResponse({ error: 'الختمة غير موجودة' }, 404);

        if (!data.parts) data.parts = {};
        const part = data.parts[partNumber];
        if (part) {
          if (part.reservedBy) {
            part.status = 'reserved';
            delete part.completedAt;
            delete part.completedBy;
          } else {
            part.status = 'available';
          }
        }
        data.isCompleted = false;
        delete data.completedAt;

        await saveKhatmahData(data);
        return jsonResponse(data);
      }

      return jsonResponse({ message: 'QRAN.TOP Cloudflare Khatmah API is active and ready ⚡' });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  },
};
