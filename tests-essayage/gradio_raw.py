"""Appel brut d'une démo Gradio (mêmes requêtes que l'interface web) pour les endpoints non exposés à l'API."""
import httpx, json, uuid, os

def call(root, fn_index, inputs, file_idx, trigger_id=None, timeout=600):
    sh = uuid.uuid4().hex[:11]
    with httpx.Client(timeout=300, follow_redirects=True) as c:
        data = list(inputs)
        for i in file_idx:
            f = data[i]
            r = c.post(root + "/upload", files={"files": (os.path.basename(f), open(f, "rb"), "image/jpeg")})
            r.raise_for_status(); p = r.json()[0]
            data[i] = {"path": p, "meta": {"_type": "gradio.FileData"}, "orig_name": os.path.basename(f)}
        body = {"data": data, "fn_index": fn_index, "session_hash": sh, "event_data": None, "trigger_id": trigger_id}
        r = c.post(root + "/queue/join", json=body); r.raise_for_status()
        with c.stream("GET", root + "/queue/data", params={"session_hash": sh}, timeout=timeout) as s:
            for line in s.iter_lines():
                if not line.startswith("data:"): continue
                m = json.loads(line[5:])
                if m.get("msg") == "process_completed":
                    if not m.get("success"): raise RuntimeError(f"échec: {m.get('output')}")
                    return m["output"]["data"], c
                if m.get("msg") == "queue_full": raise RuntimeError("file pleine")
    raise RuntimeError("flux terminé sans résultat")

def fetch(root, img):
    url = img.get("url") or (root + "/file=" + img["path"])
    return httpx.get(url, timeout=120, follow_redirects=True).content
