import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleApiError = async (error, retryCount = 0) => {
  if (retryCount < MAX_RETRIES && error.response?.status >= 500) {
    await sleep(RETRY_DELAY * Math.pow(2, retryCount));
    return true; // Retry the request
  }
  
  let errorMessage = 'An error occurred. Please try again.';
  
  if (error.response) {
    console.error('API Error Response:', error.response);
    switch (error.response.status) {
      case 400:
        errorMessage = error.response.data?.detail || 'Invalid request. Please check your input.';
        break;
      case 401:
        errorMessage = 'Unauthorized. Please log in again.';
        break;
      case 403:
        errorMessage = 'Access denied.';
        break;
      case 404:
        errorMessage = 'Resource not found.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      default:
        if (error.response.status >= 500) {
          errorMessage = error.response.data?.detail || 'Server error. Please try again later.';
        }
    }
  } else if (error.request) {
    console.error('API Request Error:', error.request);
    errorMessage = 'Network error. Please check your connection.';
  } else {
    console.error('API Error:', error.message);
  }

  throw new Error(errorMessage);
};

// API endpoints
const ENDPOINTS = {
  UPLOAD: '/api/upload',
  TRANSCRIBE: '/api/transcribe',
  CHAT: '/api/chat',
  HISTORY: '/api/history',
  DELETE_HISTORY: (id) => `/api/history/${id}`
};

export const transcribeAudio = async (audioData, retryCount = 0) => {
  try {
    console.log('Sending audio data to server...');
    
    // Validate audio data
    if (!audioData) {
      throw new Error('No audio data provided');
    }

    // Clean up base64 data if needed
    let cleanAudioData = audioData;
    if (audioData.includes(',')) {
      cleanAudioData = audioData.split(',')[1];
    }

    const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.TRANSCRIBE}`, {
      audio_data: cleanAudioData,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    console.log('Transcription response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Transcription error:', error);
    const shouldRetry = await handleApiError(error, retryCount);
    if (shouldRetry) {
      console.log('Retrying transcription...');
      return transcribeAudio(audioData, retryCount + 1);
    }
    throw error;
  }
};

export const chatWithAI = async (messages, retryCount = 0) => {
  try {
    const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.CHAT}`, {
      messages: messages
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error) {
    const shouldRetry = await handleApiError(error, retryCount);
    if (shouldRetry) {
      return chatWithAI(messages, retryCount + 1);
    }
    throw error;
  }
};

export const uploadDocument = async (file, retryCount = 0) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.UPLOAD}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error) {
    const shouldRetry = await handleApiError(error, retryCount);
    if (shouldRetry) {
      return uploadDocument(file, retryCount + 1);
    }
    throw error;
  }
};

// History related endpoints
export const fetchHistory = async ({
  page = 1,
  perPage = 10,
  typeFilter = null,
  search = null,
  sort = 'desc'
} = {}, retryCount = 0) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort
    });

    if (typeFilter) {
      params.append('type_filter', typeFilter);
    }
    if (search) {
      params.append('search', search);
    }

    const response = await axios.get(`${API_BASE_URL}${ENDPOINTS.HISTORY}?${params.toString()}`, {
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error) {
    const shouldRetry = await handleApiError(error, retryCount);
    if (shouldRetry) {
      return fetchHistory({ page, perPage, typeFilter, search, sort }, retryCount + 1);
    }
    throw error;
  }
};

export const deleteHistoryItem = async (id, retryCount = 0) => {
  try {
    await axios.delete(`${API_BASE_URL}${ENDPOINTS.DELETE_HISTORY(id)}`, {
      timeout: 30000, // 30 second timeout
    });
  } catch (error) {
    const shouldRetry = await handleApiError(error, retryCount);
    if (shouldRetry) {
      return deleteHistoryItem(id, retryCount + 1);
    }
    throw error;
  }
};
