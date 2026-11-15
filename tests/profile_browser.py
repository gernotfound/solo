#!/usr/bin/env python3
"""Measure actual browser RAF cadence and game-loop callback CPU time in isolated SoLo scenes.

Chromium in GitHub Actions is not Safari or a physical smartphone. Teleportation
is injected only in this in-memory profiler build; production files are unchanged.
"""
import base64
import json
import math
import re
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SAVE_KEY = "solo-save-v1"
OUTPUT = ROOT / "artifacts" / "performance" / "chromium.json"
PROFILE_SCRIPT = r"""
<script>
(() => {
  const storage = new Map();
  Object.defineProperty(window, 'localStorage', {value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  }});
  const nativeRAF = window.requestAnimationFrame.bind(window);
  let active = false, previous = null, intervals = [], costs = [];
  const sample = {
    start() { intervals = []; costs = []; previous = null; active = true },
    stop() { active = false; return {intervals, costs} },
  };
  Object.defineProperty(window, '__soloFrameProfile', {value: sample});
  window.requestAnimationFrame = callback => nativeRAF(timestamp => {
    const measuring = active, start = performance.now();
    try { callback(timestamp) } finally {
      if (measuring) {
        costs.push(performance.now() - start);
        if (previous !== null) intervals.push(timestamp - previous);
        previous = timestamp;
      }
    }
  });
})();
</script>
"""

def instrument_html(html):
    pattern = r'(<script type="importmap">)(.*?)(</script>)'
    match = re.search(pattern, html, flags=re.S)
    if not match:
        raise AssertionError("Standalone build importmap absent")
    imports = json.loads(match.group(2))
    target = imports["imports"]["solo/app/game.js"]
    prefix, encoded = target.split(",", 1)
    if not prefix.startswith("data:text/javascript;base64"):
        raise AssertionError("Unexpected game module encoding")
    source = base64.b64decode(encoded).decode("utf8")
    # Only the benchmark copy receives this test-only hook; the shipped
    # source, save schema and localStorage are never modified by this code.
    source += r"""
Object.defineProperty(window, '__soloPerfTeleport', {value: (x, y) => {
  if (![x, y].every(Number.isFinite) || x < 25 || x > W-25 || y < 25 || y > H-25)
    throw new RangeError('Profiling position out of world');
  state.x=x; state.y=y; camX=x; camY=y;
  activeTarget=null;
  updateHud();
  return zoneAt(x,y);
}});
"""
    imports["imports"]["solo/app/game.js"] = prefix + "," + base64.b64encode(source.encode("utf8")).decode("ascii")
    html = html[:match.start()] + match.group(1) + json.dumps(imports) + match.group(3) + html[match.end():]
    entry = '<script type="module">import \'solo/app/game.js\';</script>'
    if html.count(entry) != 1:
        raise AssertionError("Standalone game entry absent or repeated")
    return html.replace(entry, PROFILE_SCRIPT + entry)

def percentile(values, q):
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered)-1)*q
    lo = math.floor(index)
    hi = math.ceil(index)
    return round(ordered[lo]*(hi-index) + ordered[hi]*(index-lo), 3) if lo != hi else round(ordered[lo],3)

def measure(page, label, seconds=1.9, event=None):
    before = page.evaluate("window.__survivalStatus")
    page.evaluate("window.__soloFrameProfile.start()")
    event(page) if event else page.wait_for_timeout(round(seconds*1000))
    raw = page.evaluate("window.__soloFrameProfile.stop()")
    after = page.evaluate("window.__survivalStatus")
    intervals, costs = raw["intervals"], raw["costs"]
    assert len(costs) >= 12, f"{label}: only {len(costs)} browser frames"
    assert len(intervals) >= 11, f"{label}: too few RAF intervals"
    assert all(math.isfinite(n) and n >= 0 for n in intervals+costs), label
    elapsed = sum(intervals)
    result = {
        "frames": len(costs),
        "fpsFromRaf": round(1000*len(intervals)/elapsed, 2) if elapsed else 0,
        "rafIntervalMs": {"p50": percentile(intervals,.5), "p95":percentile(intervals,.95), "max":round(max(intervals),3)},
        "callbackCpuMs": {"p50":percentile(costs,.5), "p95":percentile(costs,.95), "max":round(max(costs),3)},
        "framesOver33ms":sum(n>33.4 for n in intervals),
        "framesOver50ms":sum(n>50 for n in intervals),
        "cacheBuilt": after["terrainCache"]["tilesBuilt"]-before["terrainCache"]["tilesBuilt"],
        "cacheReused":after["terrainCache"]["tilesReused"]-before["terrainCache"]["tilesReused"],
        "cacheBytes":after["terrainCache"]["bytes"],
        "traveled":round(math.hypot(after["x"]-before["x"],after["y"]-before["y"]),2)
    }
    assert result["cacheBytes"] <= 24*1024*1024, label
    print(f'{label:23s} FPS {result["fpsFromRaf"]:5.1f} | RAF p95 {result["rafIntervalMs"]["p95"]:6.1f} ms | callback p95 {result["callbackCpuMs"]["p95"]:6.1f} ms | tiles +{result["cacheBuilt"]} / hit {result["cacheReused"]}', flush=True)
    return result

def run_case(browser, html, name, pos, viewport, touch=False, moving=False, transitions=False):
    context = browser.new_context(viewport={"width":viewport[0],"height":viewport[1]},
        has_touch=touch, is_mobile=touch, device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    try:
        page.set_content(html, wait_until="load")
        page.wait_for_function("window.__survivalStatus?.loaded === true && !!window.__soloPerfTeleport", timeout=20000)
        region = page.evaluate("([x,y])=>window.__soloPerfTeleport(x,y)",list(pos))
        page.wait_for_timeout(500)  # Warm the current scene; report steady state separately.
        cache_start=page.evaluate("window.__survivalStatus.terrainCache")
        if moving:
            def sprint(p):
                p.keyboard.down("Shift")
                p.keyboard.down("d")
                p.wait_for_timeout(2200)
                p.keyboard.up("d")
                p.keyboard.up("Shift")
            output=measure(page,name,2.2,sprint)
            assert output["traveled"] >= 30, f"{name}: sprint blocked ({output['traveled']})"
        elif transitions:
            zones = []
            def jumps(p):
                for xy in [(7900,2700),(10400,2300),(12100,1700),
                           (16000,1900),(18700,3200),(20200,3200),
                           (16000,1900),(12100,1700)]:
                    zones.append(p.evaluate("([x,y])=>window.__soloPerfTeleport(x,y)",list(xy)))
                    p.wait_for_timeout(230)
            output=measure(page,name,1.84,jumps)
            assert len(set(zones)) >= 3, "Scenario did not cross distinct regions"
            assert output["cacheBuilt"] > 0, "Region changes did not trigger terrain rebuilds"
            output["regionsVisited"] = list(dict.fromkeys(zones))
            output["syntheticCameraJumps"] = True
        else:
            output=measure(page,name)
        output["startingZone"]=region
        output["viewport"]=f"{viewport[0]}x{viewport[1]}"
        output["touchEmulated"]=touch
        output["warmupCacheTiles"]=cache_start["tiles"]
        output["jsHeapUsedBytes"]=page.evaluate("() => performance.memory?.usedJSHeapSize ?? null")
        assert not errors, f"{name}: page errors {errors}"
        return output
    finally:
        context.close()

def main():
    html=instrument_html((ROOT/"dist"/"index.html").read_text(encoding="utf8"))
    start=time.perf_counter()
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,
            executable_path="/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None,
            args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            scenarios={
                "openCountry":((1070,3540),(1280,720),False,False,False),
                "denseOldCity":((3900,2000),(1280,720),False,False,False),
                "industrialTown":((18750,2900),(1280,720),False,False,False),
                "sprintOnRoad":((10600,2250),(1280,720),False,True,False),
                "regionTransitions":((7900,2700),(1280,720),False,False,True),
                "mobileViewportCity":((3900,2000),(390,844),True,False,False)
            }
            results={}
            for name, (position, viewport, touch, moving, transitions) in scenarios.items():
                results[name]=run_case(browser,html,name,position,viewport,touch,moving,transitions)
        finally:
            browser.close()
    report={"schemaVersion":1,"engine":"Chromium Playwright headless (not iPhone/Safari)",
            "note":"FPS are RAF callback cadence under CI; callback CPU excludes GPU/compositor time. Synthetic region jumps are diagnostic, not real travel speed.",
            "durationSeconds":round(time.perf_counter()-start,1),"scenarios":results}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print(f"Profile JSON: {OUTPUT.relative_to(ROOT)}",flush=True)

if __name__=="__main__":
    main()
