# Backend Testing Guide (Pytest + DRF)

## Install
```bash
cd backend
pip install -r requirements.txt    # your normal deps
pip install -r requirements-dev.txt
```

## Run
```bash
# from backend/
pytest
# with coverage html
pytest --cov --cov-report=html
# open htmlcov/index.html for screenshots
```
