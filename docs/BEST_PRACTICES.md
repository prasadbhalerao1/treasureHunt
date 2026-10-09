# 📖 Software Engineering Best Practices Encyclopedia

> A comprehensive reference guide for writing scalable, maintainable, and production-ready code.

**Author**: Prasad Bhalerao  
**Last Updated**: February 2026

---

## 📑 Table of Contents

1. [System Design Principles](#-1-system-design-principles)
2. [Code Organization & Architecture](#-2-code-organization--architecture)
3. [API Design](#-3-api-design)
4. [Database Design](#-4-database-design)
5. [Security Best Practices](#-5-security-best-practices)
6. [Authentication & Authorization](#-6-authentication--authorization)
7. [Error Handling & Logging](#-7-error-handling--logging)
8. [Testing Strategies](#-8-testing-strategies)
9. [Performance Optimization](#-9-performance-optimization)
10. [Git & Version Control](#-10-git--version-control)
11. [Documentation Standards](#-11-documentation-standards)
12. [DevOps & CI/CD](#-12-devops--cicd)
13. [Frontend Best Practices](#-13-frontend-best-practices)
14. [Node.js/Express Specific](#-14-nodejsexpress-specific)
15. [React Specific](#-15-react-specific)
16. [MongoDB Specific](#-16-mongodb-specific)

---

# 🏗️ 1. System Design Principles

## SOLID Principles

| Principle                 | Meaning                                     | Example                               |
| :------------------------ | :------------------------------------------ | :------------------------------------ |
| **S**ingle Responsibility | One class/function = one job                | `authController.js` only handles auth |
| **O**pen/Closed           | Open for extension, closed for modification | Use middleware, not if-else chains    |
| **L**iskov Substitution   | Subtypes must be substitutable              | Any player type can call `scan()`     |
| **I**nterface Segregation | Don't force unused methods                  | Separate `IReader` and `IWriter`      |
| **D**ependency Inversion  | Depend on abstractions                      | Inject DB connection, don't hardcode  |

## DRY, KISS, YAGNI

```
DRY  = Don't Repeat Yourself     → Extract common code into functions
KISS = Keep It Simple, Stupid    → Avoid over-engineering
YAGNI = You Aren't Gonna Need It → Don't build features "just in case"
```

## Separation of Concerns

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Controller  │ ──▶ │   Service    │ ──▶ │    Model     │
│  (HTTP I/O)  │     │  (Business)  │     │  (Database)  │
└──────────────┘     └──────────────┘     └──────────────┘

Controllers = Handle requests, validate input, return responses
Services    = Business logic, orchestration
Models      = Data access, schema definitions
```

## Scalability Patterns

| Pattern                | When to Use      | Example                                        |
| :--------------------- | :--------------- | :--------------------------------------------- |
| **Horizontal Scaling** | High traffic     | Multiple server instances behind load balancer |
| **Vertical Scaling**   | CPU-bound tasks  | Upgrade server specs                           |
| **Caching**            | Repeated reads   | Redis for session data                         |
| **Message Queues**     | Async tasks      | RabbitMQ for email sending                     |
| **Database Sharding**  | Massive datasets | Split by region/user ID                        |

---

# 📁 2. Code Organization & Architecture

## Folder Structure (Backend)

```
Backend/
├── config/           # Environment, DB connection, constants
├── controllers/      # Request handlers (thin, delegates to services)
├── services/         # Business logic (testable, reusable)
├── models/           # Database schemas
├── middleware/       # Auth guards, rate limiters, validators
├── routes/           # API route definitions
├── utils/            # Pure helper functions
├── scripts/          # CLI tools, seeders, migrations
├── tests/            # Test files (mirror src structure)
└── index.js          # Entry point
```

## Folder Structure (Frontend - React)

```
Frontend/
├── src/
│   ├── components/   # Reusable UI components
│   │   ├── ui/       # Primitives (Button, Input, Card)
│   │   └── domain/   # Feature-specific (TeamCard, Scanner)
│   ├── pages/        # Route-level components
│   ├── context/      # React Context providers
│   ├── hooks/        # Custom hooks
│   ├── utils/        # Helper functions
│   ├── api/          # API client and endpoints
│   └── styles/       # Global CSS, design tokens
└── public/           # Static assets
```

## Naming Conventions

| Type          | Convention  | Example             |
| :------------ | :---------- | :------------------ |
| Files (JS)    | camelCase   | `authController.js` |
| Files (React) | PascalCase  | `Dashboard.jsx`     |
| Functions     | camelCase   | `validateToken()`   |
| Constants     | UPPER_SNAKE | `MAX_DEVICES = 4`   |
| Classes       | PascalCase  | `class TeamService` |
| CSS Classes   | kebab-case  | `primary-button`    |
| Environment   | UPPER_SNAKE | `MONGODB_URI`       |

---

# 🔌 3. API Design

## RESTful Conventions

| Action         | Method   | Route            | Body              |
| :------------- | :------- | :--------------- | :---------------- |
| List all       | `GET`    | `/api/teams`     | -                 |
| Get one        | `GET`    | `/api/teams/:id` | -                 |
| Create         | `POST`   | `/api/teams`     | `{ name, email }` |
| Update         | `PUT`    | `/api/teams/:id` | `{ name }`        |
| Partial update | `PATCH`  | `/api/teams/:id` | `{ status }`      |
| Delete         | `DELETE` | `/api/teams/:id` | -                 |

## Response Structure

```javascript
// Success
{
  "success": true,
  "data": { /* payload */ },
  "message": "Team created successfully"
}

// Error
{
  "success": false,
  "error": {
    "code": "TEAM_NOT_FOUND",
    "message": "No team found with ID: ABC123"
  }
}
```

## HTTP Status Codes

| Code  | Meaning           | When to Use                |
| :---- | :---------------- | :------------------------- |
| `200` | OK                | Successful GET, PUT, PATCH |
| `201` | Created           | Successful POST            |
| `204` | No Content        | Successful DELETE          |
| `400` | Bad Request       | Validation error           |
| `401` | Unauthorized      | Missing/invalid token      |
| `403` | Forbidden         | Valid token, no permission |
| `404` | Not Found         | Resource doesn't exist     |
| `409` | Conflict          | Duplicate entry            |
| `429` | Too Many Requests | Rate limit exceeded        |
| `500` | Server Error      | Unexpected backend error   |

## API Versioning

```javascript
// URL-based (recommended for public APIs)
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);

// Header-based (cleaner URLs)
req.headers["api-version"];
```

---

# 🗄️ 4. Database Design

## Schema Design Principles

| Principle                                 | Description                       |
| :---------------------------------------- | :-------------------------------- |
| **Normalize** when data integrity matters | Split into related tables         |
| **Denormalize** when read speed matters   | Embed data for fewer queries      |
| **Index** frequently queried fields       | `{ teamId: 1 }` in MongoDB        |
| **Avoid** N+1 queries                     | Use `.populate()` or aggregations |

## MongoDB Best Practices

```javascript
// ✅ Good: Index frequently queried fields
teamSchema.index({ teamId: 1 }, { unique: true });
teamSchema.index({ currentLevel: 1, gameStatus: 1 });

// ✅ Good: Use lean() for read-only queries
const teams = await Team.find().lean();

// ❌ Bad: Fetching all fields when you need one
const team = await Team.findById(id);

// ✅ Good: Select only needed fields
const team = await Team.findById(id).select("teamId currentLevel");
```

## Data Modeling Patterns

```javascript
// Embedding (1:Few, read-heavy)
{
  teamId: "Team-1",
  members: [
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" }
  ]
}

// Referencing (1:Many, write-heavy)
{
  teamId: "Team-1",
  memberIds: [ObjectId("..."), ObjectId("...")]
}
```

---

# 🔐 5. Security Best Practices

## The Security Checklist

| Category       | Practice                                               |
| :------------- | :----------------------------------------------------- |
| **Input**      | Validate and sanitize ALL user input                   |
| **Output**     | Escape HTML to prevent XSS                             |
| **Auth**       | Use bcrypt/scrypt for passwords (cost ≥ 10)            |
| **Tokens**     | Short-lived JWTs (15m-1h), refresh tokens for sessions |
| **Headers**    | Use `helmet` middleware                                |
| **HTTPS**      | Always in production, redirect HTTP → HTTPS            |
| **CORS**       | Whitelist specific origins, not `*`                    |
| **Rate Limit** | Prevent brute force attacks                            |
| **Secrets**    | Never commit `.env`, use vault in production           |

## Helmet Configuration

```javascript
const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
```

## Input Validation

```javascript
// ✅ Good: Validate and sanitize
const { body, validationResult } = require("express-validator");

router.post(
  "/teams",
  [
    body("email").isEmail().normalizeEmail(),
    body("name").trim().escape().isLength({ min: 2, max: 50 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ...
  },
);

// ❌ Bad: Trusting user input directly
const team = await Team.create(req.body); // Dangerous!
```

---

# 🎫 6. Authentication & Authorization

## JWT Best Practices

```javascript
// Token structure
{
  "sub": "team-123",          // Subject (user ID)
  "role": "candidate",        // Role for RBAC
  "iat": 1699999999,          // Issued at
  "exp": 1700003599           // Expiry (short-lived)
}

// ✅ Good: Store in httpOnly cookie (prevents XSS)
res.cookie('token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

// ❌ Bad: Store in localStorage (XSS vulnerable)
localStorage.setItem('token', jwt);
```

## Role-Based Access Control (RBAC)

```javascript
// Middleware pattern
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

// Usage
router.get("/admin/stats", authenticate, authorize("admin"), getStats);
router.get(
  "/game/state",
  authenticate,
  authorize("admin", "candidate"),
  getState,
);
```

---

# ⚠️ 7. Error Handling & Logging

## Error Handling Strategy

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Expected error, not a bug
  }
}

// Usage
throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");

// Global error handler (last middleware)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log full error in development, limited in production
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  } else {
    console.error(`[${err.code}] ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.isOperational ? err.message : "Something went wrong",
    },
  });
});
```

## Logging Levels

| Level   | When to Use                    |
| :------ | :----------------------------- |
| `error` | Exceptions, failed operations  |
| `warn`  | Deprecations, retry attempts   |
| `info`  | Request logs, important events |
| `debug` | Detailed debugging info        |

```javascript
// Use a proper logger (winston, pino)
const logger = require("./utils/logger");

logger.info("Server started", { port: 5000 });
logger.error("Database connection failed", { error: err.message });
```

---

# 🧪 8. Testing Strategies

## Testing Pyramid

```
        ┌─────────┐
        │   E2E   │  ← Few (slow, expensive)
        └────┬────┘
       ┌─────┴─────┐
       │Integration│  ← Some (test components together)
       └─────┬─────┘
    ┌────────┴────────┐
    │   Unit Tests    │  ← Many (fast, isolated)
    └─────────────────┘
```

## Unit Test Structure (AAA Pattern)

```javascript
describe("TeamService", () => {
  describe("createTeam", () => {
    it("should create a team with valid data", async () => {
      // Arrange
      const input = { name: "Test Team", email: "test@example.com" };

      // Act
      const result = await TeamService.createTeam(input);

      // Assert
      expect(result.teamId).toBeDefined();
      expect(result.name).toBe("Test Team");
    });

    it("should throw error for duplicate email", async () => {
      // ...
    });
  });
});
```

## What to Test

| Layer           | What to Test                              |
| :-------------- | :---------------------------------------- |
| **Unit**        | Pure functions, business logic, utilities |
| **Integration** | API endpoints, database operations        |
| **E2E**         | Critical user flows (login → play → win)  |

---

# ⚡ 9. Performance Optimization

## Backend Performance

| Technique              | Implementation                       |
| :--------------------- | :----------------------------------- |
| **Caching**            | Redis for sessions, repeated queries |
| **Pagination**         | Limit results: `?page=1&limit=20`    |
| **Compression**        | `app.use(compression())`             |
| **Connection Pooling** | Reuse DB connections                 |
| **Async Operations**   | Don't block event loop               |

```javascript
// ✅ Good: Non-blocking operations
app.post("/teams", async (req, res) => {
  const team = await Team.create(req.body);

  // Fire-and-forget for non-critical tasks
  sendWelcomeEmail(team.email).catch(console.error);

  res.json(team);
});

// ❌ Bad: Blocking the response
app.post("/teams", async (req, res) => {
  const team = await Team.create(req.body);
  await sendWelcomeEmail(team.email); // User waits for email
  res.json(team);
});
```

## Frontend Performance

| Technique              | Implementation               |
| :--------------------- | :--------------------------- |
| **Code Splitting**     | `React.lazy()` for routes    |
| **Image Optimization** | WebP format, lazy loading    |
| **Memoization**        | `useMemo`, `React.memo`      |
| **Bundle Analysis**    | `npm run build -- --analyze` |
| **Lighthouse**         | Score > 90 for all metrics   |

---

# 🌿 10. Git & Version Control

## Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type       | Usage                           |
| :--------- | :------------------------------ |
| `feat`     | New feature                     |
| `fix`      | Bug fix                         |
| `docs`     | Documentation only              |
| `style`    | Formatting, no logic change     |
| `refactor` | Code change, no new feature/fix |
| `test`     | Adding tests                    |
| `chore`    | Build process, dependencies     |

**Examples:**

```
feat(auth): add JWT refresh token support
fix(scanner): resolve camera permission issue on iOS
docs: update API documentation for v2
refactor(game): extract validation to service layer
```

## Branching Strategy

```
main          ─────●─────●─────●─────●──────▶ (production)
                   │     ▲     │     ▲
                   │     │     │     │
develop       ─────●─────●─────●─────●──────▶ (staging)
                   │           │
feature/auth  ─────●───────────┘
                   │
feature/qr    ─────●─────────────────────────▶
```

## .gitignore Essentials

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local

# Build
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/
```

---

# 📝 11. Documentation Standards

## README Template

```markdown
# Project Name

> One-line description

## Features

- Feature 1
- Feature 2

## Quick Start

1. Clone
2. Install
3. Configure
4. Run

## Tech Stack

| Layer    | Technology       |
| :------- | :--------------- |
| Backend  | Node.js, Express |
| Database | MongoDB          |

## API Reference

Link to OpenAPI spec or docs folder

## License

MIT
```

## Code Comments

```javascript
// ✅ Good: Explain WHY, not WHAT
// Skip validation for admin users to allow emergency overrides
if (user.role === 'admin') return true;

// ❌ Bad: States the obvious
// Check if user role is admin
if (user.role === 'admin') return true;

// ✅ Good: Document complex algorithms
/**
 * Generates a deterministic location path for a team.
 * Uses Fisher-Yates shuffle with team-seeded PRNG to ensure
 * the same team always gets the same path.
 *
 * @param {string} teamId - Unique team identifier
 * @param {number} pathLength - Number of locations (default: 6)
 * @returns {string[]} - Array of location IDs
 */
function generatePath(teamId, pathLength = 6) { ... }
```

---

# 🚀 12. DevOps & CI/CD

## CI/CD Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Build   │ ─▶ │   Test   │ ─▶ │  Deploy  │ ─▶ │  Monitor │
│          │    │          │    │ (Staging)│    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                      │
                                      ▼
                               ┌──────────┐
                               │  Deploy  │
                               │  (Prod)  │
                               └──────────┘
```

## GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

## Environment Strategy

| Environment     | Purpose                | Data               |
| :-------------- | :--------------------- | :----------------- |
| **Development** | Local coding           | Fake/seed data     |
| **Staging**     | Pre-production testing | Copy of production |
| **Production**  | Live users             | Real data          |

---

# 🎨 13. Frontend Best Practices

## Component Design

```jsx
// ✅ Good: Single responsibility, props-driven
function TeamCard({ team, onSelect }) {
  return (
    <div className="team-card" onClick={() => onSelect(team.id)}>
      <h3>{team.name}</h3>
      <p>Level: {team.currentLevel}</p>
    </div>
  );
}

// ❌ Bad: Mixed concerns, fetches own data
function TeamCard({ teamId }) {
  const [team, setTeam] = useState(null);
  useEffect(() => {
    fetch(`/api/teams/${teamId}`).then(...);
  }, []);
  // ...
}
```

## State Management Decision Tree

```
Is state needed by multiple components?
├── No  → useState
├── Yes → Is it deeply nested?
│         ├── No  → Prop drilling (2-3 levels max)
│         └── Yes → Context API
└── Is it complex with many actions?
          └── Yes → useReducer + Context (or Redux/Zustand)
```

## CSS Organization

```css
/* Design tokens (variables) */
:root {
  --color-primary: #000;
  --color-accent: #00ff00;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --border-thick: 4px solid var(--color-primary);
}

/* Component-specific */
.team-card {
  border: var(--border-thick);
  padding: var(--spacing-md);
}
```

---

# 🟢 14. Node.js/Express Specific

## Express App Structure

```javascript
// config/express.js - Clean setup
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

module.exports = (app) => {
  // Security
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN }));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  );

  // Body parsing
  app.use(express.json({ limit: "10kb" }));

  // Request logging
  if (process.env.NODE_ENV !== "production") {
    app.use(require("morgan")("dev"));
  }
};
```

## Async Handler Pattern

```javascript
// ✅ Good: Centralized error catching
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get(
  "/teams",
  asyncHandler(async (req, res) => {
    const teams = await Team.find();
    res.json(teams);
  }),
);

// ❌ Bad: Repeated try-catch
router.get("/teams", async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

# ⚛️ 15. React Specific

## Custom Hooks

```jsx
// ✅ Good: Extract reusable logic
function useGameState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get("/game/state");
      setState(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return { state, loading, error, refetch: fetchState };
}

// Usage
function Dashboard() {
  const { state, loading, error, refetch } = useGameState();
  // ...
}
```

## Performance Optimization

```jsx
// Memoize expensive computations
const sortedTeams = useMemo(
  () => teams.sort((a, b) => a.completedAt - b.completedAt),
  [teams],
);

// Memoize callbacks
const handleScan = useCallback((qrData) => {
  api.post("/game/scan", { qr: qrData });
}, []);

// Memoize components
const MemoizedTeamCard = React.memo(TeamCard);
```

---

# 🍃 16. MongoDB Specific

## Connection Best Practices

```javascript
// config/dbConnect.js
const mongoose = require("mongoose");

let isConnected = false;

module.exports = async () => {
  if (isConnected) return;

  const options = {
    maxPoolSize: process.env.NODE_ENV === "production" ? 1 : 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
```

## Schema Best Practices

```javascript
const teamSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: [true, "Team ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Cannot be changed after creation
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
teamSchema.index({ email: 1 });
teamSchema.index({ currentLevel: 1, gameStatus: 1 });

// Pre-save hook
teamSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hashPassword(this.password);
  }
  next();
});
```

---

# 📋 Quick Reference Cheat Sheet

## Must-Do Checklist for Every Project

```
□ .gitignore with node_modules, .env, dist
□ .env.example with placeholder values
□ README.md with setup instructions
□ ESLint + Prettier configured
□ Error handling middleware
□ Input validation on all endpoints
□ Rate limiting enabled
□ CORS properly configured
□ Security headers (helmet)
□ Environment-based config (dev/staging/prod)
```

## Common Mistakes to Avoid

| ❌ Don't                      | ✅ Do                    |
| :---------------------------- | :----------------------- |
| Commit `.env` files           | Use `.env.example`       |
| Store passwords in plain text | Use bcrypt/scrypt        |
| Trust user input              | Validate and sanitize    |
| Use `*` for CORS              | Whitelist origins        |
| Catch errors silently         | Log and handle properly  |
| Nest callbacks deeply         | Use async/await          |
| Put secrets in frontend       | Use backend as proxy     |
| Skip error boundaries         | Wrap critical components |

---

<p align="center">
  <sub>📖 Created by <a href="https://www.linkedin.com/in/prasadbhalerao">Prasad Bhalerao</a></sub>
</p>
