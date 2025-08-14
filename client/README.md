# VibeCode - AI-Powered Code Editor

A modern, AI-powered code editor built with React, Monaco Editor, and Google Gemini AI. Create, edit, and preview React applications with real-time AI assistance.

## ✨ Features

- **🤖 AI Code Generation** - Generate React components using natural language prompts
- **🔧 AI Code Fixing** - Automatically fix errors in your code
- **📁 File Management** - Tree-based file explorer with tabs
- **💻 Monaco Editor** - Professional code editor with syntax highlighting
- **👁️ Live Preview** - Real-time preview of your React applications
- **🎨 Tailwind CSS** - Built-in Tailwind CSS support for styling
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VibeCode
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In server directory, create .env file
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

4. **Start the development servers**
   ```bash
   # Start backend server
   cd server
   npm run dev
   
   # Start frontend (in new terminal)
   cd client
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🛠️ Usage

### Creating Code with AI
1. Enter a description of what you want to build in the prompt field
2. Select your preferred AI model (Gemini 2.5 Flash or 1.5 Pro)
3. Click "✨ Generate Code" to create your component
4. The generated code will appear in the editor

### Fixing Code with AI
1. If your code has errors, click "🔧 AI Fix"
2. The AI will analyze and fix the issues
3. The corrected code will replace the current content

### File Management
- **Create files**: Click the "+" button in the file explorer
- **Delete files**: Click the trash icon next to any file
- **Switch between files**: Click on file tabs or use the file explorer
- **Download files**: Click the download icon in the editor toolbar

### Preview
- Your React components are automatically previewed in real-time
- Switch between "Preview" and "Console" tabs to see output and logs
- The preview uses Tailwind CSS for styling

## 🏗️ Project Structure

```
VibeCode/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── index.css      # Global styles and Tailwind
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── server/                 # Backend Node.js/Express API
│   ├── src/
│   │   ├── index.js       # Express server setup
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic (Gemini AI)
│   │   └── models/        # MongoDB models
│   └── package.json       # Backend dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS v4 with custom configuration:
- Custom color palette
- Custom animations
- Responsive design utilities

### Monaco Editor
Professional code editor with:
- Syntax highlighting for multiple languages
- Auto-completion and IntelliSense
- Error detection and validation
- Custom theme integration

### AI Integration
- Google Gemini API for code generation
- Support for multiple AI models
- Error handling and retry logic
- Code cleaning and formatting

## 🎨 Customization

### Adding New File Types
1. Update `getMonacoLanguage()` function in `App.jsx`
2. Add file extension mapping
3. Update preview system if needed

### Custom AI Prompts
1. Modify `buildGenerationInstruction()` in `server/src/services/gemini.js`
2. Add new prompt templates
3. Update the frontend to use new prompt types

### Styling
1. Edit `tailwind.config.js` for theme customization
2. Modify `src/index.css` for custom styles
3. Update component classes as needed

## 🐛 Troubleshooting

### Common Issues

**Tailwind CSS not working**
- Ensure `@tailwindcss/postcss` is installed
- Check PostCSS configuration
- Verify CSS imports in `index.css`

**Preview not showing**
- Check browser console for errors
- Verify React and Babel scripts are loading
- Ensure code doesn't have import statements

**AI generation failing**
- Verify Gemini API key is set
- Check server is running on correct port
- Review network tab for API errors

**File operations not working**
- Check file permissions
- Verify file tree state management
- Review console for JavaScript errors

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Google Gemini](https://ai.google.dev/) - AI API
- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool

---

**Happy Coding! 🚀**
