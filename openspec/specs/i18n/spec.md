# Internationalization (i18n) Specification

## Purpose
Define the requirements for supporting multiple languages (Spanish, English, Portuguese) using URL-based routing.

## Requirements

### Requirement: Middleware Routing
The application MUST intercept incoming requests and redirect them to a locale-prefixed URL if no locale is present.

#### Scenario: Accessing root URL
- GIVEN the user navigates to `/`
- WHEN the request hits the server
- THEN the middleware MUST detect the preferred language (defaulting to `es`)
- AND redirect the user to `/{locale}` (e.g., `/es`)

### Requirement: Dictionary Loading
The application MUST load the correct JSON dictionary (`es.json`, `en.json`, or `pt.json`) based on the URL locale.

#### Scenario: Translating UI text
- GIVEN the user is on a route `/en/`
- WHEN the page renders
- THEN it MUST display the text in English using `next-intl` translation hooks
