#!/bin/bash

function output() {
  printf "\n============================================================"
  printf "\nSONGHILL: $1"
  printf "\n============================================================\n"
}

sudo printf "\nStarting deploy: set sudo...\n"

export SONGHILL_ROOT=/var/www/songhill
cd $SONGHILL_ROOT

output "Updating code"
git pull

output "React - npm run build"
cd $SONGHILL_ROOT/frontend
npm run build

output "Django manage.py updates"
cd $SONGHILL_ROOT/backend
source venv/bin/activate
#python manage.py migrate --no-input
python manage.py collectstatic --no-input

output "Restarting services"
$SONGHILL_ROOT/bin/songhill_restart_services.sh

cd -
output "Deploy complete"

