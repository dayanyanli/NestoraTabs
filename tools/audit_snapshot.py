"""Heuristic publication scan: prints categories/paths only, never matched values."""
from pathlib import Path
import hashlib, json, re, subprocess, zipfile
root = Path(__file__).resolve().parents[1]
patterns = {
 'private_key': rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
 'access_token': rb'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{20,})',
 'credential_assignment': rb'(?i)(?:password|passwd|api[_-]?key|access[_-]?token|secret)\s*[:=]\s*[\x22\x27][^\x22\x27\r\n]{8,}[\x22\x27]',
 'personal_user_path': rb'(?i)[A-Z]:[\\/](?:Users|Documents and Settings)[\\/]',
}
findings=[];count=0
for file in root.rglob('*'):
 if not file.is_file() or any(x in file.parts for x in ('.git','candidates','__pycache__')): continue
 count+=1
 for category, pattern in patterns.items():
  if re.search(pattern,file.read_bytes()): findings.append({'file':file.relative_to(root).as_posix(),'category':category})
blobs=0
if (root/'.git').exists():
 for line in subprocess.check_output(['git','-C',str(root),'rev-list','--objects','--all'],text=True).splitlines():
  oid=line.split()[0]
  if subprocess.check_output(['git','-C',str(root),'cat-file','-t',oid],text=True).strip()!='blob': continue
  blobs+=1;data=subprocess.check_output(['git','-C',str(root),'cat-file','blob',oid])
  for category,pattern in patterns.items():
   if re.search(pattern,data): findings.append({'historical_blob':oid,'category':category})
result={'status':'FAIL' if findings else 'PASS','scope':'heuristic credential/personal-path scan, not a guarantee','files_scanned':count,'historical_blobs_scanned':blobs,'findings':findings}
print(json.dumps(result))
if findings: raise SystemExit(1)
(root/'docs/LOCAL_CHECK_RESULTS.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
