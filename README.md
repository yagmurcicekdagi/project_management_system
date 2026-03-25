# Project Management System

A full-stack project management application with role-based access control, and team assignment features.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run with Docker](#run-with-docker)
  - [Run Locally](#run-locally)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Database Schema](#database-schema)

## Screenshots 

<img width="3392" height="1686" alt="image" src="https://github.com/user-attachments/assets/e619ee2e-25d0-4617-a063-f7acec027bf4" />
<img width="3392" height="1686" alt="image" src="https://github.com/user-attachments/assets/b138c7bb-ac90-4a85-a866-107019fb017e" />
<img width="3348" height="1684" alt="image" src="https://github.com/user-attachments/assets/d6d9a3f2-9c43-4fd9-9730-622cd097dfe7" />

## Tech Stack

**Backend:**

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Runtime |
| Spring Boot | 4.0.2 | Application framework |
| Spring Security | - | Authentication & authorization |
| Spring Data JPA | - | ORM / data access |
| Flyway | - | Database migrations |
| PostgreSQL | 16 | Database |
| jjwt | 0.11.5 | JWT token handling |
| Lombok | - | Boilerplate reduction |

**Frontend:**

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 5.2 | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling |
| Radix UI | - | Accessible UI primitives |
| TanStack Query | 5 | Server state management |
| Zustand | - | Client state management |
| React Hook Form + Zod | - | Form handling & validation |
| dnd-kit | - | Drag-and-drop |
| Axios | - | HTTP client |

**Infrastructure:**

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| nginx | Frontend static file serving & reverse proxy |

## Features

- **Authentication** — JWT-based auth with secure HttpOnly refresh token cookies
- **Role-Based Access Control** — Manager and User roles with different permissions
- **Project Management** — Create, update, delete projects with status tracking (New, In Progress, Completed)
- **Kanban Board** — Drag-and-drop project cards between status columns
- **Employee Management** — Managers can create, update, and delete employee records
- **Team Assignments** — Assign employees to projects, view team members per project
- **Manager Seeder** — Automatically seeds a manager account on first startup

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

Or for local development:

- Java 21
- Node.js 20+
- PostgreSQL 16
- Maven (or use the included wrapper `./mvnw`)

### Run with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd project_management_system

# 2. Create your environment file
cp .env.example .env
# Edit .env and fill in DB_USER, DB_PASS, JWT_SECRET

# 3. Start everything
docker-compose up --build

# App available at http://localhost:3000
# Login with the seeded manager account (default: manager@company.com / manager123)
```
### Run Locally

```bash
# 1. Create and configure .env
cp .env.example .env

# 2. Start the backend
./mvnw spring-boot:run

# 3. Start the frontend (in another terminal)
cd frontend
npm install
npm run dev

# Backend at http://localhost:8080
# Frontend at http://localhost:5173
```

> **Note:** On first startup, a manager account is automatically seeded. You can log in with the credentials defined in `APP_SEED_MANAGER_EMAIL` and `APP_SEED_MANAGER_PASSWORD` (default: `manager@company.com` / `manager123`).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_URL` | Yes | — | PostgreSQL JDBC URL |
| `DB_USER` | Yes | — | Database username |
| `DB_PASS` | Yes | — | Database password |
| `JWT_SECRET` | Yes | — | JWT signing key (min 32 chars) |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `JWT_EXPIRATION_MS` | No | `3600000` | Access token TTL (1 hour) |
| `JWT_REFRESH_EXPIRATION_MS` | No | `604800000` | Refresh token TTL (7 days) |
| `COOKIE_SECURE` | No | `true` | Secure flag on cookies (set `false` for HTTP) |
| `APP_SEED_MANAGER_EMAIL` | No | `manager@company.com` | Seeded manager email |
| `APP_SEED_MANAGER_PASSWORD` | No | `manager123` | Seeded manager password |

## API Reference

Base URL: `/api/v1`

All endpoints require `Authorization: Bearer <token>` header unless marked as Public.

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a new account (email must match an existing employee) |
| `POST` | `/api/v1/auth/login` | Public | Login and receive JWT + refresh token cookie |
| `POST` | `/api/v1/auth/refresh` | Public (cookie) | Refresh access token using `refresh_token` cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke refresh token and clear cookie |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Change account password |

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects` | Manager | Create a new project |
| `GET` | `/api/v1/projects` | Authenticated | List projects (paginated). Managers see all; Users see assigned only |
| `GET` | `/api/v1/projects/{id}` | Authenticated | Get project by ID. Users can only access assigned projects |
| `PATCH` | `/api/v1/projects/{id}` | Authenticated | Update project. Users can only update assigned projects |
| `DELETE` | `/api/v1/projects/{id}` | Manager | Delete a project |

### Employees

All employee endpoints require **Manager** role.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/employees` | Manager | Create a new employee |
| `GET` | `/api/v1/employees` | Manager | List employees (paginated, searchable) |
| `GET` | `/api/v1/employees/{id}` | Manager | Get employee by ID |
| `PATCH` | `/api/v1/employees/{id}` | Manager | Update employee name |
| `DELETE` | `/api/v1/employees/{id}` | Manager | Delete an employee |

### Project Assignments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/assignments` | Manager | Assign an employee to a project |
| `GET` | `/api/v1/projects/{projectId}/assignments` | Authenticated | List assigned employees. Users can only view if assigned |
| `DELETE` | `/api/v1/projects/{projectId}/assignments/{employeeId}` | Manager | Remove an employee from a project |
| `DELETE` | `/api/v1/projects/{projectId}/assignments` | Manager | Remove all employees from a project |

### Error Responses

All errors follow this format:

| Field | Type | Description |
|---|---|---|
| `status` | number | HTTP status code |
| `error` | string | Error type |
| `message` | string | Human-readable message |
| `path` | string | Requested path |

| Status | Description |
|---|---|
| `400` | Validation error (field-level errors returned as a list) |
| `401` | Missing or invalid authentication |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |

## Testing

The backend includes unit and slice tests using JUnit 5, Mockito, and Spring's MockMvc.

```bash
# Run all tests
./mvnw test

# Run a specific test class
./mvnw test -Dtest="AuthControllerTest"
```

| Layer | Test Class | Type | Description |
|---|---|---|---|
| Controller | `AuthControllerTest` | `@WebMvcTest` | Auth endpoints — login, register, logout, refresh, change password |
| Controller | `EmployeeControllerTest` | `@WebMvcTest` | Employee CRUD and role-based access control |
| Controller | `ProjectControllerTest` | `@WebMvcTest` | Project CRUD and permission checks |
| Controller | `ProjectAssignmentControllerTest` | `@WebMvcTest` | Assignment creation, listing, and deletion |
| Service | `EmployeeServiceTest` | `@ExtendWith(Mockito)` | Employee service logic with mocked repository |
| Service | `ProjectServiceTest` | `@ExtendWith(Mockito)` | Project service logic including patch and status defaults |
| Service | `ProjectAssignmentServiceTest` | `@ExtendWith(Mockito)` | Assignment service logic and validation |

## Database Schema

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users        │       │    employees      │       │    projects       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id               │◄──┐   │ id               │   ┌──►│ id               │
│ email            │   ├───│ user_id (FK)     │   │   │ name             │
│ password_hash    │   │   │ first_name       │   │   │ description      │
│ role             │   │   │ last_name        │   │   │ status           │
└──────────────────┘   │   │ email            │   │   │ start_date       │
                       │   └────────┬─────────┘   │   │ end_date         │
┌──────────────────┐   │            │             │   │ created_at       │
│  refresh_tokens   │   │            │             │   │ updated_at       │
├──────────────────┤   │            │             │   └──────────────────┘
│ id               │   │            │             │
│ token            │   │   ┌────────┴─────────────┴───┐
│ user_id (FK)     │───┘   │   project_assignments     │
│ expires_at       │       ├──────────────────────────┤
│ revoked          │       │ id                        │
└──────────────────┘       │ project_id (FK)           │
                           │ employee_id (FK)          │
                           │ assigned_at               │
                           └──────────────────────────┘
```

**Roles:** `MANAGER` (full access) | `USER` (limited to assigned projects)

**Project Statuses:** `NEW` | `IN_PROGRESS` | `COMPLETED`
