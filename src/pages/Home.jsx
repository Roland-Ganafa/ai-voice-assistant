import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/solid';
import { transcribeAudio, chatWithAI } from '../services/api';
import { toast } from 'react-hot-toast';

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
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      console.log('Got media stream:', stream.getAudioTracks()[0].getSettings());

      // Create and configure MediaRecorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error('Audio format not supported');
        toast.error('This browser does not support the required audio format');
        return;
      }
      
      mediaRecorder.current = new MediaRecorder(stream, options);
      console.log('MediaRecorder created with state:', mediaRecorder.current.state);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        console.log('Recording stopped. Processing', audioChunks.current.length, 'chunks');
        try {
          if (audioChunks.current.length === 0) {
            console.error('No audio chunks recorded');
            toast.error('No audio data recorded');
            return;
          }

          const audioBlob = new Blob(audioChunks.current, { 
            type: 'audio/webm;codecs=opus'
          });
          console.log('Created audio blob:', audioBlob.size, 'bytes');
          
          if (audioBlob.size === 0) {
            console.error('Audio blob is empty');
            toast.error('No audio data captured');
            return;
          }

          // Debug: Play the audio back
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          console.log('Created audio URL:', audioUrl);
          
          const reader = new FileReader();
          console.log('Reading audio blob...');
          
          reader.onloadend = async () => {
            console.log('Audio blob read complete');
            try {
              setIsLoading(true);
              const base64Audio = reader.result;
              console.log('Base64 audio length:', base64Audio.length);
              
              const { transcript } = await transcribeAudio(base64Audio);
              console.log('Received transcript:', transcript);
              
              if (!transcript) {
                console.error('No transcript received');
                toast.error('Could not transcribe audio. Please try speaking more clearly.');
                return;
              }

              // Add user message
              const userMessage = { role: 'user', content: transcript };
              setMessages(prev => [...prev, userMessage]);
              toast.success('Audio transcribed successfully');
              
              // Get AI response
              const { response } = await chatWithAI([...messages, userMessage]);
              console.log('Received AI response:', response);
              
              // Add AI response
              setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            } catch (error) {
              console.error('Error processing audio:', error);
              toast.error(error.message || 'Error processing audio. Please try again.');
            } finally {
              setIsLoading(false);
            }
          };

          reader.onerror = (error) => {
            console.error('Error reading audio blob:', error);
            toast.error('Error reading audio data');
            setIsLoading(false);
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing recording:', error);
          toast.error('Error processing recording. Please try again.');
          setIsLoading(false);
        }
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        toast.error('Recording error: ' + event.error.message);
      };

      mediaRecorder.current.start(1000); // Record in 1-second chunks
      console.log('Recording started');
      setIsListening(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow microphone access.');
      } else {
        toast.error('Could not start recording. Please check your microphone.');
      }
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.label);
      });
      setIsListening(false);
      toast.success('Recording stopped');
    } else {
      console.log('MediaRecorder state:', mediaRecorder.current?.state);
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
            } text-white shadow-lg transition-colors
            ${!isLoading && !isListening ? 'hover:bg-opacity-90' : ''}`}
        >
          {isListening ? (
            <StopIcon className="w-12 h-12" />
          ) : (
            <MicrophoneIcon className="w-12 h-12" />
          )}
        </button>
      </motion.div>

      {/* Status Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg text-gray-600 dark:text-gray-300 mb-6"
      >
        {isListening 
          ? 'Listening... Click the button to stop' 
          : isLoading 
            ? 'Processing your message...' 
            : 'Click the microphone button to start speaking'}
      </motion.p>

      {/* Chat Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
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
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Your conversation will appear here
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
