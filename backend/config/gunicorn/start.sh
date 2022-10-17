#!/bin/bash
/var/www/songhill/backend/venv/bin/gunicorn --config /var/www/songhill/backend/config/gunicorn/prod.py

