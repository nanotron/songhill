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

# User

sudo adduser www-data
sudo usermod -aG sudo www-data
sudo chown -R www-data:www-data /var/www/
sudo chmod -R 775 /var/www/


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

pip install django zipp django-admin backend djangorestframework django-cors-headers pydub spleeter python-magic gunicorn
  - or, to reinstall: pip install -I <above packages>

python manage.py migrate
python manage.py collectstatic


# Nginx

sudo cp /var/www/songhill/etc/nginx/nginx.conf /etc/nginx/sites-available/
sudo systemctl start nginx
sudo systemctl enable nginx

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

Good reference: https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-20-04


# Restart all services

songhill/bin/songhill_restart_all.sh


# Tips

> Tail gunicorn logs:

tail -f /var/log/gunicorn/socket.log

> In case of django package problems:

deactivate
rm -rf songhill/backend/venv
rm -rf ~/.cache/pip
< reinstall django pip packages>

