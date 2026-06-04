#!/bin/bash
# Broq AI Research Agent - Frontend Quick Start Script
# Run this script to set up and start the frontend

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  🚀 Broq AI Research Agent - Frontend Setup               ║"
echo "║     Professional AI Research Platform                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🎉 Frontend is ready!"
echo ""
echo "📍 Available commands:"
echo "   npm run dev      → Start development server (http://localhost:5173)"
echo "   npm run build    → Create production build"
echo "   npm run preview  → Preview production build"
echo "   npm run lint     → Run ESLint checks"
echo ""
echo "🚀 Starting development server..."
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

npm run dev
