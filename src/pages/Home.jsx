import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/solid';
import { transcribeAudio, chatWithAI } from '../services/api';

function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          try {
            setIsLoading(true);
            const base64Audio = reader.result;
            const { transcript } = await transcribeAudio(base64Audio);
            
            // Add user message
            const userMessage = { role: 'user', content: transcript };
            setMessages(prev => [...prev, userMessage]);
            
            // Get AI response
            const { response } = await chatWithAI([...messages, userMessage]);
            
            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
          } catch (error) {
            console.error('Error processing audio:', error);
          } finally {
            setIsLoading(false);
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsListening(false);
    }
  };

  const handleVoiceInteraction = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {/* Welcome Message */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-gray-800 dark:text-white mb-8"
      >
        Welcome to Your AI Assistant
      </motion.h1>

      {/* Voice Widget */}
      <motion.div
        className="relative mb-12"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={handleVoiceInteraction}
          disabled={isLoading}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center 
            ${isListening 
              ? 'bg-red-500 animate-pulse-slow' 
              : isLoading
                ? 'bg-gray-400'
                : 'bg-primary hover:bg-primary-dark'
            } text-white shadow-lg
            before:content-[''] before:absolute before:inset-0 
            before:rounded-full before:bg-primary before:opacity-20 
            before:animate-ping`}
        >
          {isListening ? (
            <StopIcon className="w-12 h-12" />
          ) : (
            <MicrophoneIcon className="w-12 h-12" />
          )}
        </button>
      </motion.div>

      {/* Chat Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {isListening ? 'Listening...' : isLoading ? 'Processing...' : 'Click the microphone to start'}
        </h2>
        <div 
          ref={scrollRef}
          className="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded p-4 space-y-4"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-600 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
