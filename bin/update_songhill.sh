#!/bin/bash

cd /var/www/songhill/
git pull
cd frontend
npm run build
cd -
