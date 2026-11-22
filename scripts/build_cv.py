# /// script
# requires-python = ">=3.10"
# dependencies = ["reportlab>=4"]
# ///
"""Builds the one-page resume PDF served by the site, in Portuguese or English.

Usage: uv run scripts/build_cv.py [--lang pt|en] [output.pdf]
Texts live in scripts/cv/<lang>.json (the English one is a faithful translation of the Portuguese).
Default output: public/curriculo-gustavo-fiorotti.pdf (pt) or public/curriculo-gustavo-fiorotti-en.pdf
(en). The Portuguese one is also copied to iCloud Drive/Drive when that folder exists. The phone
number is intentionally left out because this PDF is public; career text mirrors
contexto-linkedin-curriculo.md.
"""
import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (HRFlowable, ListFlowable, ListItem, Paragraph,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

HERE = Path(__file__).resolve().parent
LANGS = ("pt", "en")


def default_out(lang):
    """The published PDF for a language: public/curriculo-gustavo-fiorotti[-en].pdf."""
    suffix = "" if lang == "pt" else f"-{lang}"
    return HERE.parent / "public" / f"curriculo-gustavo-fiorotti{suffix}.pdf"


args = argparse.ArgumentParser(description=__doc__.splitlines()[0])
args.add_argument("--lang", choices=LANGS, default="pt")
args.add_argument("out", nargs="?")
args = args.parse_args()
LANG = args.lang
DEFAULT_OUT = default_out(LANG)
OUT = args.out or str(DEFAULT_OUT)
T = json.loads((HERE / "cv" / f"{LANG}.json").read_text(encoding="utf-8"))
# Gustavo's iCloud Drive copy; skipped when the folder is missing (CI, other machines).
ICLOUD_DIR = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Drive"
ACCENT = HexColor("#1F3A5F")
MUTED = HexColor("#555555")

base = ParagraphStyle("base", fontName="Helvetica", fontSize=9.4, leading=12.1, alignment=TA_LEFT)
name = ParagraphStyle("name", parent=base, fontName="Helvetica-Bold", fontSize=20, leading=23, textColor=ACCENT)
role = ParagraphStyle("role", parent=base, fontSize=11, leading=14, textColor=MUTED)
contact = ParagraphStyle("contact", parent=base, fontSize=9, leading=12, textColor=MUTED)
section = ParagraphStyle("section", parent=base, fontName="Helvetica-Bold", fontSize=10.5, leading=13,
                         textColor=ACCENT, spaceBefore=6, spaceAfter=2)
item_title = ParagraphStyle("item_title", parent=base, fontName="Helvetica-Bold", fontSize=9.8)
item_right = ParagraphStyle("item_right", parent=base, fontSize=9, textColor=MUTED, alignment=2)
sub = ParagraphStyle("sub", parent=base, textColor=MUTED, fontSize=9)
bullet = ParagraphStyle("bullet", parent=base)


def link(url, label=None):
    return f'<link href="https://{url}" color="#1F3A5F">{label or url}</link>'


def heading(text):
    return [Paragraph(text.upper(), section),
            HRFlowable(width="100%", thickness=0.6, color=ACCENT, spaceBefore=0, spaceAfter=4)]


def row(left, right):
    t = Table([[Paragraph(left, item_title), Paragraph(right, item_right)]], colWidths=["72%", "28%"])
    t.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                           ("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    return t


def bullets(items):
    return ListFlowable([ListItem(Paragraph(i, bullet), leftIndent=10, value="•") for i in items],
                        bulletType="bullet", start="•", leftIndent=10, bulletFontSize=8, spaceBefore=1, spaceAfter=3)


story = [
    Paragraph("Gustavo Fiorotti", name),
    Paragraph(T["role"], role),
    Spacer(1, 3),
    Paragraph(T["location"] + " &nbsp;·&nbsp; " + link("gus.poke.site") + " &nbsp;·&nbsp; "
              + '<link href="mailto:zgustavof@gmail.com" color="#1F3A5F">zgustavof@gmail.com</link>'
              + " &nbsp;·&nbsp; " + link("linkedin.com/in/gustavofiorotti")
              + " &nbsp;·&nbsp; " + link("github.com/gustavofiorotti"), contact),
]
H = T["headings"]

story += heading(H["summary"])
story.append(Paragraph(T["summary"], base))

story += heading(H["experience"])
for job in T["experience"]:
    story.append(row(job["title"], job["dates"]))
    if "sub" in job:
        story.append(Paragraph(job["sub"], sub))
    story.append(bullets(job["bullets"]))

story += heading(H["projects"])
for p in T["projects"]:
    story.append(row(f"{p['title']} &nbsp;<font name='Helvetica' size='8.6' color='#1F3A5F'>{link(p['url'])}</font>",
                     p["dates"]))
    story.append(Paragraph(p["desc"], base))
    story.append(Spacer(1, 2))

story += heading(H["education"])
edu = T["education"]
story.append(row(edu["title"], edu["dates"]))
story.append(Paragraph(edu["sub"], sub))

story += heading(H["skills"])
for k, v in T["skills"]:
    story.append(Paragraph(f"<b>{k}:</b> {v}", base))

story += heading(H["languages"])
for k, v in T["languages"]:
    story.append(Paragraph(f"<b>{k}:</b> {v}", base))

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=8 * mm,
                        bottomMargin=7 * mm, title=T["pdfTitle"], author="Gustavo Fiorotti")
doc.build(story)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


# Only the published Portuguese PDF goes to iCloud (Gustavo, 22/11), never temp builds (check_cv.py
# passes its own path) nor the English one.
if LANG == "pt" and Path(OUT).resolve() == DEFAULT_OUT and ICLOUD_DIR.is_dir():
    copy = ICLOUD_DIR / DEFAULT_OUT.name
    shutil.copyfile(OUT, copy)
    if sha256(copy) != sha256(OUT):
        sys.exit(f"iCloud copy differs from {OUT}")
    print(f"Copied to {copy}")
