#!/bin/bash

export SONGHILL_ROOT=/var/www/songhill
cd $SONGHILL_ROOT

echo "SONGHILL: Updating code..."
git pull

echo "SONGHILL: React - npm run build..."
cd $SONGHILL_ROOT/frontend
npm run build

echo "SONGHILL: Django manage.py updates..."
cd $SONGHILL_ROOT/backend
venv/bin/activate
python manage.py migrate
python manage.py collectstatic

echo "SONGHILL: Restarting services..."
$SONGHILL_ROOT/bin/songhill_restart_services.sh

cd -
echo "SONGILL: Deploy complete."

