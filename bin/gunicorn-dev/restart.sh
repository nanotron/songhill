#!/bin/bash

sudo killall gunicorn &&
/var/www/songhill/bin/gunicorn-dev/start.sh
