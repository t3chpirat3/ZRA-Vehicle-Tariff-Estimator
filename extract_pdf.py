import pdfplumber
import os

pdf_files = [
    r"C:\Users\Sustec 006\Downloads\Documents\Temporary Import Permit Zambia Vehicle.pdf",
    r"C:\Users\Sustec 006\Downloads\Documents\TIP Procedure.pdf",
    r"C:\Users\Sustec 006\Downloads\Documents\Zambia Vehicle Import Cost Breakdown.pdf"
]

output_file = "extracted_content.txt"

with open(output_file, "w", encoding="utf-8") as out_f:
    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            out_f.write(f"\n{'='*50}\n")
            out_f.write(f"FILE: {os.path.basename(pdf_file)}\n")
            out_f.write(f"{'='*50}\n\n")
            with pdfplumber.open(pdf_file) as pdf:
                for i, page in enumerate(pdf.pages):
                    out_f.write(f"--- PAGE {i+1} ---\n")
                    text = page.extract_text()
                    if text:
                        out_f.write(text + "\n")
                    
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            for row in table:
                                out_f.write(str(row) + "\n")
            out_f.write("\n")
        else:
            print(f"File not found: {pdf_file}")

print(f"Extraction complete. See {output_file}")
