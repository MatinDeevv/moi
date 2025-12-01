# Project ME Web UI

Modern Next.js web interface for Project ME v0.2.

## Quick Start

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The UI will be available at: http://localhost:3000

### 3. Make Sure the API is Running

In a separate terminal, from the project root:

```bash
cd ..
python main.py --api
```

The API will run at: http://localhost:8000

## Features

### 📋 Task Dashboard
- View all tasks with filtering by status, type, and tags
- Click any task to view full details including events
- Real-time status updates

### ➕ Create Tasks
- Interactive form with task type selection
- Pre-filled example payloads for each task type
- JSON payload editor with validation
- Tag support

### ⚡ Run Tasks
- One-click execution of next pending task
- Real-time result display
- Automatic task list refresh

### 📊 Events Viewer
- Browse all system events
- Filter by task ID or event type
- Detailed event data inspection

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **React 18**

## Project Structure

```
app/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main dashboard page
│   ├── globals.css      # Global styles
│   └── components/      # UI components
│       ├── TaskList.tsx
│       ├── CreateTaskForm.tsx
│       ├── RunTaskButton.tsx
│       └── EventList.tsx
├── lib/                 # Utilities
│   └── api.ts          # API client
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Integration

All API calls go through `lib/api.ts` which connects to:
- **Base URL**: `http://localhost:8000`
- **CORS**: Enabled for localhost:3000

Available endpoints:
- `GET /health` - Health check
- `GET /tasks` - List tasks with filters
- `GET /tasks/{id}` - Get task details
- `POST /tasks` - Create new task
- `POST /tasks/run-next` - Run next pending task
- `GET /events` - List events with filters
- `GET /sessions` - List LLM sessions
- `GET /sessions/{id}` - Get session details

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- The UI expects the Python API server to be running on port 8000
- All state is stored in Python backend (JSONL files)
- This is a thin UI layer with no local state persistence

