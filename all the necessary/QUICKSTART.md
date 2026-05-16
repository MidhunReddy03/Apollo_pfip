# Quick Start Guide - Apollo DQMS 2.0

## Prerequisites
- Python 3.11+ (Note: Python 3.13 has compatibility issues with some packages)
- PostgreSQL 15+
- Redis 7+
- Node.js 18+

## Backend Setup (Windows)

### Option 1: Automated Setup (Recommended)
```powershell
cd c:\Users\Someonefromearth\Documents\apollo_dqms_final333\backend
python -m venv venv
.\venv\Scripts\activate
.\setup.ps1
```

### Option 2: Manual Setup
```powershell
# 1. Navigate to backend directory
cd c:\Users\Someonefromearth\Documents\apollo_dqms_final333\backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Initialize database (make sure PostgreSQL is running)
python init_db.py

# 6. Start server
uvicorn app.main:app --reload
```

## Frontend Setup

```powershell
# 1. Navigate to frontend directory
cd c:\Users\Someonefromearth\Documents\apollo_dqms_final333\frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

## Using Docker (Easiest)

```powershell
# Start PostgreSQL and Redis
cd c:\Users\Someonefromearth\Documents\apollo_dqms_final333
docker-compose up -d

# Then follow backend setup above
```

## Access Points

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

## Default Admin Credentials

After running `init_db.py`, use these credentials:
- **Username**: admin
- **Password**: admin123
- **Tenant ID**: apollo-main

## Troubleshooting

### Issue: "Cannot find path backend\backend"
**Solution**: Make sure you're in the correct directory. Use full path:
```powershell
cd c:\Users\Someonefromearth\Documents\apollo_dqms_final333\backend
```

### Issue: "ModuleNotFoundError: No module named 'sqlalchemy'"
**Solution**: Activate virtual environment first:
```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: "Field required [type=missing] DATABASE_URL"
**Solution**: The .env file has been created. If still seeing this, check:
```powershell
# Verify .env file exists
ls .env

# If missing, copy from example
copy .env.example .env
```

### Issue: "Connection refused" when starting server
**Solution**: Start PostgreSQL and Redis:
```powershell
docker-compose up -d postgres redis
```

### Issue: Pandas installation fails on Python 3.13 ARM64
**Solution**: Already fixed! Removed pandas/numpy/scikit-learn from requirements.txt (they're for future ML features).

## Next Steps

1. Start backend server
2. Start frontend dev server
3. Open http://localhost:5173
4. Login with admin credentials
5. Start using the system!

## Complete Patient Flow

1. **Register Patient** → Go to Patients page → Add New Patient
2. **Check-in** → Go to Check-in page → Search patient → Select department → Check-in
3. **Monitor Queue** → Go to Queue Board → See real-time queue
4. **Process Patient** → Call Next → Start Service → Complete Service
5. **Check-out** → Go to Encounters page → Mark as completed

## Need Help?

Check the documentation in the `docs/` folder:
- `ARCHITECTURE.md` - System architecture
- `ROADMAP.md` - Development roadmap
- `SETUP.md` - Detailed setup guide
