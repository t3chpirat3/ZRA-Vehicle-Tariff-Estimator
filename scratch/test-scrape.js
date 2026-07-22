const url = 'https://dreamcars.directory/car/toyota-hilux-2024-89851';

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
})
  .then(res => res.text())
  .then(htmlText => {
    let extractedImageUrl = "";
    const ogImageMatch = htmlText.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         htmlText.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                         htmlText.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
                         
    if (ogImageMatch && ogImageMatch[1]) {
      extractedImageUrl = ogImageMatch[1];
      if (!extractedImageUrl.startsWith("http")) {
        try { extractedImageUrl = new URL(extractedImageUrl, url).href; } catch(e) {}
      }
    }
    
    console.log("og:image extracted:", extractedImageUrl);
    
    const imgs = htmlText.match(/<img[^>]+src=["']([^"']+)["']/gi);
    console.log("first 3 imgs:", imgs ? imgs.slice(0, 3) : "none");
  })
  .catch(console.error);
