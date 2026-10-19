"""Build the file://-friendly page markup used by seamless navigation.

Run this after editing the main content or footer in any HTML page.
The root HTML files remain the source of truth and work without JavaScript.
It also writes static entry pages for the extensionless public routes.
"""

import json
import re
from pathlib import Path


root = Path(__file__).parent
pages = {}
for name in ("index.html", "projects.html", "materials.html", "ila-estate.html", "t-bank-product.html", "big-in-japan.html", "hacknet.html", "petrushka.html", "fran-silvestre.html", "alfa-identity.html", "piter-places.html", "tissue-magazine.html", "grandma-posters.html", "midjourney-gallery.html", "dating-app.html", "t-business-creatives.html"):
    html = (root / name).read_text(encoding="utf-8")

    def extract(pattern):
        match = re.search(pattern, html, re.S)
        if not match:
            raise ValueError(f"Missing {pattern!r} in {name}")
        return match.group(0)

    pages[name] = {
        "title": re.search(r"<title>(.*?)</title>", html, re.S).group(1),
        "bodyClass": re.search(r'<body(?: class="([^"]*)")?', html).group(1) or "",
        "main": extract(r"<main\b.*?</main>"),
        "footer": extract(r"<footer\b.*?</footer>"),
    }

(root / "page-content.js").write_text(
    "// Generated from the HTML pages by build-page-content.py.\n"
    + "window.portfolioPageMarkup = "
    + json.dumps(pages, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)

# Preserve old direct links while telling crawlers which address to index.
for legacy, canonical in (
    ("project.html", "ila-estate.html"),
    ("magazine-shop.html", "tissue-magazine.html"),
):
    html = (root / canonical).read_text(encoding="utf-8")
    html = html.replace(
        "<head>",
        f'<head>\n    <link rel="canonical" href="https://marusyashebanova.ru/{canonical}" />',
        1,
    )
    (root / legacy).write_text(html, encoding="utf-8")

for route, source in (
    ("main", "index.html"),
    ("videos", "materials.html"),
    ("articles", "materials.html"),
):
    route_dir = root / route
    route_dir.mkdir(exist_ok=True)
    html = (root / source).read_text(encoding="utf-8")
    html = html.replace("<head>", '<head>\n    <base href="../" />', 1)
    (route_dir / "index.html").write_text(html, encoding="utf-8")
