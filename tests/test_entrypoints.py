import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")

class EntryPointTests(unittest.TestCase):
    def test_local_script_sources_exist(self):
        sources = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', INDEX, flags=re.I)
        local = [s for s in sources if not re.match(r'^(https?:)?//', s)]
        missing = []
        for src in local:
            clean = src.split("?", 1)[0].split("#", 1)[0]
            candidate = (ROOT / clean).resolve()
            try:
                candidate.relative_to(ROOT.resolve())
            except ValueError:
                missing.append(src)
                continue
            if not candidate.exists():
                missing.append(src)
        self.assertEqual([], missing, f"Missing/escaping script sources: {missing}")

if __name__ == "__main__":
    unittest.main()
