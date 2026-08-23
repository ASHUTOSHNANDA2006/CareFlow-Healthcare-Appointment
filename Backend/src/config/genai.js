import { GoogleGenAI } from '@google/genai';
import { config } from './env.js';

let ai = null;

// Initialize Google GenAI SDK client if API Key is configured
if (config.geminiApiKey && config.geminiApiKey !== 'placeholder_gemini_api_key') {
  ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  console.log('Google GenAI SDK Client successfully initialized.');
} else {
  console.warn('Warning: GEMINI_API_KEY is not configured. AI operations will use mock fallbacks.');
}

export { ai };
