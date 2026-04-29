# Core Infrastructure Specification

## Purpose
Define the foundational setup of the Next.js application and testing environment.

## Requirements

### Requirement: Next.js Setup
The project MUST run on Next.js 14 App Router with TypeScript.

#### Scenario: Running the dev server
- GIVEN a valid Node.js environment
- WHEN the user runs `npm run dev`
- THEN the Next.js development server MUST start successfully
- AND serve a root page without errors

### Requirement: Testing Environment
The project MUST have Jest configured to run tests on TypeScript files, specifically supporting the `src/core/algorithm` directory.

#### Scenario: Running algorithm tests
- GIVEN the existing `bresenham.test.ts` and `greedy.test.ts` files
- WHEN the user runs `npm run test`
- THEN Jest MUST compile the TypeScript files and execute the tests
- AND all algorithm tests MUST pass
