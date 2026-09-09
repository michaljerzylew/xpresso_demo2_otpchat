#!/opt/homebrew/bin/python3.12
"""Secret scanner for the local pre-push gate. Standard library only.

Usage:
  scan_secrets.py --range origin/main..HEAD   # scan added lines in commits about to be pushed (default)
  scan_secrets.py --staged                    # scan the index (use from a pre-commit hook)
  scan_secrets.py --paths FILE [FILE ...]     # scan whole files (audit mode)

Exit 0 = clean, 1 = findings, 2 = usage/git error.
Why a hand-rolled scanner: gitleaks is not installed on every machine, the free tier has no CI budget,
and the patterns below cover the token shapes that actually leak in practice.
"""
from __future__ import annotations
import argparse, re, subprocess, sys

PATTERNS = [
    ("GitHub token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b")),
    ("GitHub fine-grained token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("OpenAI-style key", re.compile(r"\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}\b")),
    ("AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("Slack token", re.compile(r"\bxox[abpr]-[A-Za-z0-9-]{10,}\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("Stripe key", re.compile(r"\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b")),
    ("Private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    ("Generic api key assignment", re.compile(r"(?i)\b(?:api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*['\"][^'\"\s]{16,}['\"]")),
    ("Bearer header with literal", re.compile(r"(?i)authorization:\s*bearer\s+[A-Za-z0-9._-]{20,}")),
]
ENV_FILE = re.compile(r"(^|/)\.env(\.[A-Za-z0-9_-]+)?$")
PLACEHOLDER = re.compile(r"(?i)abcdefghij|canary|example|placeholder|xxxx|1234567890|dummy|changeme|your[_-]?(?:api|token|key)")
ALLOW_MARK = "scan-secrets: allow"  # whitelist for a documented fake example. Trusted, not verified: the reviewer must read every line carrying it.

def git(*args: str) -> str:
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout

def findings_in_line(line: str):
    if ALLOW_MARK in line:
        return []
    hits = []
    for name, rx in PATTERNS:
        m = rx.search(line)
        if m and not PLACEHOLDER.search(m.group(0)):
            hits.append(name)
    return hits

def scan_diff(diff: str):
    out, path = [], None
    for raw in diff.splitlines():
        if raw.startswith("+++ "):
            path = raw[4:].removeprefix("b/")
            if path != "/dev/null" and ENV_FILE.search(path) and not path.endswith(".example"):
                out.append((path, 0, "dotenv file committed", raw))
            continue
        if not raw.startswith("+") or raw.startswith("+++"):
            continue
        for name in findings_in_line(raw[1:]):
            out.append((path or "?", 0, name, raw[1:].strip()[:120]))
    return out

def scan_paths(paths):
    out = []
    for p in paths:
        if ENV_FILE.search(p) and not p.endswith(".example"):
            out.append((p, 0, "dotenv file committed", ""))
        try:
            with open(p, encoding="utf-8", errors="replace") as fh:
                for i, line in enumerate(fh, 1):
                    for name in findings_in_line(line):
                        out.append((p, i, name, line.strip()[:120]))
        except OSError:
            pass
    return out

def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--range", default=None)
    g.add_argument("--staged", action="store_true")
    g.add_argument("--paths", nargs="+")
    a = ap.parse_args()
    try:
        if a.paths:
            found = scan_paths(a.paths)
        elif a.staged:
            found = scan_diff(git("diff", "--cached", "--unified=0", "--no-color"))
        else:
            rng = a.range or "origin/main..HEAD"
            try:
                diff = git("diff", "--unified=0", "--no-color", rng)
            except subprocess.CalledProcessError:
                try:
                    diff = git("diff", "--unified=0", "--no-color", "HEAD~1..HEAD")
                except subprocess.CalledProcessError:
                    # first push of a brand-new repo: no origin/main and no parent commit; scan every tracked file instead
                    files = [f for f in git("ls-files").splitlines() if f]
                    found = scan_paths(files)
                    diff = None
            if diff is not None:
                found = scan_diff(diff)
    except subprocess.CalledProcessError as e:
        print(f"scan_secrets: git error: {e.stderr.strip()}", file=sys.stderr)
        return 2
    if not found:
        print("scan_secrets: clean")
        return 0
    print("scan_secrets: BLOCKED, possible secrets:", file=sys.stderr)
    for path, line, name, snippet in found:
        where = f"{path}:{line}" if line else path
        print(f"  {where}  [{name}]  {snippet}", file=sys.stderr)
    print("  Remove the value, use an environment variable, or mark a documented fake with 'scan-secrets: allow'.", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(main())
