"""Build a local candidate only; never promotes a package to release/."""
from pathlib import Path
import hashlib, json, re, zipfile
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
version = manifest['version']
assert re.fullmatch(r'\d+\.\d+\.\d+', version)
files = ['manifest.json', 'background.js', 'core.js', 'popup.html', 'popup.css', 'popup.js',
         'context-new-group.html', 'context-new-group.css', 'context-new-group.js',
         'LICENSE', 'privacy-policy.html', 'PRIVACY.md', 'PRE_RELEASE_NOTICE.txt']
files += [f'icons/icon{size}.png' for size in (16, 32, 48, 128)]
files += ['assets/wechat-placeholder.svg', 'assets/alipay-placeholder.svg']
out = root / 'candidates'
out.mkdir(exist_ok=True)
package = out / f'nestoratabs-v{version}-candidate.zip'
with zipfile.ZipFile(package, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(files):
        entry = zipfile.ZipInfo(name, (2026, 10, 29, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        archive.writestr(entry, (root / name).read_bytes())
with zipfile.ZipFile(package) as archive:
    assert archive.testzip() is None
    assert sorted(archive.namelist()) == sorted(files)
    for name in files:
        assert archive.read(name) == (root / name).read_bytes()
    assert json.loads(archive.read('manifest.json'))['version'] == version
    for name in ['popup.html', 'context-new-group.html', 'privacy-policy.html']:
        html = archive.read(name).decode('utf-8')
        for src in re.findall(r'(?:src|href)=["\']([^"\']+)', html):
            if src.startswith(('http:', 'https:', '#', 'mailto:')): continue
            assert src in files, (name, src)
digest = hashlib.sha256(package.read_bytes()).hexdigest()
(out / 'SHA256SUMS.txt').write_text(f'{digest}  {package.name}\n', encoding='utf-8')
print(json.dumps({'package': str(package), 'sha256': digest, 'files': len(files)}))
