"""Gunicorn config file"""

"""
sudo mkdir -pv /var/{log,run}/gunicorn/
sudo chown -cR www-data:www-data /var/{log,run}/gunicorn/

sudo /var/www/songhill/backend/venv/bin/gunicorn -c /var/www/songhill/backend/config/gunicorn/config.py
"""

pythonpath = "/var/www/songhill/backend"
# Django WSGI application path in pattern MODULE_NAME:VARIABLE_NAME
wsgi_app = "backend.wsgi:application"
# The granularity of Error log outputs
loglevel = "debug"
# The number of worker processes for handling requests
workers = 4
# The socket to bind
bind = "0.0.0.0:8001"
# Restart workers when code changes (development only!)
reload = False
# Write access and error info to /var/log
accesslog = errorlog = "/var/log/gunicorn/prod.log"
# Redirect stdout/stderr to log file
capture_output = True
# PID file so you can easily fetch process ID
pidfile = "/var/run/gunicorn/prod.pid"
# Daemonize the Gunicorn process (detach & enter background)
daemon = True
