# Connectly — Real-Time Chat Application

Connectly is a full-stack real-time messaging application built using the MERN stack and Socket.IO. It enables users to communicate through instant messaging with live presence updates and a modern, responsive interface.

## ✨ Features

- 🔐 **User Authentication** — Secure signup and login using JWT-based authentication and HTTP-only cookies.
- 💬 **Real-Time Messaging** — Send and receive messages instantly with Socket.IO.
- 🟢 **Online Status** — See when users are online or offline.
- ✍️ **Typing Indicators** — Know when another user is typing.
- ✓✓ **Read Receipts** — Track message delivery and read status.
- 👤 **Profile Pictures** — Upload and display profile pictures.
- 🗑️ **Message Deletion** — Delete messages for yourself or for everyone when permitted.
- 🧹 **Clear Conversation** — Clear messages from your own view without deleting the other participant's messages.
- 📱 **Responsive Design** — Chat on desktop and mobile devices.

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- Zustand
- Socket.IO Client
- Axios
- React Router
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JSON Web Tokens (JWT)
- Cloudinary

## 📁 Project Structure

```text
connectly/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── store/
│   │   └── ...
│   └── ...
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- MongoDB database (local or hosted)
- Cloudinary account for profile picture uploads

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/connectly-mern-chat-app.git
cd connectly-mern-chat-app
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Install dependencies

```bash
cd backend
npm install
```

Open
