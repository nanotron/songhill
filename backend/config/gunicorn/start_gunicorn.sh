#!/bin/bash
sudo /var/www/songhill/backend/venv/bin/gunicorn -c /var/www/songhill/backend/config/gunicorn/prod.py

