"""Extract full (untruncated) table cells from the catalog PDF to JSON."""
import json
import pdfplumber

PDF = "Vehicle Models 2000-2026 Catalog.pdf"
OUT = "scripts/pdf_models.json"

pages = []
with pdfplumber.open(PDF) as pdf:
    for i, page in enumerate(pdf.pages):
        ptables = []
        for tbl in page.extract_tables():
            rows = []
            for row in tbl:
                cells = [(c or "").replace("\n", " ").strip() for c in row]
                col0 = cells[0] if len(cells) > 0 else ""
                col1 = cells[1] if len(cells) > 1 else ""
                col2 = cells[2] if len(cells) > 2 else ""
                if col0 or col1:
                    rows.append([col0, col1, col2])
            if rows:
                ptables.append(rows)
        pages.append({"page": i + 1, "tables": ptables})

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(pages, f, ensure_ascii=False, indent=1)
print(f"wrote {OUT}")
