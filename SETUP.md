# Original Production Server prior to March 2023.
  - Django and React served together on Linode via nginx with gunicorn.

  8GB RAM Linode 
  4 CPU Cores
  160 GB Storage
  Debian Linux 11 Bullseye

# Self-Hosted KVM Guest Server for Django as of March 2023
  - Frontend: React served on Linode (nanotron.net) via nginx with gunicorn.
  - Server: songhill.home/songhill.nanotron.net: Django nginx with gunicorn.

  64GB RAM KVM Guest on Palpatine 
  8 CPU Cores
  256 GB Storage
  Debian Linux 11 Bullseye

####################################################################################

# Hostname

sudo hostnamectl set-hostname songhill

# System Dependencies

sudo apt install git vim ufw htop nginx tmux curl ripgrep rsync npm

# System Dependencies - Backend Only

sudo apt install ffmpeg libavcodec-extra zip python3-pip python3-dev libpq-dev virtualenv psmisc

# OLD: Node - Frontend - Only perform this if the `apt install` doesn't work.

curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs

# Firewall

sudo ufw allow "OpenSSH"
sudo ufw enable
sudo ufw allow "WWW"
sudo ufw allow "WWW Secure"

For songhill.home:
sudo ufw allow 8008

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
- Log out and in to make sure the above permissions take.
- Add ssh-key to Github.

cd /var/www/
git clone git@github.com:nanotron/songhill.git
git config --global --add safe.directory /var/www/songhill
git config pull.rebase false

sudo chown -R www-data:www-data songhill/
sudo chmod 775 -R songhill/

# React

cd songhill/frontend
npm i
npm run build

# React - Set API Path

NOTE: If using a remote django HTTPS must be used by the referrer.

If using remote API:

touch /var/www/songhill/frontend/.env
```
REACT_APP_API_PATH=https://songhill.nanotron.net/api
```
or
```
REACT_APP_API_PATH=https://localhost/api
```

# Django

cd songhill/backend
touch .env
vim .env
- Set with `SECRET_KEY={existing value from other instances}`

virtualenv venv -p python3
source venv/bin/activate

pip install django zipp django-admin backend djangorestframework django-cors-headers pydub spleeter python-magic gunicorn python-decouple psutil python-decouple config django-cors-headers
  - or, to reinstall: pip install -I <above packages>

optional: python manage.py migrate
python manage.py collectstatic

# Nginx

songhill.com: sudo cp /var/www/songhill/etc/nginx/songhill.com /etc/nginx/sites-available/
songhill.home: sudo cp /var/www/songhill/etc/nginx/songhill.home /etc/nginx/sites-available/

cd /etc/nginx/sites-enabled/
sudo ln -s ../sites-available/songhill.home

sudo systemctl start nginx
sudo systemctl enable nginx

# Apache

spleeter.org: sudo cp /var/www/songhill/etc/apache/spleeter.org /etc/apache/sites-available/

cd /etc/apache/sites-enabled/
sudo ln -s ../sites-available/spleeter.org

sudo systemctl start apache2
sudo systemctl enable apache2

# SSL Certificate - Nginx or Apache

nginx: sudo apt install certbot python3-certbot-nginx
apache: sudo apt install certbot python3-certbot-apache

linode (apache): sudo certbot --apache -d songhill.com -d www.songhill.com
linode (nginx): sudo certbot --nginx -d songhill.com -d www.songhill.com

local (nginx): sudo certbot --nginx -d songhill.nanotron.net
Note: Open port 80 and send it to songhill.home first so certbot can connect.

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

To Reload:
sudo systemctl daemon-reload && sudo systemctl restart gunicorn

# Deploy: Update and restart all services

/var/www/songhill/bin/songhill_deploy.sh

# Restart nginx and gunicorn only

/var/www/songhill/bin/songhill_restart_services.sh

# Symlinks

cd
ln -s /etc/nginx/sites-enabled
ln -s /var/www/songhill
ln -s /etc/systemd/system

# Backup existing nginx and gunicorn etc configs

/var/www/songhill/bin/songhill_backup_configs.sh

# Crontab - Every hour.
> Delete any files older than 30 minutes.
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
