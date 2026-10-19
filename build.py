#!/usr/bin/env python3
"""Baut die statischen Seiten von rev2-marketing.at aus den Fragmenten in src/pages.

Jedes Fragment beginnt mit einem Kopf aus HTML-Kommentaren:
  <!-- title: Seitentitel -->
  <!-- desc: Meta-Beschreibung -->
  <!-- path: /cases -->           (Pfad der Seite, / für die Startseite)
  <!-- nav: cases -->             (optional, markiert den aktiven Menüpunkt)
  <!-- footer: slim -->           (optional, schlanker Footer für Rechtstexte)
  <!-- nosm: 1 -->                (optional, nicht in die Sitemap)
Danach folgt der Inhalt von <main>. Aufruf: python3 build.py
"""
import re, pathlib, datetime

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src" / "pages"
VERSION = "10"
SITE = "https://rev2-marketing.at"

ICON_BARS = '<svg class="bars" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
ICON_X = '<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'

NAV_ITEMS = [
    ("leistungen", "/leistungen", "Leistungen"),
    ("cases", "/cases", "Cases"),
    ("ueber", "/#wir", "Über uns"),
    ("kontakt", "/kontakt", "Kontakt"),
]

BRAND = '<a class="brand" href="/" aria-label="Rev2 Marketing, zur Startseite"><img src="/assets/rev2-marketing-white.png" alt="rev2 marketing" width="1000" height="223"></a>'


def header(active):
    links = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if key == active else ""}>{label}</a>'
        for key, href, label in NAV_ITEMS
    )
    menu = "".join(f'<a href="{href}">{label}</a>' for _, href, label in NAV_ITEMS)
    return f'''<header class="nav">
  <div class="wrap">
    {BRAND}
    <nav class="nav-links">{links}</nav>
    <div class="nav-cta">
      <a class="btn btn-ghost btn-sm" href="https://rev2.at" target="_blank" rel="noopener">rev2.at</a>
      <a class="btn btn-mk btn-sm" href="/kontakt">Projekt anfragen</a>
      <button class="burger" type="button" aria-label="Menü" aria-expanded="false">{ICON_BARS}{ICON_X}</button>
    </div>
  </div>
  <div class="nav-menu">
    {menu}
    <div class="menu-actions">
      <a class="btn btn-mk" href="/kontakt">Projekt anfragen</a>
      <a class="btn btn-ghost" href="https://rev2.at" target="_blank" rel="noopener">Zu rev2.at</a>
    </div>
  </div>
</header>'''


FOOTER_FULL = f'''<footer class="footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="about">
        {BRAND}
        <p>Rev2 Marketing ist die Agenturmarke der Rev2 Innovations GmbH. Content, Social Media und Employer Branding für Unternehmen, die etwas bauen, verwalten oder bewegen.</p>
        <p>Rev2 Innovations GmbH, Wien.</p>
      </div>
      <div>
        <h4>Leistungen</h4>
        <ul>
          <li><a href="/leistungen#social">Social Media Management</a></li>
          <li><a href="/leistungen#content">Content-Produktion</a></li>
          <li><a href="/leistungen#foto">Fotografie</a></li>
          <li><a href="/leistungen#employer">Employer Branding</a></li>
          <li><a href="/leistungen#branding">Branding und Bildsprache</a></li>
          <li><a href="/leistungen#performance">Performance Marketing</a></li>
          <li><a href="/leistungen#ai">AI Content</a></li>
          <li><a href="/leistungen#web">Web und E-Commerce</a></li>
        </ul>
      </div>
      <div>
        <h4>Agentur</h4>
        <ul>
          <li><a href="/cases">Cases</a></li>
          <li><a href="/#wir">Über uns</a></li>
          <li><a href="/kontakt">Kontakt</a></li>
          <li><a href="https://rev2.at" target="_blank" rel="noopener">rev2.at, Software und Automatisierung</a></li>
          <li><a href="/impressum">Impressum</a></li>
          <li><a href="/datenschutz">Datenschutz</a></li>
          <li><a href="/agb">AGB</a></li>
        </ul>
      </div>
      <div>
        <h4>Kontakt</h4>
        <ul>
          <li>Rev2 Innovations GmbH</li>
          <li>Ungargasse 9/9, 1030 Wien</li>
          <li><a href="mailto:max@rev2.at">max@rev2.at</a></li>
          <li><a href="tel:+436644138676">+43 664 4138676</a></li>
          <li><a href="https://www.linkedin.com/company/rev2-innovations" target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a href="https://www.instagram.com/rev2.marketing" target="_blank" rel="noopener">Instagram</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> Rev2 Innovations GmbH</span>
      <span><a href="/impressum">Impressum</a> &nbsp;·&nbsp; <a href="/datenschutz">Datenschutz</a> &nbsp;·&nbsp; <a href="/agb">AGB</a> &nbsp;·&nbsp; <a href="/avv">AVV</a></span>
    </div>
  </div>
</footer>'''

FOOTER_SLIM = '''<footer class="footer">
  <div class="wrap">
    <div class="footer-bottom" style="border-top:0;padding-top:0">
      <span>© <span data-year>2026</span> Rev2 Innovations GmbH</span>
      <span><a href="/impressum">Impressum</a> &nbsp;·&nbsp; <a href="/datenschutz">Datenschutz</a> &nbsp;·&nbsp; <a href="/agb">AGB</a> &nbsp;·&nbsp; <a href="/avv">AVV</a></span>
    </div>
  </div>
</footer>'''


def head(title, desc, path, ld=""):
    url = SITE + ("" if path == "/" else path)
    return f'''<!doctype html>
<html lang="de-AT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:site_name" content="Rev2 Marketing">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_AT">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-rev2-marketing.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0c12">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/dm-sans-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dm-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v={VERSION}">
{ld}</head>
<body>
'''


def parse(text):
    meta = {}
    for m in re.finditer(r"^<!--\s*(\w+):\s*(.*?)\s*-->\s*$", text, re.M):
        meta[m.group(1)] = m.group(2)
    body = re.sub(r"^(<!--\s*\w+:.*?-->\s*\n)+", "", text, count=1)
    ld = ""
    m = re.search(r"<!-- ld -->(.*?)<!-- /ld -->", body, re.S)
    if m:
        ld = '<script type="application/ld+json">' + m.group(1).strip() + "</script>\n"
        body = body.replace(m.group(0), "")
    return meta, body.strip(), ld


def build():
    pages = []
    for f in sorted(SRC.glob("*.html")):
        meta, body, ld = parse(f.read_text(encoding="utf-8"))
        path = meta["path"]
        out = ROOT / ("index.html" if path == "/" else path.strip("/") + ".html")
        foot = FOOTER_SLIM if meta.get("footer") == "slim" else FOOTER_FULL
        html = (head(meta["title"], meta["desc"], path, ld) + header(meta.get("nav", "")) +
                "\n<main>\n" + body + "\n</main>\n\n" + foot +
                f'\n<script src="/assets/main.js?v={VERSION}" defer></script>\n</body>\n</html>\n')
        out.write_text(html, encoding="utf-8")
        if not meta.get("nosm"):
            pages.append(path)
        print("ok", out.name)
    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        pri = "1.0" if p == "/" else ("0.9" if p in ("/leistungen", "/cases") else "0.6")
        sm.append(f"  <url><loc>{SITE}{'' if p == '/' else p}</loc><lastmod>{today}</lastmod><priority>{pri}</priority></url>")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build()
