\# GSE Inventory - Developer Guide



Quick reference for daily development workflow.



---



\## 🚀 Starting Development



\### Open Project in VS Code

```powershell

cd C:\\Dev\\gse-inventory

code .

```



\### Start Backend Server

```powershell

\# Terminal 1

cd backend

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\\venv\\Scripts\\activate

python manage.py runserver

```



\### Start Frontend Server

```powershell

\# Terminal 2 (new terminal in VS Code)

cd frontend

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

npm run dev

```



\### Access the App

\- \*\*Frontend:\*\* http://localhost:5173

\- \*\*Backend API:\*\* http://127.0.0.1:8000

\- \*\*Django Admin:\*\* http://127.0.0.1:8000/admin



---



\## 🔄 Daily Workflow



\### Starting Your Session

```powershell

cd C:\\Dev\\gse-inventory



\# Get latest changes from other computer/collaborators

git pull



\# Start servers (see above)

```



\### During Development

\- Make code changes

\- Test locally

\- Save files (VS Code auto-saves)



\### Ending Your Session

```powershell

\# Stop servers (Ctrl+C in each terminal)



\# Save your work to GitHub

git add .

git commit -m "Brief description of what you did"

git push

```



---



\## 💻 Working Across Multiple Computers



\### Home Computer → Work Laptop



\*\*At Home (End of Day):\*\*

```powershell

cd C:\\Dev\\gse-inventory

git add .

git commit -m "Completed user authentication feature"

git push

```



\*\*At Work (Next Day):\*\*

```powershell

cd C:\\Dev\\gse-inventory

git pull  # Downloads your changes from home

\# Continue working...

```



\### Work Laptop → Home Computer



\*\*At Work (End of Day):\*\*

```powershell

cd C:\\Dev\\gse-inventory

git add .

git commit -m "Fixed inventory bug"

git push

```



\*\*At Home (Next Day):\*\*

```powershell

cd C:\\Dev\\gse-inventory

git pull  # Downloads your changes from work

\# Continue working...

```



---



\## 🆕 First-Time Setup on New Computer



If setting up on work laptop or a new machine:

```powershell

\# 1. Create Dev folder

mkdir C:\\Dev

cd C:\\Dev



\# 2. Clone repository

git clone https://github.com/em591991/gse-inventory.git

cd gse-inventory



\# 3. Setup Backend

cd backend

python -m venv venv

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\\venv\\Scripts\\activate

pip install -r requirements.txt

python manage.py migrate



\# 4. Setup Frontend

cd ..\\frontend

npm install



\# 5. Test everything works

\# Backend: python manage.py runserver

\# Frontend: npm run dev

```



---



\## 🔧 Common Commands



\### Backend Commands

```powershell

\# Activate virtual environment

.\\venv\\Scripts\\activate



\# Install new Python package

pip install package-name

pip freeze > requirements.txt  # Save to requirements.txt



\# Database migrations

python manage.py makemigrations

python manage.py migrate



\# Create superuser (admin account)

python manage.py createsuperuser



\# Run development server

python manage.py runserver



\# Django shell (for testing)

python manage.py shell

```



\### Frontend Commands

```powershell

\# Install new npm package

npm install package-name



\# Start development server

npm run dev



\# Build for production

npm run build



\# Run tests (if configured)

npm test

```



\### Git Commands

```powershell

\# Check status

git status



\# Get latest changes

git pull



\# Save your changes

git add .

git commit -m "Your message"

git push



\# View commit history

git log --oneline



\# Undo uncommitted changes

git restore filename.py

```



---



\## 📂 Project Structure

```

C:\\Dev\\gse-inventory\\

├── backend/

│   ├── inventory/          # Core inventory models

│   ├── orders/             # Order management

│   ├── manufacturers/      # Manufacturer tracking

│   ├── vendors/            # Vendor management

│   ├── customers/          # Customer data

│   ├── jobs/               # Jobs \& work orders

│   ├── employees/          # Employee info

│   ├── tools/              # Tool tracking

│   ├── vehicles/           # Vehicle management

│   ├── backend\_app/        # Django settings

│   ├── manage.py           # Django management

│   ├── requirements.txt    # Python dependencies

│   ├── venv/               # Virtual environment (local only)

│   └── db.sqlite3          # Database (local only)

│

├── frontend/

│   ├── src/

│   │   ├── components/     # React components

│   │   ├── pages/          # Page components

│   │   └── App.jsx         # Main app component

│   ├── package.json        # Node dependencies

│   └── node\_modules/       # Node packages (local only)

│

├── docs/

│   ├── PROGRESS.md         # Project progress tracker

│   ├── MODEL\_CHECKLIST.md  # Model implementation status

│   ├── ARCHITECTURE.md     # System architecture

│   └── sessions/           # Session notes

│

├── ERD                     # Database design diagram

├── DEVELOPER\_GUIDE.md      # This file!

└── .gitignore              # Git ignore rules

```



---



\## ⚠️ Important Notes



\### Never Commit These Files:

\- ❌ `venv/` - Virtual environment (recreate on each computer)

\- ❌ `node\_modules/` - Node packages (npm install on each computer)

\- ❌ `db.sqlite3` - Database (each computer has its own)

\- ❌ `.env` - Environment variables with secrets



\### Always Commit These Files:

\- ✅ `\*.py` - Python source code

\- ✅ `\*.jsx` - React components

\- ✅ `requirements.txt` - Python dependencies list

\- ✅ `package.json` - Node dependencies list

\- ✅ `migrations/` - Database migration files



\### File Locations:

\- \*\*Development:\*\* `C:\\Dev\\gse-inventory`

\- \*\*GitHub:\*\* https://github.com/em591991/gse-inventory

\- \*\*Old OneDrive location:\*\* Deprecated (backup only)



---



\## 🆘 Troubleshooting



\### Backend won't start

```powershell

\# Activate venv first

.\\venv\\Scripts\\activate



\# Check if Django is installed

python -m django --version



\# If not, reinstall dependencies

pip install -r requirements.txt

```



\### Frontend won't start

```powershell

\# Reinstall node modules

rm -r node\_modules

npm install

```



\### "Cannot load scripts" error

```powershell

\# Run this in PowerShell before activating venv or running npm

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

```



\### Git conflicts

```powershell

\# If you have merge conflicts after git pull:

\# 1. Open conflicted files in VS Code

\# 2. Choose which changes to keep

\# 3. Save files

\# 4. Commit the resolved conflicts

git add .

git commit -m "Resolved merge conflicts"

git push

```



\### Forgot to pull before working

```powershell

\# Stash your changes temporarily

git stash



\# Pull latest changes

git pull



\# Reapply your changes

git stash pop



\# Resolve any conflicts, then commit

```



---



\## 📚 Additional Resources



\- \*\*Django Docs:\*\* https://docs.djangoproject.com/

\- \*\*React Docs:\*\* https://react.dev/

\- \*\*Git Cheat Sheet:\*\* https://education.github.com/git-cheat-sheet-education.pdf

\- \*\*Project ERD:\*\* See `ERD` file in project root

\- \*\*Architecture Guide:\*\* See `docs/ARCHITECTURE.md`

\- \*\*Progress Tracker:\*\* See `docs/PROGRESS.md`



---



\## 🎯 Quick Command Reference Card

```powershell

\# Start working

cd C:\\Dev\\gse-inventory

git pull

code .



\# Backend terminal

cd backend \&\& .\\venv\\Scripts\\activate \&\& python manage.py runserver



\# Frontend terminal  

cd frontend \&\& npm run dev



\# End of session

git add . \&\& git commit -m "Your message" \&\& git push

```



---



\*\*Last Updated:\*\* October 21, 2025

