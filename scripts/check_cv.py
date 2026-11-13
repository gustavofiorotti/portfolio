# /// script
# requires-python = ">=3.10"
# dependencies = ["reportlab>=4", "pypdf>=4"]
# ///
"""Checks the public resume PDF: one page, contact line present and no phone number.

Usage: uv run scripts/check_cv.py
Rebuilds the PDF into a temp dir with build_cv.py and also checks the committed copy in public/.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PUBLISHED = ROOT / "public" / "curriculo-gustavo-fiorotti.pdf"
# Brazilian phone formats, e.g. (11) 91234-5678, 11 91234 5678, +55 11912345678.
PHONE = re.compile(r"(\+?55\s*)?\(?\d{2}\)?[\s.-]*9?\d{4}[\s.-]?\d{4}")


def check(pdf: Path) -> list[str]:
    reader = PdfReader(pdf)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    errors = []
    if len(reader.pages) != 1:
        errors.append(f"{pdf.name}: {len(reader.pages)} pages, expected 1")
    if "Gustavo Fiorotti" not in text or "github.com/gustavofiorotti" not in text:
        errors.append(f"{pdf.name}: text extraction failed or header is missing")
    if match := PHONE.search(text):
        errors.append(f"{pdf.name}: phone number found: {match.group(0)!r}")
    return errors


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        fresh = Path(tmp) / "fresh.pdf"
        subprocess.run([sys.executable, str(ROOT / "scripts" / "build_cv.py"), str(fresh)], check=True)
        errors = check(fresh) + check(PUBLISHED)
    for error in errors:
        print(f"FAIL {error}")
    if not errors:
        print("OK: 1 page, no phone number (fresh build and public/ copy)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
