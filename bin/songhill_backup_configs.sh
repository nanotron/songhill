#!/bin/bash

cp /etc/systemd/system/gunicorn.s* /var/www/songhill/etc/gunicorn/
cp /etc/nginx/sites-available/songhill.com /var/www/songhill/etc/nginx/

