/**
 * CXRNER MUSIC — Unified Test Release Detection Engine
 * Accurately detects test/scratch submissions (single letters, dummy text, test handles, etc.)
 */

export function isTestRelease(rel: any): boolean {
  if (!rel) return false;
  const p = rel.form_payload || {};

  const uid = String(rel.telegram_id || "").trim();
  const artist = String(rel.artist_name || p.nick || p.artist || "").trim().toLowerCase();
  const title = String(rel.track_name || p.name || p.title || "").trim().toLowerCase();
  const fio = String(p.fio || p.artist_full_name || "").trim().toLowerCase();
  const tg = String(rel.username || p.tg || p.contact_telegram || "").trim().toLowerCase();
  const promo = String(p.promo || p.promo_text || "").trim().toLowerCase();
  const comment = String(p.comment || p.moderator_comment || "").trim().toLowerCase();
  const link = String(p.link || p.files_link || "").trim().toLowerCase();
  const yandex = String(p.yandex || "").trim().toLowerCase();

  // 1. User's known test Telegram ID
  if (uid === "881379104") {
    return true;
  }

  // 2. Explicit test keywords
  const testKeywords = [
    "тест", "test", "проверк", "proverka", "asdf", "qwerty", "йцук",
    "123", "1234", "sample", "check", "демо", "demo", "тестик", "testov"
  ];
  for (const kw of testKeywords) {
    if (
      artist.includes(kw) ||
      title.includes(kw) ||
      fio.includes(kw) ||
      promo.includes(kw) ||
      comment.includes(kw) ||
      tg.includes(kw)
    ) {
      return true;
    }
  }

  // 3. Dummy placeholder names like "ник", "название", "трек", "песня", "артист"
  if (artist === "ник" || artist === "артист" || title === "название" || title === "трек") {
    return true;
  }

  // 4. Very short (1-2 characters) artist or track name (e.g. "Ш", "0", "ша", "ал", "u", "d", "ооо")
  if (artist.length > 0 && artist.length <= 2) return true;
  if (title.length > 0 && title.length <= 2) return true;

  // 5. Very short / single letter dummy Telegram contact (e.g. "@u", "u", "л", "г", "о", "ш", "j")
  const cleanTg = tg.replace(/^@/, "");
  if (cleanTg.length > 0 && cleanTg.length <= 2) return true;

  // 6. Repeated gibberish patterns (e.g. "jdjd", "djjdkd", "djjd", "лл", "ао")
  if (/^(.)\1+$/.test(artist) || /^(.)\1+$/.test(title) || /^(.)\1+$/.test(cleanTg)) {
    return true;
  }
  if (/^[a-z]{2,8}$/i.test(artist) && /^([a-z]{2})\1+$/i.test(artist)) {
    return true;
  }

  // 7. Short dummy FIO with dummy promo/comment (e.g. FIO: "щ", "лл", "u", "8" and promo: "f", "t")
  if (fio.length > 0 && fio.length <= 2 && fio !== "—") return true;

  // 8. Dummy promo/comment with 1-2 letters
  if (["f", "t", "q", "w", "z", "x", ".", "-"].includes(promo) && ["f", "t", "q", "w", "z", "x", ".", "-"].includes(comment)) {
    return true;
  }

  // 9. Dummy file link
  if (link === "test" || link === "тест" || link === "." || link.includes("example.com")) {
    return true;
  }

  return false;
}
