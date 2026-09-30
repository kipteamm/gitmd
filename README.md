
# gitmd

A selfhosted, simple password protected, web-interface for git-backed markdown editing. Connect to your own repository and edit in the browser with realtime previews. Has built in Latex and syntax highlighting support.

## Deployment

To deploy this project you should use docker. A recommended `docker-compose.yml` setup

```yml
services:
  gitmd:
    image: <your-dockerhub-username>/gitmd:latest
    container_name: gitmd
    restart: unless-stopped
    ports:
      # Bind to localhost only so external traffic must go through the reverse proxy
      - "127.0.0.1:5000:5000"
    volumes:
      - ./docs:/docs
      - ./data:/data
    environment:
      - GITMD_DATA_DIR=/data
      - GITMD_DOCS_DIR=/docs
      - FLASK_ENV=production
```

Use `docker compose up -d` to serve the gitmd interface.

