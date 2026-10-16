"""Build the file://-friendly page markup used by seamless navigation.

Run this after editing the main content or footer in any HTML page.
The HTML files remain the source of truth and work without JavaScript.
"""

import json
import re
from pathlib import Path


root = Path(__file__).parent
pages = {}
for name in ("index.html", "projects.html", "materials.html", "project.html", "t-bank-product.html", "big-in-japan.html", "hacknet.html", "petrushka.html", "fran-silvestre.html", "alfa-identity.html", "piter-places.html", "magazine-shop.html", "grandma-posters.html", "midjourney-gallery.html", "dating-app.html", "t-business-creatives.html"):
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
