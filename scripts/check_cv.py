# /// script
# requires-python = ">=3.10"
# dependencies = ["reportlab>=4", "pypdf>=4"]
# ///
"""Checks the public resume PDFs (Portuguese and English): one page, contact line present, the
right language and no phone number.

Usage: uv run scripts/check_cv.py
Rebuilds each PDF into a temp dir with build_cv.py and also checks the committed copies in public/.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PUBLISHED = {"pt": ROOT / "public" / "curriculo-gustavo-fiorotti.pdf",
             "en": ROOT / "public" / "curriculo-gustavo-fiorotti-en.pdf"}
# a heading only that language's PDF has: catches a PDF built in the wrong language
HEADING = {"pt": "EXPERIÊNCIA", "en": "EXPERIENCE"}
# Brazilian phone formats, e.g. (11) 91234-5678, 11 91234 5678, +55 11912345678.
PHONE = re.compile(r"(\+?55\s*)?\(?\d{2}\)?[\s.-]*9?\d{4}[\s.-]?\d{4}")


def check(pdf: Path, lang: str) -> list[str]:
    reader = PdfReader(pdf)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    errors = []
    if len(reader.pages) != 1:
        errors.append(f"{pdf.name}: {len(reader.pages)} pages, expected 1")
    if "Gustavo Fiorotti" not in text or "github.com/gustavofiorotti" not in text:
        errors.append(f"{pdf.name}: text extraction failed or header is missing")
    if HEADING[lang] not in text:
        errors.append(f"{pdf.name}: missing {HEADING[lang]!r}, not the {lang} resume")
    if match := PHONE.search(text):
        errors.append(f"{pdf.name}: phone number found: {match.group(0)!r}")
    return errors


def main() -> int:
    errors = []
    with tempfile.TemporaryDirectory() as tmp:
        for lang, published in PUBLISHED.items():
            fresh = Path(tmp) / f"fresh-{lang}.pdf"
            subprocess.run([sys.executable, str(ROOT / "scripts" / "build_cv.py"), "--lang", lang, str(fresh)],
                           check=True)
            errors += check(fresh, lang) + check(published, lang)
    for error in errors:
        print(f"FAIL {error}")
    if not errors:
        print("OK: pt and en, 1 page each, no phone number (fresh builds and public/ copies)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
