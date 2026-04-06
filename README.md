# 🌌 Cosmos – Proximity Chat

A real-time 2D virtual environment where users move, interact, and automatically chat when within proximity.

## 🚀 Features
- 🔐 Authentication (unique usernames + persistent colors)
- 🎮 Smooth movement (WASD / Arrow keys) on PixiJS canvas
- 👥 Real-time multiplayer (Socket.IO)
- 📍 Proximity detection (70px radius) with visual indicator
- 💬 Auto chat connection with message history (MongoDB TTL)
- 🎨 Clean UI with glassmorphism and collapsible chat panel

## 🛠️ Tech Stack
- **Frontend:** React (Vite), PixiJS, Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB

## ⚡ Getting Started


# Clone repository
git clone https://github.com/Vaish230/cosmosProject.git
cd cosmosProject

# Backend setup
cd server
npm install
npm run dev

# Frontend setup (new terminal)
cd ../client
npm install
npm run dev

Open: http://localhost:5173

PORT=5000
MONGODB_URI=mongodb+srv://vaishnavi230906_db_user:j9f0Al7xZwXmmdYc@cosmoo.rxarvir.mongodb.net/cosmos_video?retryWrites=true&w=majority&appName=cosmoo
JWT_SECRET=mysecretkey123
CLIENT_URL=http://localhost:5173
