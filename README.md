# 🚀 AetherBuild

<div align="center">

**Transform your ideas into production-ready web applications with AI**

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.17.1-47A248?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Build with AI. Deploy in Seconds.*

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**AetherBuild** is an AI-powered web development platform that enables developers and creators to build production-ready React applications using natural language, voice commands, or image inputs. With advanced AI models, real-time preview, and one-click deployment, AetherBuild makes web development accessible to everyone.

### Key Highlights

- 🎯 **No Code Required** - Describe your vision in plain English
- 🗣️ **Voice to Code** - Speak your requirements, get working code
- 🖼️ **Image to Code** - Upload designs, generate React components
- ⚡ **Real-Time Preview** - See changes instantly with responsive device previews
- 🚀 **One-Click Deploy** - Deploy to Netlify with a single click
- 🧠 **AI Project Mentor** - Get personalized guidance for your projects
- 📊 **Performance Analytics** - Optimize your code with AI-powered insights
- 🛒 **Component Marketplace** - Browse and integrate pre-built components

---

## ✨ Features

### 🤖 AI-Powered Code Generation
- Generate production-ready React code with Tailwind CSS
- Support for multiple AI models (Gemini 2.0 Flash, Pro, etc.)
- Context-aware code generation with project understanding
- Automatic code fixing and error resolution

### 🗣️ Voice to Code
- Hands-free development with voice recognition
- Real-time speech-to-text conversion
- Direct integration with AI code generation
- Browser-based Web Speech API support

### 🖼️ Image to Code
- Upload screenshots or design mockups
- AI-powered image analysis and component generation
- Automatic layout and styling extraction
- Support for complex UI designs

### 📊 Performance Analytics
- Real-time code quality metrics
- Complexity and maintainability scores
- Console log detection
- Accessibility analysis
- Actionable optimization suggestions

### 🛒 Component Marketplace
- Pre-built, production-ready components
- One-click integration (merge or replace)
- Categories: Navigation, Forms, Games, UI Components
- Smart component merging with intelligent positioning

### 🧠 AI Project Mentor
- Project-specific code explanations
- Personalized best practice suggestions
- Context-aware Q&A for your codebase
- Learning path recommendations

### 👀 Real-Time Preview
- Live code preview with instant updates
- Responsive device presets (Desktop, Tablet, Mobile)
- Multiple preview modes (Sandpack, Custom iframe)
- Console output and error tracking

### 🚀 One-Click Deployment
- Deploy to Netlify instantly
- Automatic site creation and configuration
- Public URL generation
- Project versioning and history

### 📁 Advanced File Management
- Multi-file project support
- Tree-based file explorer
- Drag-and-drop file organization
- Syntax highlighting with Monaco Editor

### 🔐 Secure Authentication
- JWT-based authentication
- User project isolation
- Secure API endpoints
- Session management

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern React with hooks and concurrent features
- **Vite 7.1.0** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Framer Motion 12.23.24** - Production-ready motion library
- **Monaco Editor** - VS Code editor in the browser
- **Sandpack** - CodeSandbox integration for live preview
- **React Icons** - Beautiful icon library
- **Axios** - HTTP client for API requests

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 5.1.0** - Fast, unopinionated web framework
- **MongoDB with Mongoose 8.17.1** - NoSQL database with ODM
- **Google Gemini AI** - Advanced AI code generation
- **JWT** - Secure authentication tokens
- **Archiver** - ZIP file creation for deployments
- **Netlify API** - Deployment integration

### Infrastructure
- **MongoDB Atlas** - Cloud database (optional)
- **Netlify** - Hosting and deployment platform
- **Vercel** - Frontend deployment (optional)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (or **yarn** 1.22.0+)
- **MongoDB** (local or Atlas connection string)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Netlify API Token** (optional, for deployment features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aetherbuild.git
   cd aetherbuild
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `server` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/aetherbuild
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aetherbuild

   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

   # AI Services
   GEMINI_API_KEY=your_gemini_api_key_here

   # Netlify (Optional - for deployment features)
   NETLIFY_ACCESS_TOKEN=your_netlify_access_token_here

   # CORS Configuration (Optional)
   FRONTEND_URL=http://localhost:5173
   VERCEL_URL=your-vercel-app.vercel.app
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## 📚 Documentation

### Getting Started

#### 1. Create an Account
- Sign up with email and password
- Or use existing authentication system
- Get your JWT token for API access

#### 2. Create a New Project
- Click "New Project" in the dashboard
- Enter a project name
- Start building!

#### 3. Generate Code

**Using Text Prompt:**
```
Create a modern todo app with:
- Add, edit, and delete tasks
- Dark mode toggle
- Local storage persistence
- Beautiful Tailwind CSS styling
```

**Using Voice:**
- Click the microphone icon
- Speak your requirements clearly
- AI will convert speech to code

**Using Image:**
- Upload a screenshot or design
- AI analyzes and generates matching code
- Refine as needed

#### 4. Preview and Edit
- See live preview in the right panel
- Switch between device presets
- Edit code in the Monaco editor
- Changes reflect instantly

#### 5. Deploy
- Click "Deploy to Netlify"
- Wait for deployment (usually < 30 seconds)
- Get your live URL
- Share with the world!

### API Documentation

#### Authentication

All API endpoints require authentication via JWT token:

```http
Authorization: Bearer <your_jwt_token>
```

#### Endpoints

##### Generate Code
```http
POST /api/generate
Content-Type: application/json

{
  "prompt": "Create a React todo app with Tailwind CSS",
  "model": "gemini-2.0-flash-exp",
  "styleMode": "tailwind"
}
```

**Response:**
```json
{
  "code": "function TodoApp() { ... }",
  "files": [
    {
      "name": "App.jsx",
      "content": "...",
      "path": "/App.jsx"
    }
  ]
}
```

##### Fix Code
```http
POST /api/fix
Content-Type: application/json

{
  "code": "function App() { return <div>Hello</div> }",
  "error": "Unexpected token",
  "model": "gemini-2.0-flash-exp",
  "styleMode": "tailwind"
}
```

##### Voice to Code
```http
POST /api/voice-to-code
Content-Type: application/json

{
  "transcript": "Create a weather app that shows current temperature",
  "model": "gemini-2.0-flash-exp"
}
```

##### Image to Code
```http
POST /api/image-to-code
Content-Type: multipart/form-data

{
  "image": <file>,
  "model": "gemini-2.0-flash-exp"
}
```

##### Deploy to Netlify
```http
POST /api/netlify/deploy
Content-Type: application/json

{
  "projectName": "my-awesome-app",
  "files": [
    {
      "name": "index.html",
      "content": "..."
    }
  ]
}
```

**Response:**
```json
{
  "siteId": "abc123",
  "siteUrl": "https://my-awesome-app.netlify.app",
  "deployId": "def456"
}
```

##### Get Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

##### Get Project by ID
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

##### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "fileTree": [...]
}
```

### Project Structure

```
aetherbuild/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx         # Authentication component
│   │   │   ├── LandingPage.jsx # Landing page
│   │   │   ├── ProjectDashboard.jsx # Main dashboard
│   │   │   └── features/
│   │   │       ├── AIMentor.jsx           # AI mentor feature
│   │   │       ├── ComponentMarketplace.jsx # Component marketplace
│   │   │       ├── ImageToCode.jsx        # Image to code
│   │   │       ├── PerformanceAnalytics.jsx # Analytics
│   │   │       └── VoiceToCode.jsx        # Voice to code
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                      # Backend Node.js application
│   ├── src/
│   │   ├── index.js            # Server entry point
│   │   ├── routes/
│   │   │   ├── auth.js         # Authentication routes
│   │   │   ├── gemini.js       # AI generation routes
│   │   │   ├── netlify.js      # Deployment routes
│   │   │   ├── projects.js     # Project management routes
│   │   │   └── prompts.js      # Prompt management
│   │   ├── services/
│   │   │   ├── gemini.js       # Gemini AI service
│   │   │   └── netlify.js      # Netlify integration
│   │   └── models/
│   │       ├── User.js         # User model
│   │       ├── Project.js      # Project model
│   │       └── Prompt.js       # Prompt model
│   ├── package.json
│   └── .env.example
│
├── README.md                    # This file
├── LICENSE                      # License file
└── .gitignore
```

---

## 🎯 Usage Examples

### Example 1: Building a Todo App

1. **Describe your app:**
   ```
   Create a modern todo application with:
   - Add new tasks
   - Mark tasks as complete
   - Delete tasks
   - Filter by status (all, active, completed)
   - Dark mode toggle
   - Local storage persistence
   - Beautiful Tailwind CSS design
   ```

2. **Generate code** - Click "Generate Code"

3. **Preview** - See your app in the preview panel

4. **Customize** - Edit code as needed

5. **Deploy** - One click to Netlify!

### Example 2: Voice Command

1. Click the **microphone** icon
2. Say: *"Create a weather dashboard showing temperature, humidity, and wind speed with beautiful cards"*
3. AI generates the code automatically
4. Preview and refine

### Example 3: Image to Code

1. Upload a screenshot of a design
2. AI analyzes the layout
3. Generates matching React components
4. Customize and deploy

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT tokens | Yes | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `NETLIFY_ACCESS_TOKEN` | Netlify API token | No | - |
| `NODE_ENV` | Environment mode | No | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:5173` |

### CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (React default)
- `http://localhost:5174` (Alternative Vite port)
- URLs specified in `FRONTEND_URL` and `VERCEL_URL` environment variables
- Additional origins in `ALLOWED_ORIGINS` (comma-separated)

---

## 🚢 Deployment

### Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd client
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `VITE_API_URL` - Your backend API URL

### Backend Deployment (Railway/Render/Heroku)

1. **Set up your hosting platform**
2. **Configure environment variables**
3. **Deploy:**
   ```bash
   cd server
   git push origin main
   ```

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Add to `MONGODB_URI` in `.env`

---

## 🧪 Testing

```bash
# Run frontend tests (if configured)
cd client
npm test

# Run backend tests (if configured)
cd server
npm test
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with descriptive messages:**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Add comments for complex logic
- Update documentation for new features
- Write meaningful commit messages
- Test your changes thoroughly

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **JWT Token Errors**
- Ensure token is valid and not expired
- Check token format in Authorization header
- Verify `JWT_SECRET` matches your auth system

#### 2. **Gemini API Errors**
- Verify API key is correct
- Check API quota and rate limits
- Ensure model name is valid
- See [Gemini API Documentation](https://ai.google.dev/docs)

#### 3. **MongoDB Connection Issues**
- Verify connection string format
- Check network access (firewall, IP whitelist)
- Ensure MongoDB is running (if local)
- Verify credentials for Atlas

#### 4. **Preview Not Working**
- Check browser console for errors
- Verify Sandpack is loading
- Try switching preview modes
- Clear browser cache

#### 5. **Deployment Failures**
- Verify Netlify token is valid
- Check file structure and `index.html`
- Ensure `window.MainComponent` is assigned
- Review Netlify build logs

#### 6. **Voice Recognition Not Working**
- Use Chrome or Edge (best support)
- Grant microphone permissions
- Check browser console for errors
- Verify Web Speech API support

### Getting Help

- 📖 Check the [Documentation](#-documentation)
- 🐛 [Open an Issue](https://github.com/yourusername/aetherbuild/issues)
- 💬 Join our [Discord Community](https://discord.gg/aetherbuild)
- 📧 Email: support@aetherbuild.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - For powerful AI capabilities
- [Netlify](https://www.netlify.com/) - For seamless deployment
- [React](https://reactjs.org/) - For the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) - For beautiful styling
- [Framer Motion](https://www.framer.com/motion/) - For smooth animations
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - For code editing

---

## 📊 Project Status

- ✅ Core Features Complete
- ✅ AI Code Generation
- ✅ Voice to Code
- ✅ Image to Code
- ✅ Component Marketplace
- ✅ Performance Analytics
- ✅ AI Mentor
- ✅ Netlify Deployment
- 🚧 Additional AI Models (In Progress)
- 🚧 Team Collaboration (Planned)
- 🚧 Version Control Integration (Planned)

---

## 🌟 Star History

If you find this project helpful, please consider giving it a ⭐ on GitHub!

---

<div align="center">

**Built with ❤️ by the AetherBuild Team**

[Website](https://aetherbuild.com) • [Documentation](https://docs.aetherbuild.com) • [Twitter](https://twitter.com/aetherbuild) • [Discord](https://discord.gg/aetherbuild)

**Happy Building! 🚀**

</div>
