# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Vincent Scaffold SDK** monorepo for building blockchain tools and policies that execute on **Lit Actions** - a blockchain-based execution environment with strict Node.js constraints.

## Essential Commands

### Development Workflow

```bash
npm run vincent:hardreset         # Reset all state and rebuild
npm run vincent:build              # Build all tools and policies
npm run vincent:e2e:reset         # Reset E2E test state only
npm run vincent:e2e               # Run native transfer E2E tests
npm run vincent:e2e:erc20         # Run ERC-20 transfer E2E tests
```

### Package Operations (from component directory)

```bash
cd vincent-packages/tools/<tool-name>    # Navigate to specific tool
npm run build                           # Build the tool

cd vincent-packages/policies/<policy-name>  # Navigate to specific policy
npm run build                           # Build the policy
```

### Project Management

```bash
npx @lit-protocol/vincent-scaffold-sdk init
npx @lit-protocol/vincent-scaffold-sdk add tool <path>/<name>
npx @lit-protocol/vincent-scaffold-sdk add policy <path>/<name>
```

## Architecture

**Monorepo Structure:**

- `vincent-packages/tools/` - Blockchain interaction tools (ERC-20, native transfers)
- `vincent-packages/policies/` - Governance policies (rate limiting, validation)
- `vincent-e2e/` - End-to-end test suite with blockchain simulation
- `vincent-scripts/` - Build automation and utility scripts

**Key Technologies:**

- TypeScript 5.x with strict type checking
- Ethers.js for blockchain interactions
- Zod schemas for validation and type inference
- Vincent Scaffold SDK framework
- Lit Actions execution environment

## Critical Development Constraints

**❌ NEVER use in tools/policies:**

- `globalThis`, `process.env`, or Node.js built-ins
- Mock or fake data - always request proper specifications
- Persistent memory between executions
- Unauthorized external dependencies

**✅ Required patterns:**

- Schema-first development using Zod validation
- Use `laUtils` API only in designated execution phases
- Follow existing component patterns in `vincent-packages/`

## Component Structure

Each tool/policy follows this pattern:

```
src/
├── lib/
│   ├── schemas.ts           # Zod validation schemas
│   ├── vincent-tool.ts      # Main implementation
│   └── helpers/
│       └── index.ts         # Utility functions
├── package.json
└── tsconfig.json
```

## Environment Setup

- Copy `.env.vincent-sample` to `.env` for blockchain configuration
- Use `dotenv -e .env --` prefix for running E2E tests
- All E2E tests require proper blockchain environment variables

## Testing Strategy

- E2E tests simulate real blockchain interactions
- Tests use the Vincent SDK's testing framework
- Run specific test suites with `vincent:e2e:erc20` for ERC-20 testing
- Run specific test suites with `vincent:e2e` for default testing
- Always run `vincent:build` before testing changes

## Framework Configuration

Project configuration is in `vincent.json`:

- Package namespace: `@your-orginisation`
- Tool prefix: `vincent-tool-`
- Policy prefix: `vincent-policy-`
- Auto-discovery of tools and policies from configured directories
