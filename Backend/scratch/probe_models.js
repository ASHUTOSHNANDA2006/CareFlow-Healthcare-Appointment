import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config/env.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// Try several model names to find which ones work
const modelsToTry = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

for (const modelName of modelsToTry) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Say "hello" in one word.',
    });
    console.log(`✅ ${modelName} works: "${response.text?.trim()}"`);
  } catch (err) {
    const statusMatch = err.message?.match(/got status: (\d+ \w+)/);
    console.log(`❌ ${modelName}: ${statusMatch?.[1] || err.message?.split('\n')[0]}`);
  }
}
