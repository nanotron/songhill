# http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass

server {
	client_max_body_size 200M;
	proxy_read_timeout 600;
	proxy_connect_timeout 600;
	proxy_send_timeout 600;

	server_name songhill.com www.songhill.com;
	server_tokens off;

	#location = /favicon.ico { access_log off; log_not_found off; }

	location / {
		root	/var/www/songhill/frontend/build;
		index	index.html index.htm;
		try_files $uri $uri/ =404;
	}

	location /api/ {
		include		proxy_params;
		rewrite		/api/([^/]+) /$1/ break;
		# Connect to gunicorn.sock setup for systemd.
		proxy_pass	http://unix:/var/www/songhill/backend/gunicorn.sock;
		# Use the following to pass to manually run gunicron using the config scripts/
		#proxy_pass	http://localhost:8001;
	}

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/songhill.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/songhill.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.songhill.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = songhill.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

	listen 80;
	server_name songhill.com www.songhill.com;
    return 404; # managed by Certbot
}
