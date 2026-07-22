import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const kvConfigured = !!((process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) || 
                       (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN));

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const ratelimit = kvConfigured 
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute for scraping
      analytics: true,
      prefix: '@upstash/ratelimit/watchlist_scrape',
    })
  : null;

const fallbackRateLimitMap = new Map();
function isRateLimitedFallback(ip) {
  const now = Date.now();
  const userRecord = fallbackRateLimitMap.get(ip);
  if (!userRecord) {
    fallbackRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (now > userRecord.resetAt) {
    fallbackRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  userRecord.count += 1;
  return userRecord.count > 5;
}

// Map makes/keywords to realistic Unsplash Car Images or dynamic fallbacks
function getFallbackCarImage(make, model) {
  const query = `${make} ${model} car exterior`;
  return `https://tse1.mm.bing.net/th?q=${encodeURIComponent(query)}&w=600&h=400&c=7&rs=1&p=0`;
}

// Mock Scraper to support reliable demo links
function getMockPageContent(url) {
  const u = url.toLowerCase();
  if (u.includes("subaru-wrx-sti-active")) {
    return {
      title: "2018 Subaru WRX STI Base",
      make: "Subaru",
      model: "WRX STI",
      year: 2018,
      price: "$28,900",
      mileage: "42,500 miles",
      location: "Seattle, WA",
      description: "One owner, completely stock, maintenance records included. Pristine condition STI ready for a new enthusiast home.",
      status: "available",
      reason: "Page loaded successfully, active listing buttons 'Contact Seller' and 'Schedule Test Drive' are visible."
    };
  }
  if (u.includes("jeep-wrangler-sold")) {
    return {
      title: "2015 Jeep Wrangler Unlimited Sport",
      make: "Jeep",
      model: "Wrangler",
      year: 2015,
      price: "$19,500",
      mileage: "78,000 miles",
      location: "Denver, CO",
      description: "Lifted 2.5 inches, custom wheels, 33-inch mud tires. Removable hard top included. Great weekend crawler.",
      status: "unavailable",
      reason: "The text 'Listing has ended' or 'This vehicle is sold' was detected on the listing page."
    };
  }
  if (u.includes("tesla-model-3-unavailable")) {
    return {
      title: "2019 Tesla Model 3 Long Range",
      make: "Tesla",
      model: "Model 3",
      year: 2019,
      price: "$24,000",
      mileage: "55,000 miles",
      location: "Oakland, CA",
      description: "Dual Motor AWD, Premium interior package. Autopilot active. Battery health is great, 290 miles full charge.",
      status: "unavailable",
      reason: "Listing page returned 404. Listing was removed by the seller."
    };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
      }
    } catch (err) {
      console.error(`[RedisFailure] Failed to connect to KV rate limiter:`, err);
    }
  } else {
    if (isRateLimitedFallback(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    }
  }

  const { url, checkOnly } = req.body || {};
  
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API Key configuration.' });
  }

  try {
    // 1. Mock content handling for demo links
    const mockContent = getMockPageContent(url);
    if (mockContent) {
      if (checkOnly) {
        return res.status(200).json({
          status: mockContent.status,
          reason: mockContent.reason
        });
      }
      return res.status(200).json({
        ...mockContent,
        image: getFallbackCarImage(mockContent.make, mockContent.model)
      });
    }

    // 2. Real URL handling
    let htmlText = "";
    let fetchError = "";
    let extractedImageUrl = "";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s fetch timeout
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        htmlText = await response.text();
        
        if (!checkOnly) {
          const ogImageMatch = htmlText.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               htmlText.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                               htmlText.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
          
          if (ogImageMatch && ogImageMatch[1]) {
            extractedImageUrl = ogImageMatch[1];
            
            // Fix for DreamCars returning their staging URL in og:image
            if (extractedImageUrl.includes("dev.dreamcars.directory")) {
              extractedImageUrl = extractedImageUrl.replace("dev.dreamcars.directory", "dreamcars.directory");
            }
            
            if (!extractedImageUrl.startsWith("http")) {
              try { extractedImageUrl = new URL(extractedImageUrl, url).href; } catch(e) {}
            }
          }
        }

        htmlText = htmlText
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
          .replace(/<svg[^>]*>([\s\S]*?)<\/svg>/gi, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 15000); // Send first 15k chars to DeepSeek
          
        if (/enable javascript|javascript requirement/i.test(htmlText)) {
          htmlText = "";
          fetchError = "JavaScript block detected.";
        }
      }
    } catch (err) {
      console.warn("Fetch failed, continuing to AI inference", err);
      fetchError = err.message || "Fetch failed";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let prompt = "";
    if (checkOnly) {
      prompt = `You are a vehicle listing availability auditor. Your job is to check if a listing is still active.
Listing URL: ${url}
Page Text: ${htmlText || "(Fetch was blocked by target host)"}

Analyze the URL and page text. Determine if the vehicle listing is still online and available, or if it has been SOLD, deleted, or ended. If the page fetch was blocked (Page Text is empty), evaluate if there are sold keywords in the URL or default to keeping it active if no explicit change can be proven.

Output a JSON response matching:
{
  "status": "available" or "unavailable",
  "reason": "String explaining how you determined the status"
}`;
    } else {
      prompt = `You are a vehicle details listing extraction assistant.
URL: ${url}
Scraped HTML Context: ${htmlText || "(Failed to scrape website: " + fetchError + ")"}

Please extract the details. If the scraped HTML is missing, invalid, or contains messages like "JavaScript requirement", IGNORE the page text entirely and analyze the URL itself to construct a realistic car listing. 
Set the status to "available" unless the URL explicitly implies it is sold.

You must output in JSON format matching this schema:
{
  "title": "String",
  "make": "String",
  "model": "String",
  "year": 2017,
  "price": "String (e.g. '$14,995' or 'Unknown')",
  "mileage": "String",
  "location": "String",
  "description": "String (Short realistic summary max 200 chars)",
  "status": "available" or "unavailable",
  "image": "String (Extract exact main vehicle image URL from HTML or leave empty '')",
  "reason": "String explaining determination"
}`;
    }

    const aiResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. You must always output valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      throw new Error(`DeepSeek error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (checkOnly) {
      return res.status(200).json({
        status: parsed.status === "unavailable" ? "unavailable" : "available",
        reason: parsed.reason || "Re-verification completed."
      });
    }

    let finalImage = extractedImageUrl;
    if (!finalImage && parsed.image) finalImage = parsed.image;
    if (!finalImage) finalImage = getFallbackCarImage(parsed.make || "", parsed.model || "");

    if (finalImage && !finalImage.startsWith("http")) {
      try { finalImage = new URL(finalImage, url).href; } catch(e) {}
    }

    return res.status(200).json({
      title: parsed.title || "Unknown Vehicle",
      make: parsed.make || "Unknown",
      model: parsed.model || "Vehicle",
      year: parsed.year || new Date().getFullYear(),
      price: parsed.price || "Unknown",
      mileage: parsed.mileage || "N/A",
      location: parsed.location || "N/A",
      description: parsed.description || "Specifications extracted from listing.",
      status: parsed.status === "unavailable" ? "unavailable" : "available",
      image: finalImage,
      reason: parsed.reason
    });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: 'Failed to process listing. Please try again.' });
  }
}
