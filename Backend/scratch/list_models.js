import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config/env.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// List all available models
try {
  const models = await ai.models.list();
  console.log('Available models:');
  for await (const model of models) {
    console.log(' -', model.name, '| supported:', model.supportedGenerationMethods?.join(', '));
  }
} catch (err) {
  console.error('List models error:', err.message);
}
