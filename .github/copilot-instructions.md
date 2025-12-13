# Copilot Instructions for AI Coding Agents

## Project Overview
This is a web application with a classic HTML/JS/CSS structure, organized for modularity and clarity. The project is not using a frontend framework (like React or Vue), but instead relies on vanilla JavaScript, HTML, and CSS. Data is managed via JSON files and backend logic is implemented in JavaScript under the `functions/api/` directory.

## Key Directories & Files
- `logic/`: Client-side JavaScript for each major page (e.g., `dash.js`, `login.js`). Each file matches a corresponding HTML page.
- `functions/api/`: Serverless API endpoints (Node.js style) for authentication, course progress, quizzes, comments, etc.
- `data/`: Static JSON data for courses and quizzes.
- `styles/`: Page-specific CSS files.
- HTML files at the root correspond to main app pages.

## Data Flow & Architecture
- **Frontend**: Each HTML page loads its matching JS from `logic/`. These scripts handle DOM manipulation, API calls, and page logic.
- **Backend/API**: API endpoints in `functions/api/` are called via `fetch` from the frontend. These endpoints handle authentication, data updates, and business logic.
- **Data**: Static data is read from `data/` JSON files. Some endpoints may update or read these files directly.

## Patterns & Conventions
- **File Naming**: JS and CSS files are named after their corresponding HTML page (e.g., `login.html` → `logic/login.js`, `styles/login.css`).
- **API Calls**: Use `fetch` to communicate with endpoints in `functions/api/`. Example: `/functions/api/login.js` for login.
- **Supabase**: The `logic/supabaseClient.js` file is used for Supabase integration (authentication, storage, etc.).
- **No Build Step**: There is no build process; all files are served as-is. No bundler or transpiler is used.
- **No Frameworks**: Avoid React, Vue, or similar. Use vanilla JS and DOM APIs.

## Developer Workflows
- **Add a Page**: Create an HTML file, a matching JS file in `logic/`, and a CSS file in `styles/`.
- **Add an API Endpoint**: Add a JS file in `functions/api/` and document its usage.
- **Data Updates**: Edit JSON files in `data/` for static content.
- **No Automated Tests**: There is no test suite or test runner configured.
- **No Build/Start Command**: Open HTML files directly or serve with a static server. For API endpoints, use a serverless environment or local Node.js server as needed.

## Integration Points
- **Supabase**: Used for authentication and possibly storage. See `logic/supabaseClient.js` for setup.
- **API Endpoints**: All cross-component logic is routed through `functions/api/`.

## Examples
- To update user password: Frontend calls `functions/api/update-password.js` via `fetch`.
- To fetch course data: Frontend loads `data/courses.json` directly or via an API.

## Additional Notes
- Keep code modular and page-specific.
- Follow the file/folder structure for new features.
- Avoid introducing frameworks or build tools.
