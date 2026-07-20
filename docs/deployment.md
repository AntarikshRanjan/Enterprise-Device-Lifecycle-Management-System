# AssetFlow - Production Build & Deployment Guide

This guide details the containerization architecture, production build pipeline, and deployment instructions for the **AssetFlow** Enterprise Device Lifecycle Management System.

---

## 1. Containerization Architecture

AssetFlow uses a multi-stage Docker container build pipeline to ensure optimized lightweight images:

- **Express backend**: Prepares TypeScript environments, runs compilation builds (`dist`), copies assets, and executes `npx prisma generate` client compilation inside the target production image container.
- **Vite React frontend**: Compiles production assets bundle and deploys files on Nginx server routing configurations supporting React SPA history fallbacks.
- **Docker Compose**: Unites client and API services behind a shared networking stack.

---

## 2. Prerequisites

Ensure the deployment server has:
- **Docker Engine** (v20.10+)
- **Docker Compose** (v2.0+)
- **PostgreSQL Database** (Neon Serverless PostgreSQL or local dedicated instance)

---

## 3. Environment Setup

Create a `.env` configuration file in the project root:

```env
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"
JWT_SECRET="generate-a-secure-random-64-character-jwt-key"
```

---

## 4. Run Services with Docker Compose

To build and run all services in detached mode:

```bash
# Build and run containers
docker-compose up --build -d

# Verify container statuses
docker-compose ps
```

Services will be exposed at:
- **Frontend Panel**: `http://localhost:80`
- **Backend API**: `http://localhost:3000`

---

## 5. Database Setup (Migrations & Seeding)

Run Prisma migrations and seeds inside the backend container to prepare database structures:

```bash
# Apply migrations to database
docker-compose exec backend npx prisma migrate deploy

# Run db seed to bootstrap default roles, departments, categories, and admins
docker-compose exec backend npm run db:seed
```

---

## 6. Maintenance & Logs

To inspect runtime container logs:

```bash
# Monitor logs for all services
docker-compose logs -f

# Backend specific logs
docker-compose logs -f backend
```
