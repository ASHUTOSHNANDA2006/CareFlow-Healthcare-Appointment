import { ai } from '../../config/genai.js';
import { postVisitSchema } from './schemas.js';

/**
 * Extracts retry delay seconds from a Gemini 429 error message.
 */
const extractRetryDelay = (errorMessage) => {
  const match = errorMessage?.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) : 60;
};

/**
 * Calls Gemini with a single retry on 429 quota errors.
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
        if (delaySec <= 10) {
          console.warn(`[Post-Visit AI] 429 quota hit. Retrying in ${delaySec}s...`);
          await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
          continue;
        }
      }
      break;
    }
  }

  throw lastError;
};

export const summarizeVisit = async (clinicalNotes, prescription) => {
  console.log('[AI POST-VISIT REQUEST] Clinical notes length:', clinicalNotes?.length);
  console.log('[AI POST-VISIT REQUEST] Prescription items:', prescription?.length || 0);

  if (!ai) {
    console.error('[Post-Visit AI Error]: Google GenAI client is not initialized.');
    throw new Error('AI_NOT_CONFIGURED');
  }

  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps:
Clinical Notes: "${clinicalNotes}"
Prescriptions: ${JSON.stringify(prescription)}

Do not invent any new medications or modify the names or dosages of the prescribed medications.`;

  try {
    const parsed = await callGeminiWithRetry(prompt, postVisitSchema, 1);

    // Business validation: match medication names to prescription
    if (prescription && prescription.length > 0) {
      const validNames = new Set(prescription.map((p) => p.name.toLowerCase()));
      parsed.medications = parsed.medications.filter((med) => validNames.has(med.name.toLowerCase()));
    }

    console.log('[AI POST-VISIT] SUCCESS — Summary length:', parsed.summary?.length);
    return parsed;
  } catch (error) {
    const is429 = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');

    if (is429) {
      const delaySec = extractRetryDelay(error.message);
      console.warn(`[Post-Visit AI] Daily quota exceeded. Retry in ~${delaySec}s.`);
      const quotaError = new Error('AI_QUOTA_EXCEEDED');
      quotaError.code = 'AI_QUOTA_EXCEEDED';
      quotaError.retryAfterSeconds = delaySec;
      throw quotaError;
    }

    console.error('[Post-Visit AI] Pipeline error:', error.message);
    throw error;
  }
};
