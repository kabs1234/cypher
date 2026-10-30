#!/bin/sh
set -e

echo "==> Applying database migrations..."
python manage.py migrate --noinput

echo "==> Loading seed data (skipped if the database already has data)..."
python manage.py seed

echo "==> Starting Django server on 0.0.0.0:8000..."
exec python manage.py runserver 0.0.0.0:8000
