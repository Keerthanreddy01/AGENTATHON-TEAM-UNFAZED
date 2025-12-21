import json
import time
from urllib.request import Request, urlopen

BASE = "http://localhost:8000"


def check_health() -> None:
    req = Request(f"{BASE}/health")
    with urlopen(req, timeout=3) as resp:
        body = resp.read().decode("utf-8")
        data = json.loads(body)
        assert data.get("status") == "ok", f"Unexpected health: {data}"
        print("[OK] /health:", data)


def check_meetings() -> None:
    req = Request(f"{BASE}/meetings")
    with urlopen(req, timeout=3) as resp:
        body = resp.read().decode("utf-8")
        data = json.loads(body)
        assert "meetings" in data, "Missing 'meetings' in response"
        print(f"[OK] /meetings: {len(data['meetings'])} item(s)")


def check_sse_inference(duration_sec: float = 6.0) -> None:
    req = Request(f"{BASE}/stream/inference")
    # Hint the server and proxies we want SSE
    req.add_header("Accept", "text/event-stream")
    start = time.time()
    event_buf = []
    got_event = False
    with urlopen(req, timeout=duration_sec + 2) as resp:
        while time.time() - start < duration_sec:
            line = resp.readline().decode("utf-8", errors="ignore")
            if not line:
                break
            line = line.strip()
            if not line:
                # event boundary
                if event_buf:
                    payload = _parse_sse_event(event_buf)
                    if payload is not None:
                        print("[OK] SSE inference:", payload)
                        got_event = True
                        break
                    event_buf = []
                continue
            event_buf.append(line)
    assert got_event, "No SSE inference event received in time"


def _parse_sse_event(lines: list[str]):
    # Expect lines like: "event: inference" and "data: {json}"
    event_type = None
    data_json = None
    for l in lines:
        if l.startswith("event:"):
            event_type = l.split(":", 1)[1].strip()
        elif l.startswith("data:"):
            data_json = l.split(":", 1)[1].strip()
    if event_type == "inference" and data_json:
        try:
            return json.loads(data_json)
        except Exception:
            return {"raw": data_json}
    return None


if __name__ == "__main__":
    check_health()
    check_meetings()
    check_sse_inference()
    print("Smoke test passed.")
