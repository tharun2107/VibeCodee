# VibeCode - AI-Powered Code Editor

A modern, AI-powered code editor built with React, Monaco Editor, and Google Gemini AI. Create, edit, and preview React applications with intelligent code generation and error fixing.

## ✨ Features

### 🎯 **Core Features**
- **Monaco Editor Integration** - Professional code editing experience
- **Live Preview** - Real-time preview with Babel JSX transpilation
- **File Management** - Multi-file project structure with tabs
- **AI Code Generation** - Generate code using Google Gemini AI
- **AI Error Fixing** - Fix code errors with intelligent suggestions
- **Console Logging** - View console output in real-time
- **Server Status** - Monitor backend connection status

### 🚀 **Multi-File Generation (Like Lovable!)**
- **Complete Project Structure** - Generate entire applications with multiple files
- **Smart File Organization** - Automatic folder structure creation
- **Component Separation** - Modular components in separate files
- **Style Files** - CSS/SCSS files for custom styling
- **Utility Functions** - Helper functions in dedicated files
- **HTML Entry Points** - Complete HTML files with proper setup

### 🎨 **UI/UX Features**
- **Dark Theme** - Professional dark interface
- **Resizable Panels** - Customizable layout
- **File Tabs** - Multi-tab editing experience
- **File Tree** - Hierarchical file organization
- **Responsive Design** - Works on all screen sizes
- **Modern Animations** - Smooth transitions and effects

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Monaco Editor** - Code editor (same as VS Code)
- **Tailwind CSS** - Utility-first styling
- **React Split** - Resizable panels
- **React Icons** - Icon library
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Google Gemini AI** - AI code generation
- **MongoDB** - Database (optional)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd VibeCode

# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install
```

### 2. Environment Setup
Create `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_uri_here
PORT=5000
```

### 3. Start Development Servers
```bash
# Backend (Terminal 1)
cd server && npm run dev

# Frontend (Terminal 2)
cd client && npm run dev
```

### 4. Open Application
Navigate to `http://localhost:5173` in your browser.

## 📖 Usage

### 🎯 **Single File Generation**
- Check "Single file mode" in the sidebar
- Describe your component in the prompt
- Click "Generate Code"
- Get a single React component file

### 🚀 **Multi-File Project Generation**
- Uncheck "Single file mode" (default)
- Describe your complete application
- Click "Generate Code"
- Get a full project structure with multiple files

### 📝 **Example Prompts**

#### Single Component
```
"Create a beautiful React todo app with drag & drop functionality using Tailwind CSS"
```

#### Complete Project
```
"Create a modern SaaS landing page with clean UI built using Tailwind CSS. Make it professional with cool animations"
```

#### Multi-File Application
```
"Build a complete e-commerce website with product listing, shopping cart, and checkout functionality"
```

### 🔧 **File Management**
- **Create Files** - Click "+ New File" in file tree
- **Delete Files** - Click trash icon next to file
- **Switch Files** - Click file in tree or use tabs
- **Download Files** - Use download button in editor toolbar

### 🎨 **Preview System**
- **Live Preview** - See changes in real-time
- **Console Tab** - View console.log output
- **Error Handling** - Clear error messages with retry option
- **Responsive Preview** - Test on different screen sizes

## 🔌 API Endpoints

### Code Generation
```http
POST /api/generate
Content-Type: application/json

{
  "prompt": "Create a React component...",
  "model": "gemini-2.5-flash",
  "multiFile": true
}
```

### Code Fixing
```http
POST /api/fix
Content-Type: application/json

{
  "code": "function Component() { ... }",
  "error": "SyntaxError: ...",
  "model": "gemini-2.5-flash"
}
```

### Health Check
```http
GET /api/health
```

## 📁 Project Structure

```
VibeCode/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── index.css      # Global styles
│   │   └── main.jsx       # Application entry point
│   ├── public/            # Static assets
│   ├── tailwind.config.js # Tailwind configuration
│   └── package.json       # Frontend dependencies
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── models/        # Database models
│   └── package.json       # Backend dependencies
└── README.md             # Project documentation
```

## 🎨 Customization

### Styling
- Modify `client/src/index.css` for global styles
- Update `client/tailwind.config.js` for theme customization
- Edit component styles in individual files

### AI Models
- Change default model in `server/src/services/gemini.js`
- Add new models in the frontend dropdown
- Customize generation prompts for different use cases

### File Types
- Add new file extensions in `getLanguageFromExtension()`
- Update Monaco Editor language support
- Extend preview system for new file types

## 🐛 Troubleshooting

### Common Issues

#### Preview Not Loading
- Check browser console for errors
- Verify Babel CDN is accessible
- Ensure React and ReactDOM are loaded

#### AI Generation Fails
- Verify Gemini API key is set
- Check network connectivity
- Review API rate limits

#### Tailwind CSS Not Working
- Ensure PostCSS configuration is correct
- Check Tailwind CSS version compatibility
- Verify content paths in `tailwind.config.js`

### Development Tips
- Use browser dev tools to debug preview issues
- Check server logs for API errors
- Monitor network requests for debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Monaco Editor** - Professional code editing
- **Google Gemini AI** - Intelligent code generation
- **Tailwind CSS** - Utility-first styling
- **React Community** - Amazing ecosystem

---

**Happy Coding! 🚀**
