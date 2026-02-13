/**
 * Fetch web search results from Google Custom Search JSON API.
 * Used for global search when user queries beyond doctors in DB.
 */

const API_URL = "https://www.googleapis.com/customsearch/v1";

export async function searchWeb(query, options = {}) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) {
    return { items: [], error: "Google search not configured (GOOGLE_API_KEY, GOOGLE_CSE_ID)" };
  }

  const q = String(query || "").trim();
  if (!q) return { items: [] };

  const num = Math.min(Number(options.num) || 10, 10);
  const start = Math.max(Number(options.start) || 1, 1);

  const params = new URLSearchParams({
    key,
    cx,
    q,
    num: String(num),
    start: String(start),
  });
  if (options.gl) params.set("gl", options.gl);
  if (options.hl) params.set("hl", options.hl);

  try {
    const res = await fetch(`${API_URL}?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      return { items: [], error: data.error?.message || "Google API error" };
    }
    const items = (data.items || []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || "",
      displayLink: item.displayLink || "",
    }));
    return {
      items,
      searchInformation: data.searchInformation || {},
    };
  } catch (err) {
    console.error("Google search error:", err.message);
    return { items: [], error: err.message };
  }
}
