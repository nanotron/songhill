# nginx
```
sudo cp /var/www/songhill/etc/nginx/nginx.conf /etc/nginx/sites-available/
sudo systemctl start nginx
sudo systemctl enable nginx
```

# gunicorn
```
sudo cp /var/www/songhill/etc/gunicorn/gunicorn.s* /etc/systemd/system/
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

or

sudo systemctl daemon-reload
sudo systemctl restart gunicorn

```

Good reference for this: https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-20-04

