@echo off
REM List all available Gemini models for your API key on Windows
REM Replace YOUR_API_KEY with your actual API key

curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"

