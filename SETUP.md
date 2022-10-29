# Current Production Server

8GB RAM Linode 
4 CPU Cores
160 GB Storage
Debian Linux 11 Bullseye


# Hostname

sudo hostnamectl set-hostname songhill


# Node

curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs


# System Dependencies

sudo apt install vim ufw htop ffmpeg libavcodec-extra zip python3-pip python3-dev libpq-dev nginx virtualenv psmisc rsync tmux curl


# Firewall

sudo ufw allow "OpenSSH"
sudo ufw enable
sudo ufw allow "WWW"
sudo ufw allow "WWW Secure"

> sudo ufw status

```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
WWW                        ALLOW       Anywhere                  
WWW Secure                 ALLOW       Anywhere                  
8000                       DENY        Anywhere                  
Nginx Full                 ALLOW       Anywhere                  
OpenSSH (v6)               ALLOW       Anywhere (v6)             
WWW (v6)                   ALLOW       Anywhere (v6)             
WWW Secure (v6)            ALLOW       Anywhere (v6)             
8000 (v6)                  DENY        Anywhere (v6)             
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

# Users

sudo adduser www-data
sudo usermod -aG sudo www-data
sudo chown -R www-data:www-data /var/www/
sudo chmod -R 775 /var/www/

sudo usermod -aG sudo emillan
sudo usermod -aG www-data emillan


# Code

cd /var/www/
git clone git@github.com:nanotron/songhill.git

- sudo chown -R www-data:www-data songhill/


# React

cd songhill/frontend
npm i
npm run build


# Django

cd songhill/backend
virtualenv venv -p python3
source venv/bin/activate

pip install django zipp django-admin backend djangorestframework django-cors-headers pydub spleeter python-magic gunicorn python-decouple psutil
  - or, to reinstall: pip install -I <above packages>

python manage.py migrate
python manage.py collectstatic

NOTE: `songhill/backend/.env` file will need to be added manually with the appropriate `SECRET_KEY=` value.


# Nginx

sudo cp /var/www/songhill/etc/nginx/nginx.conf /etc/nginx/sites-available/
sudo systemctl start nginx
sudo systemctl enable nginx


# Nginx - SSL Certificate

sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d songhill.com -d www.songhill.com

> Check status of certbot renewal:
sudo systemctl status certbot.timer

> To test dry-run of renewal process:
sudo certbot renew --dry-run


# Gunicorn

sudo mkdir -pv /var/{log,run}/gunicorn/
sudo chown -cR www-data:www-data /var/{log,run}/gunicorn/

sudo cp /var/www/songhill/etc/gunicorn/gunicorn.s* /etc/systemd/system/
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

or

sudo systemctl daemon-reload
sudo systemctl restart gunicorn


# Deploy: Update and restart all services

songhill/bin/songhill_deploy.sh


# Restart nginx and gunicorn only

songhill/bin/songhill_restart_all.sh


# Backup existing nginx and gunicorn etc configs

songhill/bin/songhill_backup_configs.sh


# Crontab - Every hour.
> Deletes any files older than 30 minutes.

```
0 * * * * /usr/bin/python3 $HOME/songhill/backend/songhill/scripts/run_janitor.py
```

# Tips

> Tail gunicorn logs:

tail -f /var/log/gunicorn/socket.log

> In case of django package problems:

deactivate
rm -rf songhill/backend/venv
rm -rf ~/.cache/pip
< reinstall django pip packages>


# References

https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-20-04
https://realpython.com/django-nginx-gunicorn/
https://austinogiza.medium.com/deploying-react-and-django-rest-framework-with-nginx-and-gunicorn-7a0553459500
