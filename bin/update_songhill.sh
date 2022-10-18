#!/bin/bash

cd /var/www/songhill/
git pull
cd frontend
npm run build
sudo systemctl restart gunicorn
cd -
