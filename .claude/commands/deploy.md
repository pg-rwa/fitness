# Deploy FitTracker to DigitalOcean

Run a one-step deployment of FitTracker to the DigitalOcean droplet.

## What to do

Execute the one-step deploy script at `deploy/one-step-deploy.sh`. This single script handles the entire deployment pipeline:

1. **Git** — stages, commits, and pushes all pending changes
2. **Backup** — backs up the remote SQLite database before deploying
3. **Sync** — rsyncs project files to the droplet (excludes node_modules, .git, DB, uploads, .env)
4. **Environment** — ensures remote .env exists with correct HTTP_PORT=3080
5. **Build** — builds all Docker images (API, frontend, admin) in parallel on the droplet
6. **Migrate** — runs database migrations
7. **Deploy** — starts services via docker-compose.prod.yml with Nginx reverse proxy
8. **Verify** — health-checks the API, frontend, and admin panel

## How to run it

```bash
bash deploy/one-step-deploy.sh
```

### Options the user may request

If the user says **"skip git"** or **"don't commit"**:
```bash
bash deploy/one-step-deploy.sh --skip-git
```

If the user says **"full rebuild"** or **"no cache"**:
```bash
bash deploy/one-step-deploy.sh --rebuild
```

If the user says **"show logs"**:
```bash
bash deploy/one-step-deploy.sh --logs
```

If the user says **"dry run"** or **"just check"**:
```bash
bash deploy/one-step-deploy.sh --dry-run
```

These flags can be combined: `bash deploy/one-step-deploy.sh --skip-git --rebuild --logs`

## Configuration

- **Droplet:** root@64.227.187.54
- **Port:** 3080
- **Remote path:** /opt/fittracker
- **Compose file:** docker-compose.prod.yml

Override via env vars: `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_DIR`, `DEPLOY_BRANCH`

## After deployment

Show the user these URLs:
- **App:** http://64.227.187.54:3080/
- **API:** http://64.227.187.54:3080/api/health
- **Admin:** http://64.227.187.54:3080/admin/

## Troubleshooting

If the deploy fails, run with `--logs` to see service output. Common issues:
- SSH connection refused → check SSH keys and droplet firewall
- Build fails → try `--rebuild` for a clean build
- Health check timeout → API may need more time; check with `ssh root@64.227.187.54 "cd /opt/fittracker && docker compose -f docker-compose.prod.yml logs api --tail 50"`
