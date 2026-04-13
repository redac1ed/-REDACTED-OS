import ytdlp from 'yt-dlp-exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  const { v: videoId, q: query, f } = req.query;
  if (typeof query === 'string' && query.trim()) {
    try {
      const url = new URL('https://api.ytify.workers.dev/search');
      url.searchParams.set('q', query);
      if (typeof f === 'string' && f.trim()) {
        url.searchParams.set('f', f);
      }
      const upstream = await fetch(url.toString());
      const payload = await upstream.json();
      return res.status(upstream.status).json(payload);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Search proxy failed' });
    }
  }
  if (!videoId) {
    return res.status(400).json({ error: 'Missing parameters. Use ?q=QUERY for search or ?v=VIDEO_ID for audio.' });
  }
  try {
    const data = await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
      format: 'bestaudio',
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    const url = data?.url;
    const title = data?.title;
    if (url) {
      return res.status(200).json({
        video_id: videoId,
        title,
        url
      });
    } else {
      return res.status(404).json({ error: 'No audio URL found' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}