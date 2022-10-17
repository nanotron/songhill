#!/bin/bash

sudo killall gunicorn &&
/var/www/songhill/backend/config/gunicorn/start_gunicorn.sh
