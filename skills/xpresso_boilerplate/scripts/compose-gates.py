#!/usr/bin/env python3
"""COMPOSE gates for a generated project (SKILL.md section 8), run from the project root.

Every number this prints is a gate the builder did not author: the tree, the registry, the suites, the
git history and the source checkout are the inputs. Exit 1 when any gate is non-zero, so the command
can fail. Standard library only; the house interpreter is /opt/homebrew/bin/python3.12, any 3.10+ works.
"""
import hashlib
import json
import pathlib
import re
import subprocess
import sys

root = pathlib.Path.cwd()
project = json.loads((root / "apps/web/project.json").read_text())
src = pathlib.Path(project["source"])
problems = 0


def run(args, cwd=None):
    return subprocess.run(args, cwd=cwd or root, capture_output=True, text=True)


# 1. Module directories: auth, kit and yours; the starter must be gone once you own a module.
modules = sorted(p.name for p in (root / "apps/web/src/modules").iterdir() if p.is_dir())
own = [m for m in modules if m not in ("auth", "kit", "start")]
print("modules:", " ".join(modules))
if "start" in modules and own:
    print("STARTER PRESENT with your own modules registered: 1"); problems += 1

# 2. Demo strings in what you ship: the app, its QA producers and your product docs.
words = r"harbor|amelia brooks|guest experience|kitchen and terrace|hospitality|mara ellis|otto lindqvist"
hits = []
for base in ("apps/web/src", "scripts/qa", "docs/product"):
    for p in (root / base).rglob("*"):
        if p.is_file() and p.suffix in {".ts", ".tsx", ".mjs", ".css", ".md", ".json", ".html"}:
            for n, line in enumerate(p.read_text(errors="replace").splitlines(), 1):
                if re.search(words, line, re.I):
                    hits.append(f"{p.relative_to(root)}:{n}")
for h in hits: print("DEMO STRING", h)
print(len(hits), "demo strings in apps/web/src, scripts/qa and docs/product")
problems += 1 if hits else 0

# 3. Demo files under any name. The generator's own classification decides what it ships; read it from
#    the source checkout so this list cannot drift from scripts/create_project.sh.
generator = (src / "scripts/create_project.sh").read_text()
def js_set(name):
    m = re.search(name + r" = new Set\(\[(.*?)\]\)", generator, re.S)
    return set(re.findall(r"'([^']+)'", m.group(1))) if m else None
generic_routes, generic_data, generic_qa = js_set("genericRoutes"), js_set("genericData"), js_set("genericQA")
if generic_routes is None or generic_data is None or generic_qa is None:
    print("WARNING: could not read the generator's generic lists; using the v3.0.0 lists")
    generic_routes = {"routes.css", "Configure.tsx", "Login.tsx", "Register.tsx", "ForgotPassword.tsx", "ResetPassword.tsx", "TwoFactor.tsx", "VerifyEmail.tsx"}
    generic_data = {"auth.ts", "graph.ts", "session-graph.ts", "session-store.tsx"}
    generic_qa = {"common.mjs", "auth-states.mjs", "perf.mjs", "capture.mjs", "gates.mjs", "perceiver.mjs", "perceiver.sh"}
def shipped(path):
    if path.startswith("apps/web/src/modules/"):
        return bool(re.match(r"apps/web/src/modules/(auth|kit)/", path)) and not path.endswith("/Kit.tsx")
    if path.startswith("apps/web/src/routes/"): return path.rsplit("/", 1)[1] in generic_routes
    if path.startswith("apps/web/src/data/"): return path.rsplit("/", 1)[1] in generic_data
    if path.startswith("scripts/qa/"): return path.rsplit("/", 1)[1] in generic_qa
    return False
listed = run(["git", "-C", str(src), "ls-files", "apps/web/src/modules", "apps/web/src/routes", "apps/web/src/data", "scripts/qa"]).stdout.split()
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
demo = {digest(src / f): f for f in listed if not shipped(f) and (src / f).is_file()}
identical = []
for base in ("apps/web/src", "scripts/qa"):
    for p in (root / base).rglob("*"):
        if p.is_file() and digest(p) in demo:
            identical.append((str(p.relative_to(root)), demo[digest(p)]))
for mine, theirs in identical: print("IDENTICAL", mine, "==", theirs)
print(len(identical), "files identical to a demo file (any path)")
problems += 1 if identical else 0

# 4. The registry, loaded through the app's own TypeScript loader (never parsed by regex: field
#    order in a QAScreen is arbitrary, and a parser that misses an entry cannot report the gap).
loaded = run(["pnpm", "--filter", "web", "exec", "tsx", "-e", 'import { screens } from "./src/qa/screens.ts"; console.log(JSON.stringify(screens))'])
try:
    screens = json.loads(loaded.stdout.strip().splitlines()[-1])
except Exception:
    screens = None
if screens is None:
    print("registry screens: FAILED to load", (loaded.stderr.strip().splitlines() or ["?"])[-1]); problems += 1
else:
    print("registry screens:", len(screens))

# 5. Overlay states of your screens with no suite that drives the screen. A suite counts only when it
#    imports the harness and awaits prepare() outside a comment, and names the screen in code: `.id === "<id>"` or
#    `.module === "<module>"`. A comment, a heading assertion or a stray word never satisfies it.
overlay = {"sheet-open", "panel-open", "record-panel-open", "dialog", "menu", "popover", "actions-menu"}
covered_ids, covered_modules = set(), set()
def code_only(text):
    """The suite's code without its comments: a claim inside a comment is not a claim."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    # A trailing `//` comment goes too; `://` inside a URL or a quoted string is not a comment.
    return "\n".join(re.sub(r"""(?<![:"'`\\])//.*$""", "", line) for line in text.splitlines())
for suite in (root / "apps/web/tests").glob("*.browser.mjs"):
    code = code_only(suite.read_text())
    # A suite drives a screen when it imports the harness and awaits one of its drivers
    # (prepare() sets up a registered state; openRoutePane() opens a pane by the class's own form).
    if "scripts/qa/common.mjs" not in code or not re.search(r"\bawait\s+(prepare|openRoutePane)\(", code): continue
    covered_ids.update(re.findall(r'\.id === "([^"]+)"', code))
    covered_modules.update(re.findall(r'\.module === "([^"]+)"', code))
uncovered = []
for screen in screens or []:
    states = set(screen.get("states", []))
    if screen.get("module") == "auth" or screen.get("id") == "configure" or not (states & overlay): continue
    if screen["id"] in covered_ids or screen.get("module") in covered_modules: continue
    uncovered.append((screen["id"], screen.get("path"), sorted(states & overlay)))
for sid, path, st in uncovered: print("NO SUITE", sid, path, st)
if screens is None: print("overlay coverage: not evaluated (the registry did not load)")
else: print(len(uncovered), "screens with an overlay state and no suite that drives them")
problems += 1 if uncovered else 0

# 6. Suites in the sweep.
scripts = json.loads((root / "apps/web/package.json").read_text())["scripts"]
print(len([k for k in scripts if k.startswith("test:browser:")]), "test:browser scripts in the sweep")

# 7. MODEL before the first component, witnessed by git: the commit with subject `ledger: MODEL`
#    precedes the first commit that adds a file under one of your module directories.
if (root / ".git").exists():
    # The add-only log skips commits that add nothing, so positions come from the full history by hash.
    history = [line.split("\t", 1) for line in run(["git", "log", "--reverse", "--format=%H%x09%s"]).stdout.splitlines()]
    position = {h: i for i, (h, _) in enumerate(history)}
    model_at = next((i for i, (_, subject) in enumerate(history) if subject.startswith("ledger: MODEL")), None)
    first_module_commit = None
    current = None
    for line in run(["git", "log", "--reverse", "--format=COMMIT %H", "--diff-filter=A", "--name-only"]).stdout.splitlines():
        if line.startswith("COMMIT "):
            current = position.get(line.split()[1])
        elif own and any(line.startswith(f"apps/web/src/modules/{m}/") for m in own) and first_module_commit is None:
            first_module_commit = current
    if model_at is None: print("MODEL ORDER: no commit with subject 'ledger: MODEL' (COMPOSE runs after MODEL)"); problems += 1
    elif first_module_commit is None: print("MODEL ORDER: no module file added yet")
    elif model_at < first_module_commit: print("MODEL ORDER: ok (ledger: MODEL before the first module file)")
    else: print("MODEL ORDER VIOLATION: the first module file was added before 'ledger: MODEL'"); problems += 1
else:
    print("MODEL ORDER: not a git repository (RECON runs git init and commits the generated tree)"); problems += 1

print("gates failing:", problems)
sys.exit(1 if problems else 0)
