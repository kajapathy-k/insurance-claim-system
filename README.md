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

## Run Locally using Docker Compose (Recommended)

The easiest way to run the entire system is using Docker Compose. This will automatically spin up PostgreSQL, the four backend microservices, and the frontend.

1.  Make sure you have [Docker](https://docs.docker.com/get-docker/) installed.
2.  From the project root, run:
    ```bash
    docker compose up --build -d
    ```

3.  The services will be available at:
    *   **Frontend**: http://localhost:5173
    *   **User & Policy Service**: http://localhost:8001/docs
    *   **Claim Service**: http://localhost:8002/docs
    *   **Claim Processing Service**: http://localhost:8003/docs
    *   **Notification Service**: http://localhost:8004/docs

## Run Backend Manually

If you prefer to run services manually, ensure PostgreSQL is running and update the `.env` files in each service directory.

```text
postgresql://postgres:postgres@localhost:5432/insurance_claims
```

Tables are created automatically when the services start.

## Basic Usage Flow

1.  Start the application via Docker Compose.
2.  Open the frontend at `http://localhost:5173`.
3.  Use **Create Policy** to create a user and policy.
4.  Use **Submit Claim** to submit a claim for that policy.
5.  Use **View Claims** to approve or reject claims.

