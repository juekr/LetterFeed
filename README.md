# LetterFeed

LetterFeed is a self-hosted application that transforms your email newsletters into tidy, readable RSS feeds. It connects to your existing email account, finds the newsletters you specify, and generates a unique RSS feed for each one.

<div align="center">
  <img src="./screenshot.png">
</div>

## Features

- **Email to RSS Conversion:** Automatically converts emails from specified senders into a standard RSS feed.
- **Content Extraction:** Optionally, LetterFeed can extract the main article content from the email body.
- **Email Management:** Can automatically move processed emails to a specified folder in your inbox to keep things organized.
- **Easy to Use Interface:** A simple web interface to manage your newsletters and feeds.

## How It Works

LetterFeed periodically scans your email inbox via IMAP for new emails from the senders you've configured. When it finds a new email, it processes it, and adds it as a new entry to the corresponding newsletter's RSS feed.

## Getting Started

### Prerequisites

1. An existing mailbox with IMAP over SSL on port 993.
2. Docker and Docker Compose installed on your system.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/LeonMusCoden/letterfeed.git
    cd letterfeed
    ```

2.  **Configure environment variables:**

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file with your specific settings.

3.  **Run the Docker containers:**

    ```bash
    make docker-up
    ```

### Behind a Reverse Proxy

Here are some example configurations for running LetterFeed behind a reverse proxy.

#### Nginx

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name letterfeed.leonmuscat.de;

    # SSL configuration (assuming certs are managed elsewhere, e.g., Certbot)
    ssl_certificate /etc/letsencrypt/live/letterfeed.leonmuscat.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/letterfeed.leonmuscat.de/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Public Feeds (No Authentication)
    location /api/feeds/ {
        proxy_pass http://frontend:3000; # Assuming 'frontend' is the service name or IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Secure Frontend (With Basic Auth)
    location / {
        auth_basic "Restricted Area";
        auth_basic_user_file /etc/nginx/conf.d/htpasswd; # Path to your htpasswd file

        proxy_pass http://frontend:3000; # Assuming 'frontend' is the service name or IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Traefik

Create a docker-compose.override.yml with 2 routers for feeds and everything else.

```yaml
services:
  frontend:
    ports: !override []
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"
      - "traefik.docker.network=traefik_web"

      # --- Router for Public Feeds (No Authentication) ---
      - "traefik.http.routers.frontend-public.rule=Host(`letterfeed.leonmuscat.de`) && PathPrefix(`/api/feeds/`)"
      - "traefik.http.routers.frontend-public.priority=10"
      - "traefik.http.routers.frontend-public.entrypoints=websecure"
      - "traefik.http.routers.frontend-public.tls.certresolver=myresolver"

      # --- Router for Secure Frontend (With Basic Auth) ---
      - "traefik.http.routers.frontend-secure.rule=Host(`letterfeed.leonmuscat.de`)"
      - "traefik.http.routers.frontend-secure.priority=5"
      - "traefik.http.routers.frontend-secure.entrypoints=websecure"
      - "traefik.http.routers.frontend-secure.tls.certresolver=myresolver"
      - "traefik.http.routers.frontend-secure.middlewares=frontend-auth@docker"
      - "traefik.http.middlewares.frontend-auth.basicauth.users=test:$apr1$ruV6b18i$9J0V2yJ94jL0g08xJ2Q0Q/"

    networks:
      - letterfeed_network
      - traefik_web

networks:
  traefik_web:
    external: true
```

## Development

To run the application in development mode:

```bash
make dev
# or to run the dev container
make docker-dev-up
```

To install dependencies:

```bash
make install
```

To run tests:

```bash
make test
```

To lint the code:

```bash
make lint
```
