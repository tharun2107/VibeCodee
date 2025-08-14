# VibeCode - AI-Powered Code Generator

A modern, Lovable-inspired code generation platform that uses AI to create React applications with real-time preview and file management.

## Features

- 🤖 **AI Code Generation**: Generate React components using Gemini AI
- 📁 **File Management**: Multi-file project support with tree structure
- 👀 **Live Preview**: Real-time preview with Sandpack integration
- 🔧 **AI Code Fixing**: Automatically fix code errors using AI
- 🎨 **Modern UI**: Beautiful, responsive interface with dark theme
- ⚡ **Fast Development**: Hot reload and instant feedback
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Sandpack** - CodeSandbox integration for live preview
- **React Icons** - Beautiful icon library
- **React Split** - Resizable panels

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database (optional)
- **Google Gemini AI** - AI code generation
- **JWT** - Authentication

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd VibeCode
```

### 2. Set Up Environment Variables

Create a `.env` file in the server directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/vibecode
PORT=5000
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Start the Development Servers

```bash
# Start the backend server (from server directory)
npm run dev

# Start the frontend (from client directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Usage

### 1. Authentication
- Enter your JWT token in the sidebar
- The token should be obtained from your authentication system

### 2. Code Generation
1. **Describe your app** in the prompt field
   - Example: "Create a beautiful React todo app with drag & drop functionality using Tailwind CSS"
2. **Configure options**:
   - Model: Choose AI model (optional)
   - Style: Tailwind CSS or Plain CSS
   - Preview: Sandpack or Custom iframe
3. **Click "Generate Code"** to create your application

### 3. File Management
- **View files** in the sidebar file explorer
- **Switch between files** by clicking on them
- **Edit code** in the main editor
- **See live preview** in the right panel

### 4. AI Code Fixing
- **Generate code** first
- **Run the code** to see any errors
- **Click "AI Fix"** to automatically fix issues
- **Review the fixed code** and preview

### 5. Preview Modes
- **Sandpack**: Full CodeSandbox integration with console
- **Custom**: Lightweight iframe preview with console logs

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Generate Code
```http
POST /api/generate
Content-Type: application/json

{
  "prompt": "Create a React todo app",
  "model": "gemini-2.0-flash-exp",
  "styleMode": "tailwind"
}
```

### Fix Code
```http
POST /api/fix
Content-Type: application/json

{
  "code": "your code here",
  "error": "error message",
  "model": "gemini-2.0-flash-exp",
  "styleMode": "tailwind"
}
```

## Project Structure

```
VibeCode/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── index.css      # Global styles
│   │   └── main.jsx       # Application entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── models/        # Database models
│   └── package.json       # Backend dependencies
└── README.md              # This file
```

## Customization

### Adding New File Types
1. Update the `getLanguageFromExtension` function in `App.jsx`
2. Add new file templates in `getDefaultContent`
3. Update Sandpack configuration if needed

### Styling
- Modify `client/src/index.css` for global styles
- Use Tailwind classes for component styling
- Customize the theme in the CSS variables

### AI Models
- Update the Gemini service in `server/src/services/gemini.js`
- Add new model configurations
- Modify the prompt engineering for better results

## Troubleshooting

### Common Issues

1. **JWT Token Error**
   - Ensure your JWT token is valid
   - Check the token format in the Authorization header

2. **Gemini API Errors**
   - Verify your API key is correct
   - Check your API quota and limits
   - Ensure the model name is valid

3. **Preview Not Working**
   - Check browser console for errors
   - Verify Sandpack is loading correctly
   - Try switching between preview modes

4. **Code Generation Issues**
   - Make sure your prompt is clear and specific
   - Try different style modes (Tailwind vs CSS)
   - Check the generated code for syntax errors

### Development Tips

1. **Better Prompts**: Be specific about features, styling, and functionality
2. **Error Handling**: Use the AI Fix feature when code has issues
3. **File Organization**: Create multiple files for complex applications
4. **Testing**: Use the console to debug and test your code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Coding! 🚀**
