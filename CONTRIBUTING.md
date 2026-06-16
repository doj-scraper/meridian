# Contributing to Meridian

Welcome! Thank you for contributing to Meridian. Follow this guide to set up your local development environment and make contributions.

---

## Development Setup

### 1. Prerequisites
Ensure you have installed:
- [Bun](https://bun.sh) (v1.0.0 or higher)
- SQLite3 or PostgreSQL database service

### 2. Setup Repository
Clone the repository and install dependencies:
```bash
git clone https://github.com/doj-scraper/meridian.git
cd meridian
bun install
```

### 3. Initialize Database
Sync the Prisma schema with your local SQLite database:
```bash
bun run db:generate
bun run db:push
```

### 4. Run Development Server
Start the development server:
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Testing

Meridian uses **Vitest** for testing. All unit and integration tests run sequentially to prevent SQLite transaction lock contention.

### Run Tests Once
```bash
bun run test
```

### Run Tests in Watch Mode
```bash
bun run test:watch
```

---

## Code Quality Standards

* **TypeScript Strictness**: Type safety is strictly enforced. Avoid `any` when possible and configure proper interfaces.
* **Linting**: Run `bun run lint` before committing to verify your code follows ESLint flat config styles.
* **Testing**: Write comprehensive unit or integration tests for all new modules or bug fixes.
