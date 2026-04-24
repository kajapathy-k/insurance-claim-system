# Smart Insurance Claim Management System

A simple full-stack insurance claim management application built with FastAPI microservices, PostgreSQL, React, and Tailwind CSS.

## Project Structure

```text
services/
  user-policy-service/
  claim-service/
  claim-processing-service/
  notification-service/
frontend/
```

## Backend Services

Each FastAPI service runs independently and exposes Swagger docs at `/docs`.

| Service | Port | Main APIs |
| --- | --- | --- |
| User & Policy Service | 8001 | `POST /users`, `POST /policies`, `GET /policies` |
| Claim Service | 8002 | `POST /claims`, `GET /claims`, `GET /claims/{id}` |
| Claim Processing Service | 8003 | `PUT /claims/{id}/approve`, `PUT /claims/{id}/reject` |
| Notification Service | 8004 | `POST /notifications`, `GET /notifications` |

## Database

Use a PostgreSQL database that is reachable from your machine. If your database runs on EC2, point each service to that host.

Each service reads `DATABASE_URL` from the environment. Example:

```text
postgresql://<db_user>:<db_password>@3.110.88.249:5432/<db_name>
```

Tables are created automatically when the services start.

## Run Backend Locally

Open four terminals from the project root.

### 1. User & Policy Service

```bash
cd services/user-policy-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your actual PostgreSQL host, username, password, and database name
uvicorn main:app --reload --port 8001
```

### 2. Claim Service

```bash
cd services/claim-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your actual PostgreSQL host, username, password, and database name
uvicorn main:app --reload --port 8002
```

### 3. Claim Processing Service

```bash
cd services/claim-processing-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your actual PostgreSQL host, username, password, and database name
uvicorn main:app --reload --port 8003
```

### 4. Notification Service

```bash
cd services/notification-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8004
```

Swagger docs:

```text
http://localhost:8001/docs
http://localhost:8002/docs
http://localhost:8003/docs
http://localhost:8004/docs
```

## Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The React app runs at:

```text
http://localhost:5173
```

## Basic Usage Flow

1. Start PostgreSQL.
2. Start all four backend services.
3. Start the frontend.
4. Use **Create Policy** to create a user and policy.
5. Use **Submit Claim** to submit a claim for that policy.
6. Use **View Claims** to approve or reject claims.
