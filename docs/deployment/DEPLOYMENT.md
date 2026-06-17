# Meridian Deployment Guide

## Prerequisites
- Docker 24+
- PostgreSQL 16+ (Optional, SQLite is supported by default)
- 2GB RAM minimum
- Valid API keys for AI providers (e.g., Gemini API key)

---

## Production Deployment with Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/doj-scraper/meridian.git
cd meridian
```

### 2. Configure Environment
Create a production `.env` file from the example template:
```bash
cp .env.example .env
# Edit .env and supply your API keys and NextAuth configurations
```

Make sure the following variables are configured:
* `DATABASE_URL`: Set to `"file:./db/custom.db"` for SQLite, or your PostgreSQL connection string.
* `Z_AI_API_KEY`: Your Gemini/Google AI SDK key.
* `NEXTAUTH_SECRET`: A secure random string for authentication signing.
* `NEXTAUTH_URL`: The public URL of your application (e.g., `http://localhost:3000` or `https://your-domain.com`).

### 3. Run with Docker Compose
The application is fully containerized. Start the container in detached mode:
```bash
docker-compose up -d --build
```

### 4. Verify Health
Ensure that the application and database connection are healthy:
```bash
curl http://localhost:3000/api/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-16T14:00:00.000Z",
  "uptime": 12.34,
  "database": "connected"
}
```

---

## Troubleshooting

### Build Memory / OOM Issues
The production build runs with Webpack bundler to optimize memory footprint under physical resource limits. If compilation hangs or exits with code 143:
1. Ensure no heavy test tasks or dev servers are running concurrently on the build host.
2. In `package.json`, adjust `--max-old-space-size=1536` to a lower value (e.g., `1024`) if physical RAM is below 2GB.
