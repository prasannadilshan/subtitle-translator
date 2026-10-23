# Cloudflare Worker Translation Proxy Setup

This Cloudflare Worker acts as a distributed edge proxy between your Subtitle Translator and Google Translate. It routes translation requests through Cloudflare's 300+ global edge locations, rotating outbound IP addresses and protecting your server from IP rate limits (`HTTP 429`).

**Free Tier Allowance**: 100,000 requests per day (handles ~3,000 to 8,000 full movies daily for $0).

---

## 3-Minute Quick Setup

### Step 1: Create a Free Cloudflare Account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up for a free account if you don't already have one.

### Step 2: Create a Worker
1. In the left navigation menu, click **Workers & Pages**.
2. Click **Create Application** $\to$ **Create Worker**.
3. Name your worker (for example: `sub-translator-proxy`).
4. Click **Deploy**.

### Step 3: Paste the Code
1. On the worker details page, click **Edit code** (or **Quick Edit**).
2. Replace all existing code in the editor with the code from [`worker.js`](worker.js).
3. Click **Save and Deploy**.

### Step 4: Copy Your Worker URL
1. Copy the public URL of your worker (it will look like: `https://sub-translator-proxy.<your-subdomain>.workers.dev`).

### Step 5: Add to Your Project Environment Variables
1. In your local `.env.local` file:
   ```env
   CLOUDFLARE_WORKER_URL=https://sub-translator-proxy.<your-subdomain>.workers.dev
   ```
2. When deploying to **Vercel** or your **VPS**:
   - Go to **Project Settings** $\to$ **Environment Variables**.
   - Add `CLOUDFLARE_WORKER_URL` with your Worker URL.

---

## Testing Your Worker
You can test your deployed worker using `curl` or Postman:

```bash
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, this is a subtitle test.", "targetLang": "es"}'
```

Expected response:
```json
{"translatedText":"Hola mundo, esta es una prueba de subtítulos."}
```
