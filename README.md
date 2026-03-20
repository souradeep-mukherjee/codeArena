# CodeArena

A secure coding workspace with a LeetCode-style UI, Docker-isolated execution, and password-based authentication.

## Stack

- Backend: Node.js, Express, TypeScript, PostgreSQL
- Frontend: React, Vite, Monaco Editor, React Router
- Execution: Docker (`python:3.9`, `node:18`, `gcc:12`)
- Auth: JWT (`httpOnly` cookie)

## Core Features

- Sign up with full name, email, phone, password, confirm password
- Log in with email + password
- Authenticated coding workspace (`/app`)
- Monaco editor with language switcher:
  - `python`
  - `javascript`
  - `c`
  - `cpp`
- Secure code execution in Docker with CPU/memory/pid/network/time limits
- Built-in LeetCode problem bank and sample test cases
- User-scoped submissions history

## Security Model

Execution is never performed directly on the host.

Each run is sandboxed with:

- `--network none`
- `--read-only`
- `--tmpfs /tmp:rw,noexec,nosuid,size=64m`
- `--tmpfs /workspace:rw,exec,nosuid,nodev,size=64m`
- `--cap-drop ALL`
- `--security-opt no-new-privileges`
- `--pids-limit 64`
- CPU limit (`--cpus`)
- Memory limit (`--memory`)
- backend timeout kill (default `4000ms`)
- output cap and payload size validation

## Project Structure

```text
backend/
├── controllers/
├── middleware/
├── routes/
├── services/
├── utils/
└── src/

frontend/
├── components/
├── pages/
├── services/
└── src/
```

## Prerequisites

- Node.js 18+
- npm
- Docker Engine / Docker Desktop running
- Docker Compose v2

## Local Setup

### 1) Enter the project

```bash
cd codeArena
```

### 2) Pull runtime images (one-time)

```bash
docker pull python:3.9
docker pull node:18
docker pull gcc:12
docker pull postgres:16-alpine
```

### 3) Start PostgreSQL (required)

```bash
docker compose up -d postgres
```

The backend now requires DB connectivity at startup.

### 4) Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env`:

```env
PORT=4000
EXECUTION_TIMEOUT_MS=4000
MAX_CODE_SIZE=20000
MAX_STDIN_SIZE=5000
MAX_OUTPUT_SIZE=20000
DOCKER_MEMORY_LIMIT=128m
DOCKER_CPU_LIMIT=0.5
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code_exec
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
AUTH_TOKEN_TTL_HOURS=24
```

Notes:

- In production, set `COOKIE_SECURE=true` and provide a strong `JWT_SECRET`.
- `FRONTEND_ORIGIN` supports a comma-separated allowlist.

### 5) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 6) Run backend (terminal 1)

```bash
cd backend
npm run dev
```

Backend URL: `http://localhost:4000`

### 7) Run frontend (terminal 2)

```bash
cd frontend
npm run dev
```

Frontend URL: `http://localhost:5173`

## Frontend Routes

- `/login` public
- `/signup` public
- `/app` authenticated workspace

Route guards:

- unauthenticated users visiting `/app` are redirected to `/login`
- authenticated users visiting `/login` or `/signup` are redirected to `/app`

## API

Base URL: `http://localhost:4000`

### Public Endpoints

#### `GET /health`

Returns service status and runtime checks.

#### `GET /problems`

Returns the built-in problem bank (currently ~20+ questions with test cases).

### Auth Endpoints

#### `POST /auth/signup`

Request:

```json
{
  "fullName": "Jane Developer",
  "email": "jane@example.com",
  "phone": "+14155552671",
  "password": "Str0ng!Pass",
  "confirmPassword": "Str0ng!Pass"
}
```

Validation rules:

- `fullName`: 2-100 chars
- `email`: valid format, normalized lowercase
- `phone`: normalized and validated to E.164
- `password`: 8-72 chars, uppercase, lowercase, digit, special char
- `confirmPassword`: must match `password`

Response: `201` with `user` and auth cookie.

#### `POST /auth/login`

Request:

```json
{
  "email": "jane@example.com",
  "password": "Str0ng!Pass"
}
```

Response: `200` with `user` and auth cookie.

#### `GET /auth/me`

Requires auth cookie. Returns current user.

#### `POST /auth/logout`

Clears auth cookie.

#### `PATCH /auth/account`

Requires auth cookie.

Request:

```json
{
  "currentPassword": "Str0ng!Pass",
  "email": "new-email@example.com",
  "newPassword": "N3wStr0ng!Pass",
  "confirmNewPassword": "N3wStr0ng!Pass"
}
```

Rules:

- `currentPassword` is required for all account updates.
- `email` is optional; when provided it must be valid and unique.
- `newPassword` is optional; if provided, `confirmNewPassword` is required and must match.

### Protected Endpoints

Protected via JWT cookie (`httpOnly`, `sameSite=lax`, TTL from `AUTH_TOKEN_TTL_HOURS`).

#### `POST /execute`

Request:

```json
{
  "language": "cpp",
  "code": "#include <iostream>\nint main(){std::cout << \"Hello C++\\n\"; return 0;}",
  "stdin": ""
}
```

Supported languages:

- `python`
- `javascript`
- `c`
- `cpp`

Response:

```json
{
  "stdout": "Hello C++\n",
  "stderr": "",
  "status": "success",
  "executionTimeMs": 130,
  "truncated": false
}
```

Status values:

- `success`
- `runtime_error`
- `timeout`
- `output_limit_exceeded`
- `internal_error`
- `validation_error`

#### `GET /submissions?page=1&limit=20`

Returns only the authenticated user’s submissions, newest first.

## Curl Flow Example (Cookie Auth)

```bash
# 1) Signup (stores cookie)
curl -i -c cookie.txt -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Developer",
    "email": "jane@example.com",
    "phone": "+14155552671",
    "password": "Str0ng!Pass",
    "confirmPassword": "Str0ng!Pass"
  }'

# 2) Execute with auth cookie
curl -i -b cookie.txt -X POST http://localhost:4000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(input())",
    "stdin": "hello"
  }'

# 3) Fetch submission history
curl -i -b cookie.txt "http://localhost:4000/submissions?page=1&limit=10"
```

## Build Checks

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Troubleshooting

- Backend fails at startup with DB error: ensure `docker compose up -d postgres` is running and `DATABASE_URL` is correct.
- `401 Authentication required`: log in again and ensure frontend uses `credentials: 'include'`.
- Docker execution errors: verify Docker daemon is running and required images were pulled.
