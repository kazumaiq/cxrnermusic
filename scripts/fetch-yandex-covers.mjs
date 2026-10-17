const albums = [
  { id: 44422385, title: "The Sadness of Reality", artist: "Neimeks" },
  { id: 44088019, title: "GET BACK", artist: "UNXPLXYA" },
  { id: 44037417, title: "Stream Of Dreams", artist: "KXLLVURX" },
  { id: 43225634, title: "DEMURE", artist: "ViRxSdz" },
  { id: 43863222, title: "Celebrate", artist: "UNXPLXYA, ETERNXL SXNNER" },
  { id: 43724370, title: "TERANUM", artist: "Zarl1t ft, evxlshvdow" },
  { id: 43844944, title: "Paranoia is everywhere", artist: "Neimeks" },
  { id: 43586186, title: "HALLUCINATIONN", artist: "DrXer28" },
];

async function run() {
  const results = [];
  for (const item of albums) {
    try {
      const res = await fetch(`https://music.yandex.ru/album/${item.id}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      const html = await res.text();
      // Look for og:image or cover image
      const ogMatch = html.match(/meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      
      let cover = ogMatch ? ogMatch[1] : null;
      if (cover && cover.startsWith("//")) {
        cover = "https:" + cover;
      }
      if (cover) {
        // Upgrade size from 200x200 or %% to 600x600 or 1000x1000
        cover = cover.replace(/%%/, "600x600").replace(/200x200/, "600x600").replace(/400x400/, "600x600");
      }
      console.log(item.title, "=>", cover);
      results.push({ ...item, cover });
    } catch (err) {
      console.error("Error for", item.title, err.message);
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
