"""Validate and optionally stage only the files needed by GitHub Pages.

Run `python3 prepare-github-pages.py` for a read-only check.
Run `python3 prepare-github-pages.py --stage` before committing site changes.
"""

import argparse
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for name in ("src", "href", "poster"):
            if name in attributes:
                self.urls.append(attributes[name])


def local_asset(url):
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc:
        return None
    path = unquote(parsed.path).removeprefix("./")
    if not path.startswith("assets/"):
        return None
    candidate = (ROOT / path).resolve()
    if not candidate.is_relative_to(ROOT / "assets"):
        raise ValueError(f"Asset path escapes assets/: {url}")
    return candidate


def site_assets():
    paths = set()
    for html in ROOT.glob("*.html"):
        parser = References()
        parser.feed(html.read_text(encoding="utf-8"))
        paths.update(filter(None, (local_asset(url) for url in parser.urls)))
    for css in ROOT.glob("*.css"):
        source = css.read_text(encoding="utf-8")
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", source):
            asset = local_asset(match.group(2))
            if asset:
                paths.add(asset)
    return paths


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", action="store_true", help="Stage only site files in Git")
    args = parser.parse_args()

    assets = sorted(site_assets())
    missing = [path for path in assets if not path.is_file()]
    if missing:
        raise SystemExit("Missing assets:\n" + "\n".join(map(str, missing)))
    large = [path for path in assets if path.stat().st_size >= 100_000_000]
    if large:
        raise SystemExit("GitHub rejects files >= 100 MB:\n" + "\n".join(map(str, large)))

    total = sum(path.stat().st_size for path in assets)
    print(f"Ready: {len(assets)} referenced assets, {total / 1024**2:.1f} MiB")
    if not args.stage:
        return

    site_files = sorted(
        path for path in ROOT.iterdir()
        if path.is_file() and path.suffix in {".html", ".css", ".js"}
    )
    site_files += [ROOT / name for name in (
        "CNAME", ".nojekyll", ".gitignore", "build-page-content.py",
        "prepare-github-pages.py",
    )]
    subprocess.run(["git", "add", "--", *(str(path) for path in site_files)], cwd=ROOT, check=True)
    for offset in range(0, len(assets), 50):
        subprocess.run(
            ["git", "add", "-f", "--", *(str(path) for path in assets[offset:offset + 50])],
            cwd=ROOT,
            check=True,
        )
    print("Staged site files and referenced assets only.")


if __name__ == "__main__":
    main()
