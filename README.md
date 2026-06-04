# ABAC System

Attribute-Based Access Control (ABAC) system developed as a demonstration of fine-grained authorization using user, resource, and contextual attributes.

The application provides a complete authorization workflow including authentication, policy evaluation, access decisions, and resource protection.

---

## Overview

Unlike traditional Role-Based Access Control (RBAC), this system evaluates access requests using multiple attributes:

- User attributes
  - Role
  - Department
  - Account status

- Resource attributes
  - Department ownership
  - Sensitivity level

- Context attributes
  - Time of access
  - Day of week
  - Network location (internal/external)

The authorization engine evaluates policies and returns either:

- Permit
- Deny

based on matching policy conditions.

---

## Architecture

```text
Frontend (React + Vite)
        │
        ▼
Backend API (Express.js)
        │
        ▼
Authentication (JWT)
        │
        ▼
ABAC Policy Engine
        │
        ▼
Policy Evaluation
        │
        ▼
Access Decision
```

---

## Features

### Authentication

- JWT-based login
- User validation
- Suspended account detection

### Authorization

- Attribute-Based Access Control
- Permit and deny policies
- Policy priority evaluation
- Context-aware authorization

### Resource Protection

Protected resources can only be accessed if the policy engine returns a permit decision.

### Context Awareness

Access decisions depend on:

- Working hours vs off-hours
- Weekday vs weekend
- Internal vs external network

### User Interface

Interactive frontend for:

- Selecting test users
- Selecting resources
- Simulating network locations
- Viewing authorization decisions
- Viewing access history

---

## Technology Stack

### Frontend

- React
- Vite
- Axios

### Backend

- Node.js
- Express.js
- JWT
- CORS
- dotenv

---

## Project Structure

```text
abac-system
│
├── frontend
│   ├── src
│   ├── public
│   └── vite.config.js
│
├── backend
│   ├── data
│   │   ├── users.json
│   │   └── resources.json
│   │
│   ├── policies
│   │   └── policies.json
│   │
│   ├── engine
│   │   └── policyEngine.js
│   │
│   ├── routes
│   ├── middleware
│   └── server.js
│
└── README.md
```

---

## Installation

### Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/abac-system.git
cd abac-system
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Server starts on:

```text
http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on:

```text
http://localhost:5173
```

---

## Environment Variables

Create:

```text
backend/.env
```

Example:

```env
JWT_SECRET=your_secret_key
```

---

## Sample Test Users

| User | Role | Department |
|--------|--------|--------|
| ana.admin | Admin | IT |
| marko.manager | Manager | Finance |
| jana.user | User | HR |
| petar.suspended | User | IT |

---

## Authorization Flow

1. User logs in.
2. JWT token is generated.
3. Protected resource is requested.
4. User, resource and context attributes are collected.
5. Policy engine evaluates all policies.
6. Final decision is returned.
7. Resource is either granted or denied.

---

## Educational Purpose

This project was developed as an academic demonstration of Attribute-Based Access Control concepts, policy evaluation, and fine-grained authorization mechanisms.