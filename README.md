# rev2-marketing.at

Website von Rev2 Marketing, der Agenturmarke der Rev2 Innovations GmbH. Gleiche Bauweise wie rev2.at: statisches HTML, CSS und ein kleines Script, eine Serverless-Funktion für die Formulare, gehostet auf Vercel. Push auf `main` deployt automatisch.

## Aufbau

- `src/pages/*.html`: Inhalte der Seiten (nur der Teil innerhalb von `<main>`, mit einem Kopf aus Kommentaren für Titel, Beschreibung und Pfad)
- `build.py`: setzt Kopf, Navigation und Footer um jedes Fragment, schreibt die fertigen Seiten ins Hauptverzeichnis und erzeugt `sitemap.xml`. Aufruf: `python3 build.py`. Bei Änderungen an `style.css` oder `main.js` die Konstante `VERSION` hochzählen.
- `assets/style.css`: Design-System von rev2.at, am Ende der Datei die Marketing-Ergänzungen (Gelb statt Violett, Handschrift „Caveat", Videos, Cases, Zitate, BTS-Bilder)
- `assets/main.js`: Navigation, Reveal, Formulare, Calendly, dazu Video-Einbettung beim Klick und das Auf- und Zuklappen der Cases
- `api/kontakt.js`: nimmt alle Formulare entgegen und schickt sie per Resend, optional zusätzlich als Kontakt in HubSpot

Seiten: `/`, `/leistungen`, `/cases`, `/kontakt`, `/impressum`, `/datenschutz`, `/agb`, `/avv`, `/danke`, `/404`.

## Videos und Bilder einsetzen

- Video: am `<figure class="vid">` entweder `data-embed="https://vimeo.com/…"` bzw. einen YouTube-Link setzen (wird erst beim Klick geladen) oder `data-src="/assets/video.mp4"` für eigene Dateien. Optional ein `<img class="poster" src="…">` als Vorschaubild in die Figure legen.
- Bild: im `<div class="ph">` ein `<img src="…" alt="…">` einfügen und das `<span class="lbl">` entfernen.
- Hochformat ist Standard (9:16), `wide` ergibt 16:9, `sq` quadratisch, `tall` 4:5.

## Einmalig einrichten

1. Vercel: Projekt aus diesem Repo (Team Rev2), Framework „Other", kein Build-Befehl.
2. Environment Variables: `RESEND_API_KEY`, `MAIL_TO` (max@rev2.at), `MAIL_FROM` erst nach Verifizierung der Domain bei Resend, optional `HUBSPOT_TOKEN`. Danach Redeploy.
3. Domain `rev2-marketing.at` erst nach Abnahme in Vercel hinzufügen und DNS bei easyname umstellen.

## Vor dem Go-live

- Alle Platzhalter („folgt") durch echte Videos, Grafiken und BTS-Fotos ersetzen
- Kundenzitate: Wortlaut und Namen nach Freigabe eintragen, die Platzhalter-Badges entfernen
- Cases aus der früheren Agentur nur mit Zustimmung der Kunden zeigen
- Calendly: aktuell ist das Profil `calendly.com/max-rev2` verlinkt, besser ein eigener Termintyp für Marketing
- AI-Content-Unterseite kommt später, wenn es Referenzen gibt (vorerst nur als Leistung unter /leistungen#ai)
- Instagram-Link im Footer prüfen
- OG-Bild liegt unter `assets/og-rev2-marketing.jpg` (Logo auf Dunkel), bei Bedarf gegen ein Foto tauschen
