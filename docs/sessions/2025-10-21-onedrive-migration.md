\# OneDrive Migration - October 21, 2025



\## Problem

Project was stored in OneDrive causing:

\- Vite "UNKNOWN: unknown error, read" failures

\- Node.js file access issues  

\- Git mmap errors

\- Slow sync of 200k+ node\_modules files



\## Solution

Migrated project from OneDrive to local development folder.



\### Migration Steps Completed

1\. ✅ Copied project from OneDrive to `C:\\Dev\\gse-inventory`

2\. ✅ Committed all uncommitted changes (46 files changed)

3\. ✅ Pushed to GitHub (commit: 14328ff)

4\. ✅ Recreated venv (backend)

5\. ✅ Recreated node\_modules (frontend)

6\. ✅ Verified .gitignore files (already properly configured)

7\. ✅ Removed backup files from Git tracking

8\. ✅ Tested both servers successfully



\## New Workflow



\### Daily Development (Home Computer)

```powershell

\# Start backend

cd C:\\Dev\\gse-inventory\\backend

.\\venv\\Scripts\\activate

python manage.py runserver



\# Start frontend (new terminal)

cd C:\\Dev\\gse-inventory\\frontend

npm run dev

```



\### Syncing Between Computers

```powershell

\# End of session:

git add .

git commit -m "Description of changes"

git push



\# Start of session (other computer):

git pull

```



\## File Locations



\### Local Development

\- \*\*Location:\*\* `C:\\Dev\\gse-inventory`

\- \*\*Backend:\*\* SQLite database (local only, not synced)

\- \*\*Frontend:\*\* node\_modules (local only, not synced)

\- \*\*Venv:\*\* Python virtual environment (local only, not synced)



\### GitHub

\- \*\*Repo:\*\* https://github.com/em591991/gse-inventory

\- \*\*Purpose:\*\* Source code backup and sync between computers

\- \*\*What's stored:\*\* Source code, migrations, configs

\- \*\*What's NOT stored:\*\* venv, node\_modules, databases, backups



\### OneDrive (Old Location - Deprecated)

\- \*\*Location:\*\* `C:\\Users\\ErikMollerberg\\OneDrive - GSE Integrated\\Documents - GSE Shared\\Systems Development\\GSE App\\Inventory Repo\\gse-inventory`

\- \*\*Status:\*\* Backup only, not used for active development

\- \*\*Action:\*\* Can delete after confirming Git workflow works for 1-2 weeks



\## Benefits

✅ No more Vite errors

✅ Fast npm install/pip install  

✅ Reliable Git operations

✅ Professional development workflow

✅ Safe syncing between computers via GitHub



\## Work Laptop Setup (Next Steps)

When back at work, clone fresh from GitHub:

```powershell

cd C:\\Dev

git clone https://github.com/em591991/gse-inventory.git

cd gse-inventory



\# Setup backend

cd backend

python -m venv venv

.\\venv\\Scripts\\activate

pip install -r requirements.txt

python manage.py migrate



\# Setup frontend

cd ..\\frontend

npm install

```



\## VS Code Setup

\- Open project: `code C:\\Dev\\gse-inventory`

\- Or: File → Open Recent → gse-inventory

\- Terminal automatically starts in project root

\- No workspace file needed (optional convenience)

