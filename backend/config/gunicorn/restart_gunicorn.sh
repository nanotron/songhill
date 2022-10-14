#!/bin/bash

sudo killall gunicorn &&
sudo /var/www/songhill/backend/venv/bin/gunicorn -c /var/www/songhill/backend/config/gunicorn/config.py
