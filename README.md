# GitHub Repository Explorer

A small Vue 3 + Quasar single-page app for searching public GitHub repositories. It lets
you search by keyword, page through results, and open a repository's detail page to see
its description, stats, topics, license, and more. All data comes directly from the
GitHub REST API — there is no backend.

## GitHub API token (optional)

Unauthenticated requests to the GitHub API are limited to 60/hour per IP. To raise that to
5,000/hour, copy `.env.example` to `.env` and set `VITE_GITHUB_TOKEN` to a
[personal access token](https://github.com/settings/tokens) (no scopes are required for
searching public repositories). The app works fine without one.

## Running locally

```bash
npm install     # install dependencies
npm run dev     # start the dev server with hot reload
npm run test    # run the unit test suite
npm run build   # build for production
```

## AI disclosure

This project was built with the assistance of an AI coding assistant (Claude Code), 
under human review and direction, mainly in unit test, README and layout fine-tuning.
