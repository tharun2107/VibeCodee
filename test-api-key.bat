@echo off
REM Test your Gemini API Key on Windows
REM Replace YOUR_API_KEY with your actual API key

curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" -H "Content-Type: application/json" -d "{\"contents\":[{\"parts\":[{\"text\":\"Say hello\"}]}]}"

