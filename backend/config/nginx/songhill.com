server {
	listen 80;

	server_name _;
	server_tokens off;

	location = /favicon.ico { access_log off; log_not_found off; }

	location / {
		root	/var/www/songhill/frontend/build;
		index	index.html index.htm;
		try_files $uri $uri/ =404;
	}

	location /api/ {
		include		proxy_params;
		rewrite		/api/([^/]+) /$1/ break;
		proxy_pass	http://localhost:8001;
	}

}

