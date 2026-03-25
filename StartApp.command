#!/bin/bash

# Navigate to the directory where this script resides
cd "$(dirname "$0")"

echo "==================================================="
echo "   Achieve Studio School Feedback App Starting...  "
echo "==================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "⚠️ Error: Node.js is not installed on this computer."
    echo "To run this application, you need to install Node.js."
    echo "Please download and install the 'LTS' version from: https://nodejs.org/"
    echo ""
    echo "After installing, double-click this script again."
    read -p "Press [Enter] to exit..."
    exit 1
fi

# Check if .env.local exists, if not, prompt for the AI Provider and API Key
if [ ! -f ".env.local" ]; then
    echo "👋 It looks like this is your first time starting the app!"
    echo "Please choose which AI Provider you want to use:"
    echo "1) Anthropic (Claude) [Default]"
    echo "2) OpenAI (ChatGPT)"
    echo "3) Grok (xAI)"
    echo "4) Google Gemini"
    echo "5) Local Model (Ollama/LM Studio - FREE)"
    echo ""
    read -p "Enter number (1-5): " CHOICE
    
    case $CHOICE in
        2) PROVIDER="openai";;
        3) PROVIDER="grok";;
        4) PROVIDER="gemini";;
        5) PROVIDER="local";;
        *) PROVIDER="anthropic";;
    esac

    echo "VITE_AI_PROVIDER=$PROVIDER" > .env.local

    if [ "$PROVIDER" != "local" ]; then
        echo ""
        echo "You chose $PROVIDER."
        read -p "Please paste your API Key here and press [Enter]: " API_KEY
        if [ -n "$API_KEY" ]; then
            echo "VITE_AI_API_KEY=$API_KEY" >> .env.local
            echo "✅ Configuration saved locally."
        else
            echo "❌ API Key cannot be empty. Exiting."
            rm .env.local
            read -p "Press [Enter] to exit..."
            exit 1
        fi
    else
        echo "✅ Configured for Local Models."
    fi
    echo ""
fi

# Check if node_modules is missing, meaning it hasn't been set up yet
if [ ! -d "node_modules" ]; then
    echo "📦 First time setup: Installing required dependencies... This may take a minute."
    npm install
fi

echo "🚀 Starting the application..."
echo "A new browser window should open automatically."
echo "Keep this window open while using the app."
echo ""
echo "To stop the app, close this window or press Ctrl+C."
echo "==================================================="

# Start the dev server in the background and open the browser automatically
npm run dev -- --open
