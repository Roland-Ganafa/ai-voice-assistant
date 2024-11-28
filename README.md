# AI Voice Assistant

A sophisticated AI-powered voice interaction platform with advanced document processing and history management capabilities. Built with React, FastAPI, and various AI services.

## Features

- 🎙️ Voice-to-Text Transcription
- 💬 AI-powered Conversations
- 📄 Document Processing
- 📱 Responsive Design
- 🌙 Dark Mode Support
- 📊 Advanced History Management
- 🔍 Search Functionality
- ⚡ Real-time Updates

## Live Demo

Frontend: [https://effortless-clafoutis-323a84.netlify.app/](https://effortless-clafoutis-323a84.netlify.app/)

## Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- Framer Motion
- React Router
- Axios

### Backend
- FastAPI
- Python 3.9+
- OpenAI API
- Google Cloud Speech-to-Text
- Google Cloud Storage

## Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- OpenAI API Key
- Google Cloud Project with Speech-to-Text API enabled

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-voice-assistant.git
cd ai-voice-assistant
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:

Frontend (.env):
```
VITE_API_URL=http://localhost:8000/api
```

Backend (.env):
```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLOUD_CREDENTIALS=your_google_cloud_credentials_json
```

5. Start the development servers:

Frontend:
```bash
npm run dev
```

Backend:
```bash
cd backend
uvicorn main:app --reload
```

## Deployment

### Frontend (Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

### Backend (Render)
1. Push to GitHub
2. Connect to Render
3. Deploy as a Web Service using Docker

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
