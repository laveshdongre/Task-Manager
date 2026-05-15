# Task-Manager
Task Manager is a full-stack web application for managing projects and tasks. It features user authentication, project and task CRUD operations, dashboards, and a modern React frontend with a Node.js/Express backend and MongoDB database.

# TaskNest — Team Task Manager

A full-stack web app for project and task management with role-based access control.


## Tech Stack


## File Structure

```
taskflow/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT verify, role checks
│   │   └── errorHandler.js    # Global error handler
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Project.js         # Project + members schema
│   │   └── Task.js            # Task + comments schema
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── projects.js        # /api/projects/*
│   │   ├── tasks.js           # /api/projects/:id/tasks/*
│   │   └── dashboard.js       # /api/dashboard
│   ├── .env.example           # Environment variable template
│   ├── package.json
│   └── server.js              # Express entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── shared/
│   │   │       └── Layout.js  # Sidebar + navigation
│   │   ├── context/
│   │   │   └── AuthContext.js # Global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── ProjectsPage.js
│   │   │   └── ProjectDetailPage.js  # Kanban board
│   │   ├── utils/
│   │   │   └── api.js         # Axios + all API calls
│   │   ├── App.js             # Routes
│   │   ├── index.js
│   │   └── index.css          # Design system
│   └── package.json
│
├── railway.toml               # Railway deployment config
├── package.json               # Root scripts
└── .gitignore
```


## Step 1: MongoDB Atlas (database)

This project uses **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** (free tier is fine). You do not need MongoDB Compass or a local `mongod` unless you want a desktop UI to browse data.

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com) and create a **cluster** (e.g. M0 free).
2. **Database Access** → create a database user (username + password). Save the password.
3. **Network Access** → **Add IP Address**:
   - For local dev: **Add Current IP Address**, or temporarily `0.0.0.0/0` (less secure; okay for quick tests only).
4. **Database** → **Connect** → **Drivers** → copy the **connection string** (starts with `mongodb+srv://`).
5. Replace `<password>` with your database user’s password. If the password contains special characters (`@`, `#`, `/`, etc.), [URL-encode them](https://www.mongodb.com/docs/atlas/troubleshoot-connection/#special-characters-in-connection-string-password).
6. Ensure the database name in the path is `TaskNest` (or change `/TaskNest` in the URI to match what you want). Example shape:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/TaskNest?retryWrites=true&w=majority
   ```

### Your `backend/.env`

Copy `backend/.env.example` to `backend/.env` and set **`MONGODB_URI`** to that Atlas string. Optionally browse collections later with [Compass](https://www.mongodb.com/products/compass) using the same URI.

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/TaskNest?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
NODE_ENV=development
```


## Step 2: Run Locally

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env — paste your Atlas MONGODB_URI and a strong JWT_SECRET
npm install
npm run dev        # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start          # runs on http://localhost:3000
```

The frontend proxies `/api` requests to `http://localhost:5000` automatically.


## Step 3: Deploy to Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### 2. Create Railway project
1. Go to https://railway.app and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `taskflow` repository

### 3. MongoDB Atlas for production
Use the same Atlas cluster as in **Step 1**, or a dedicated production cluster. For Railway’s outbound IPs, **Network Access** usually needs **`0.0.0.0/0`** (or configure [Atlas IP Access List](https://www.mongodb.com/docs/atlas/security/ip-access-list/) per MongoDB’s guidance for your host).

### 4. Set Railway environment variables
In Railway dashboard → your service → **Variables** tab, add (use your real Atlas URI and secrets):
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=your_super_long_random_secret_here
JWT_EXPIRE=7d
NODE_ENV=production
```

### 5. Railway auto-deploys
Railway reads `railway.toml` which:
1. Installs all dependencies
2. Builds the React app
3. Copies the build into `backend/public/`
4. Starts the Express server (which serves both API + React)

Your app will be live at `https://your-project.up.railway.app`


## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all my projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project detail |
| PUT | /api/projects/:id | Update project (admin) |
| DELETE | /api/projects/:id | Delete project (admin) |
| POST | /api/projects/:id/members | Invite member (admin) |
| DELETE | /api/projects/:id/members/:userId | Remove member (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/tasks | Get all tasks |
| POST | /api/projects/:id/tasks | Create task |
| GET | /api/projects/:id/tasks/:taskId | Get task detail |
| PUT | /api/projects/:id/tasks/:taskId | Update task |
| DELETE | /api/projects/:id/tasks/:taskId | Delete task |
| POST | /api/projects/:id/tasks/:taskId/comments | Add comment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Aggregated stats |


## Role-Based Access Control

| Action | Admin | Member (Assignee) | Member |
|--------|-------|-------------------|--------|
| View project | ✅ | ✅ | ✅ |
| Update project settings | ✅ | ❌ | ❌ |
| Invite/remove members | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Update any task | ✅ | Own tasks only | ❌ |
| Change task status | ✅ | If assigned | ❌ |
| Delete tasks | ✅ | Own tasks | ❌ |
| Delete project | ✅ | ❌ | ❌ |


## Features
