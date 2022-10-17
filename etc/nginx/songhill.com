# http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass

server {
	listen 80;
	client_max_body_size 200M;

	server_name _;
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

}

