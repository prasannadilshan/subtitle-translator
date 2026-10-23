/**
 * Cloudflare Worker for Subtitle Translation Proxy
 * 
 * This worker acts as a distributed edge proxy between your Subtitle Translator app
 * and Google Translate. By routing requests through Cloudflare's 300+ global edge locations,
 * outbound requests use rotating global IPs, completely bypassing single-server IP rate limits.
 * 
 * Free tier: 100,000 requests / day (~3,000 to 8,000 full movies daily) for $0.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight for browser compatibility
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed. Send a POST request." }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const body = await request.json();
      const { text, targetLang, sourceLang = "auto" } = body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return new Response(JSON.stringify({ error: "Missing or invalid 'text' parameter." }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Prepare Google Translate web endpoint payload
      const params = new URLSearchParams({
        client: "gtx",
        sl: sourceLang,
        tl: targetLang || "en",
        dt: "t",
        q: text,
      });

      // Forward request to Google Translate from Cloudflare's global edge network
      const googleRes = await fetch("https://translate.googleapis.com/translate_a/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: params.toString(),
      });

      if (!googleRes.ok) {
        return new Response(
          JSON.stringify({ error: `Google API responded with HTTP status ${googleRes.status}` }),
          {
            status: googleRes.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const data = await googleRes.json();
      let translatedText = text;

      if (Array.isArray(data) && Array.isArray(data[0])) {
        translatedText = data[0].map((item) => item[0] || "").join("");
      }

      return new Response(JSON.stringify({ translatedText }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || "An unexpected error occurred in translation proxy." }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
