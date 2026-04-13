from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlencode, urlparse, quote
from urllib.request import Request, urlopen
import json

class handler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self._set_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()
    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        browser_url = (query.get("url", [""])[0] or "").strip()
        search_query = (query.get("q", [""])[0] or "").strip()
        search_filter = (query.get("f", [""])[0] or "").strip()
        video_id = (query.get("v", [""])[0] or "").strip()

        if browser_url:
            try:
                target = (
                    "https://webtoppings.bar/create/"
                    f"?url={quote(browser_url, safe='')}&region=us-west&mode=darkmode"
                )
                req = Request(
                    target,
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0",
                    },
                )
                with urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    self._send_json(resp.status, data)
                return
            except Exception as error:
                self._send_json(500, {"error": "Proxy request failed", "details": str(error)})
                return
            
        if search_query:
            try:
                params = {"q": search_query}
                if search_filter:
                    params["f"] = search_filter
                upstream_url = f"https://api.ytify.workers.dev/search?{urlencode(params)}"
                req = Request(upstream_url, headers={"User-Agent": "Mozilla/5.0"})
                with urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    self._send_json(resp.status, data)
                return
            except Exception as error:
                self._send_json(500, {"error": str(error) or "Search proxy failed"})
                return
            
        if video_id:
            try:
                req = Request(f"https://yt.omada.cafe/api/v1/videos/{video_id}", headers={"User-Agent": "Mozilla/5.0"})
                with urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                title = data.get("title")
                formats = data.get("adaptiveFormats") or data.get("formats") or []
                audio_urls = []
                for fmt in formats:
                    url = fmt.get("url")
                    mime_type = (fmt.get("mimeType") or fmt.get("mime_type") or "").lower()
                    if not url:
                        continue
                    if ("audio" in mime_type) or ("googlevideo.com" in url):
                        if url not in audio_urls:
                            audio_urls.append(url)
                if audio_urls:
                    self._send_json(200, {
                        "video_id": video_id,
                        "title": title,
                        "url": audio_urls[0],
                        "urls": audio_urls,
                    })
                else:
                    self._send_json(404, {"error": "No audio URL found"})
                return
            except Exception as error:
                self._send_json(500, {"error": str(error)})
                return

        self._send_json(
            400,
            {
                "error": "Missing parameters. Use ?url=URL for browser proxy, ?q=QUERY for search, or ?v=VIDEO_ID for audio."
            },
        )
