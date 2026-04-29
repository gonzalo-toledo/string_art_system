# Design System Specification

## Purpose
Define the styling foundation using Vanilla CSS variables (Design Tokens) to ensure visual consistency without relying on external utility frameworks like Tailwind.

## Requirements

### Requirement: Global Design Tokens
The application MUST define global CSS variables for colors, typography, and spacing in a central `design-tokens.css` file.

#### Scenario: Applying brand colors
- GIVEN the `design-tokens.css` is loaded
- WHEN a component uses `var(--color-primary)`
- THEN the browser MUST render the correct brand color (e.g., Hagalo primary)
- AND the UI MUST reflect a premium aesthetic

### Requirement: Zero-Utility Styling
The application SHOULD NOT rely on Tailwind CSS for core styling as per project guidelines.

#### Scenario: Authoring components
- GIVEN a new React component
- WHEN styling the component
- THEN the developer MUST use CSS modules or vanilla CSS referencing global tokens
- AND MUST NOT use inline Tailwind utility classes
