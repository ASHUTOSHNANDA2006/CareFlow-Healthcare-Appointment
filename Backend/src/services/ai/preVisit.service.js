import { ai } from '../../config/genai.js';
import { preVisitSchema } from './schemas.js';

/**
 * Extracts retry delay seconds from a Gemini 429 error message.
 * Looks for "Please retry in XX.XXXs" pattern.
 */
const extractRetryDelay = (errorMessage) => {
  const match = errorMessage?.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) : 60;
};

/**
 * Calls Gemini with a single retry on 429 quota errors.
 * Returns the parsed AI summary object, or throws after exhausting retries.
 */
const callGeminiWithRetry = async (prompt, schema, maxRetries = 1) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      return JSON.parse(response.text);
    } catch (err) {
      lastError = err;
      const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests') || err.message?.includes('RESOURCE_EXHAUSTED');

      if (is429 && attempt < maxRetries) {
        const delaySec = extractRetryDelay(err.message);
        // Only retry if the delay is short enough (≤ 10 seconds)
        if (delaySec <= 10) {
          console.warn(`[Pre-Visit AI] 429 quota hit. Retrying in ${delaySec}s...`);
          await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
          continue;
        }
      }
      // Don't retry for non-429 or long delays
      break;
    }
  }

  throw lastError;
};

export const analyzeSymptoms = async (symptomsText) => {
  console.log('[AI PRE-VISIT REQUEST] Input symptoms:', symptomsText?.substring(0, 80));

  if (!ai) {
    console.error('[Pre-Visit AI Error]: Google GenAI client is not initialized.');
    throw new Error('AI_NOT_CONFIGURED');
  }

  const prompt = `Analyse these patient symptoms and return a structured JSON response:
urgency level (Low / Medium / High),
chief complaint (brief summary),
key symptoms (extracted list),
and three suggested questions for the doctor.

Do not diagnose the patient. Use professional clinical language.
Symptom Text: "${symptomsText}"`;

  try {
    const parsed = await callGeminiWithRetry(prompt, preVisitSchema, 1);

    if (parsed.suggestedQuestions && parsed.suggestedQuestions.length > 3) {
      parsed.suggestedQuestions = parsed.suggestedQuestions.slice(0, 3);
    }

    console.log('[AI PRE-VISIT] SUCCESS — Urgency:', parsed.urgency, '| Chief Complaint:', parsed.chiefComplaint);
    return parsed;
  } catch (error) {
    const is429 = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    const is404 = error.message?.includes('404') || error.message?.includes('NOT_FOUND');

    if (is429) {
      const delaySec = extractRetryDelay(error.message);
      console.warn(`[Pre-Visit AI] Daily quota exceeded. Retry available in ~${delaySec}s. Symptoms saved, AI analysis pending.`);
      // Create a special quota-exceeded error that callers can detect
      const quotaError = new Error('AI_QUOTA_EXCEEDED');
      quotaError.code = 'AI_QUOTA_EXCEEDED';
      quotaError.retryAfterSeconds = delaySec;
      throw quotaError;
    }

    if (is404) {
      console.error('[Pre-Visit AI] Model not found. Check GEMINI model name in env config.');
      throw new Error('AI_MODEL_NOT_FOUND');
    }

    console.error('[Pre-Visit AI] Pipeline error:', error.message);
    throw error;
  }
};
