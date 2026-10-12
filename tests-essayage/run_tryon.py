"""Lance un essayage sur une démo HF Space.
Usage : python run_tryon.py <demo> <P..> <G..>   (demo = kolors | leffa | fitdit | ootd | idm)
"""
import sys, os, time, shutil, csv, glob, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gradio_client import Client, handle_file

CAT = {"G1": "haut", "G2": "bas", "G3": "robe", "G3h": "haut"}
def find(prefix):
    return sorted(glob.glob(f"images/prep/{prefix}_*.jpg"))[0]

def _save(data):
    import tempfile
    t = tempfile.NamedTemporaryFile(suffix=".img", delete=False); t.write(data); t.close(); return t.name

def run_kolors(p, g, cat):
    import gradio_raw as gr
    R = "https://kwai-kolors-kolors-virtual-try-on.hf.space"
    out, _ = gr.call(R, 2, [p, g, 0, False], [0, 1])
    if out[0] is None: raise RuntimeError(f"pas d'image : {out[2]!r}")
    return _save(gr.fetch(R, out[0])), f"resp={out[2]!r}"

def run_texel(p, g, cat):
    import gradio_raw as gr
    R = "https://texelmoda-virtual-try-on-diffusion-vton-d.hf.space/gradio_api"
    out, _ = gr.call(R, 6, [g, "", p, "", None, None, "", 42], [0, 2], trigger_id=41)
    if out[0] is None: raise RuntimeError(f"pas d'image : {out[1]!r}")
    return _save(gr.fetch(R, out[0])), ""

def run_leffa(p, g, cat):
    c = Client("franciszzj/Leffa", verbose=False)
    gt = {"haut": "upper_body", "bas": "lower_body", "robe": "dresses"}[cat]
    mt = "viton_hd" if cat == "haut" else "dress_code"
    r = c.predict(handle_file(p), handle_file(g), False, 30, 2.5, 42, mt, gt, False, api_name="/leffa_predict_vt")
    out = r[0]["path"] if isinstance(r[0], dict) else r[0]
    return out, ""

def run_fitdit(p, g, cat):
    c = Client("BoyuanJiang/FitDiT", verbose=False)
    ct = {"haut": "Upper-body", "bas": "Lower-body", "robe": "Dresses"}[cat]
    mask, pose = c.predict(handle_file(p), ct, 0, 0, 0, 0, api_name="/generate_mask")
    def hf(x): return handle_file(x) if x else None
    pre = {"background": hf(mask.get("background")), "layers": [hf(l) for l in mask.get("layers") or []],
           "composite": hf(mask.get("composite")), "id": mask.get("id")}
    pose_p = pose["path"] if isinstance(pose, dict) else pose
    r = c.predict(handle_file(p), handle_file(g), pre, handle_file(pose_p), 20, 2, 42, 1, "768x1024", api_name="/process")
    im = r[0]["image"]; out = im["path"] if isinstance(im, dict) else im
    return out, ""

def run_ootd(p, g, cat):
    c = Client("levihsu/OOTDiffusion", verbose=False)
    if cat == "haut":
        r = c.predict(handle_file(p), handle_file(g), 1, 20, 2.0, 42, api_name="/process_hd")
    else:
        r = c.predict(handle_file(p), handle_file(g), {"bas": "Lower-body", "robe": "Dress"}[cat], 1, 20, 2.0, 42, api_name="/process_dc")
    im = r[0]["image"]; return (im["path"] if isinstance(im, dict) else im), ""

def run_idm(p, g, cat):
    if cat != "haut": raise RuntimeError("IDM-VTON (Space) ne gère que les hauts")
    c = Client("yisol/IDM-VTON", verbose=False)
    r = c.predict({"background": handle_file(p), "layers": [], "composite": None}, handle_file(g),
                  "t-shirt", True, False, 30, 42, api_name="/tryon")
    return r[0], ""

def run_miragic(p, g, cat):
    c = Client("Miragic-AI/Miragic-Virtual-Try-On", verbose=False)
    gt = {"haut": "Top", "bas": "Bottom", "robe": "Dress/Suit"}[cat]
    r = c.predict(handle_file(p), handle_file(g), gt, api_name="/virtual_tryon")
    out = r["path"] if isinstance(r, dict) else r
    return out, ""

RUN = {"miragic": run_miragic, "texel": run_texel, "kolors": run_kolors, "leffa": run_leffa, "fitdit": run_fitdit, "ootd": run_ootd, "idm": run_idm}

if __name__ == "__main__":
    demo, P, G = sys.argv[1:4]
    os.makedirs("resultats/brut", exist_ok=True)
    dst = f"resultats/brut/{demo}_{P}_{G}.png"
    if os.path.exists(dst): print("déjà fait", dst); sys.exit(0)
    t0 = time.time(); status, note = "ok", ""
    try:
        out, note = RUN[demo](find(P), find(G), CAT[G])
        from PIL import Image
        Image.open(out).convert("RGB").save(dst)
    except Exception as e:
        status, note = "erreur", repr(e)[:300]
    dt = round(time.time() - t0, 1)
    new = not os.path.exists("resultats/log.csv")
    with open("resultats/log.csv", "a", newline="") as f:
        w = csv.writer(f)
        if new: w.writerow(["demo", "personne", "vetement", "statut", "secondes", "note", "horodatage"])
        w.writerow([demo, P, G, status, dt, note, time.strftime("%Y-%m-%d %H:%M:%S")])
    print(demo, P, G, status, dt, note)
