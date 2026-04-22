export type NewsItem = {
  title: string;
  link: string;
  originallink: string;
  description: string;
  pubDate: string;
};

function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

export async function searchNews(query: string, display = 5): Promise<NewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Naver API key missing");

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`Naver API error: ${res.status}`);

  const data = await res.json();
  return (data.items as NewsItem[]).map((item) => ({
    ...item,
    title: stripHtml(item.title),
    description: stripHtml(item.description),
  }));
}
