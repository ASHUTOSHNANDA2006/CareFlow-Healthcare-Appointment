import { ai } from '../../config/genai.js';
import { preVisitSchema } from './schemas.js';

export const analyzeSymptoms = async (symptomsText) => {
  console.log('[AI PRE-VISIT REQUEST] Input symptoms:', symptomsText);

  if (!ai) {
    console.error('[Pre-Visit AI Error]: Google GenAI client is not initialized.');
    throw new Error('Google GenAI client is not initialized.');
  }

  const prompt = `Analyse these symptoms and return:
urgency level (Low / Medium / High),
chief complaint,
key symptoms,
and three suggested questions for the doctor.

Do not diagnose the patient. Label output clearly matching the response schema.
Symptom Text: "${symptomsText}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: preVisitSchema,
      },
    });

    const resultText = response.text;
    const parsed = JSON.parse(resultText);

    if (parsed.suggestedQuestions && parsed.suggestedQuestions.length > 3) {
      parsed.suggestedQuestions = parsed.suggestedQuestions.slice(0, 3);
    }

    console.log('[AI PRE-VISIT RESPONSE] Status: SUCCESS, Provider: Gemini (gemini-2.0-flash)');
    console.log('[AI PRE-VISIT RESPONSE] Urgency:', parsed.urgency, '| Chief Complaint:', parsed.chiefComplaint);

    return parsed;
  } catch (error) {
    console.error('[Pre-Visit AI pipeline error]:', error.message);
    throw error; // Caller marks SymptomReport.aiStatus = 'FAILED'
  }
};
