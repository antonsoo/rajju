"""Re-render the identified historical PDF and compare the actual bundled bytes."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("--pdf", type=Path, help="Use an already downloaded source PDF")
args = parser.parse_args()
manifest = json.loads((ROOT / "docs/source-identities.json").read_text())
temporary_root = Path(tempfile.gettempdir())
temporary_root.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="rajju-source-", dir=temporary_root) as directory:
    temporary = Path(directory)
    pdf = args.pdf
    if pdf is None:
        pdf = temporary / "thibaut.pdf"
        urllib.request.urlretrieve(manifest["pdf_url"], pdf)
    assert hashlib.sha256(pdf.read_bytes()).hexdigest() == manifest["pdf_sha256"], "Different PDF edition"
    rendered = []
    for printed, pdf_page in manifest["pdf_pages"].items():
        name = f"thibaut-{int(printed):02}"
        subprocess.run(["pdftoppm", "-f", str(pdf_page), "-l", str(pdf_page), "-scale-to", "2000", "-jpeg", "-jpegopt", "quality=82", "-singlefile", str(pdf), str(temporary / name)], check=True)
        identity = hashlib.sha256((temporary / f"{name}.jpg").read_bytes()).hexdigest()
        assert identity == manifest["files"][f"sources/{name}.jpg"], f"Renderer produced different bytes for {name}; inspect the Poppler version before replacing anything"
        rendered.append({"printed_page": int(printed), "pdf_page": pdf_page, "sha256": identity})
    for file, identity in manifest["files"].items():
        assert hashlib.sha256((ROOT / "public" / file).read_bytes()).hexdigest() == identity, f"Bundled bytes changed: {file}"
    print(json.dumps({"pdf_sha256": manifest["pdf_sha256"], "reproduced_pages": rendered, "bundled_files_verified": len(manifest["files"])}, indent=2))
