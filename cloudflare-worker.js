/**
 * Cloudflare Worker for Group Khatmah (الختمة الجماعية) - QRAN.TOP
 * 
 * Instructions:
 * 1. Go to Cloudflare Dashboard -> Workers & Pages -> Create Application -> Create Worker
 * 2. Paste this code into the Worker editor and click "Deploy".
 * 3. (Optional for persistent storage across months): Go to Workers & Pages -> KV -> Create a KV namespace named "KHATMAH_KV", 
 *    then in your Worker settings -> Variables -> KV Namespace Bindings, bind Variable Name "KHATMAH_KV" to your KV namespace.
 * 4. Copy the Worker URL (e.g., https://khatmah-api.your-subdomain.workers.dev) and paste it into the app settings!
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Headers to allow direct requests from your web app
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

    // Helper: read from KV (or fallback memory)
    const getKhatmahData = async (id) => {
      if (env && env.KHATMAH_KV) {
        const str = await env.KHATMAH_KV.get(`khatmah:${id}`);
        return str ? JSON.parse(str) : null;
      }
      return null;
    };

    // Helper: save to KV
    const saveKhatmahData = async (khatmah) => {
      if (env && env.KHATMAH_KV) {
        await env.KHATMAH_KV.put(`khatmah:${khatmah.id}`, JSON.stringify(khatmah));
        
        // Also update recent index list
        let indexList = [];
        const indexStr = await env.KHATMAH_KV.get('khatmahs_index');
        if (indexStr) {
          try { indexList = JSON.parse(indexStr); } catch (e) {}
        }
        indexList = indexList.filter(k => k.id !== khatmah.id);
        indexList.unshift(khatmah);
        if (indexList.length > 50) indexList = indexList.slice(0, 50);
        await env.KHATMAH_KV.put('khatmahs_index', JSON.stringify(indexList));
      }
    };

    try {
      // 1. List all recent Khatmahs
      if (method === 'GET' && path === '/api/khatmahs') {
        if (env && env.KHATMAH_KV) {
          const indexStr = await env.KHATMAH_KV.get('khatmahs_index');
          const list = indexStr ? JSON.parse(indexStr) : [];
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
      if (method === 'POST' && path === '/api/khatmah') {
        const body = await request.json();
        if (!body.id || !body.title) {
          return jsonResponse({ error: 'بيانات غير مكتملة' }, 400);
        }
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

        // Check if all 30 are completed
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

      return jsonResponse({ message: 'QRAN.TOP Khatmah API is live and running.' });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  },
};
