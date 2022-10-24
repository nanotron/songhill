#!/bin/bash

sudo systemctl daemon-reload
sudo systemctl restart gunicorn
sudo systemctl restart nginx

