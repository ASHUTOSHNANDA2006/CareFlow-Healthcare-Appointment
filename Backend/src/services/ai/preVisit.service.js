import { ai } from '../../config/genai.js';
import { preVisitSchema } from './schemas.js';

export const analyzeSymptoms = async (symptomsText) => {
  // If GenAI is not initialized, fallback gracefully
  if (!ai) {
    console.warn('[AI Service Warning]: Google GenAI is not configured. Falling back to mock output.');
    return {
      urgency: 'Medium',
      chiefComplaint: 'Symptom analysis (Mock)',
      keySymptoms: ['Symptoms analysis unavailable'],
      suggestedQuestions: ['What is the symptom duration?', 'Are there any trigger factors?'],
    };
  }

  const prompt = `Analyze the following patient symptoms and return a structured JSON response.
Do not diagnose the patient. Label output clearly matching the response schema.
Symptom Text: "${symptomsText}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: preVisitSchema,
      },
    });

    const resultText = response.text;
    const parsed = JSON.parse(resultText);

    // Business validation constraints
    if (parsed.suggestedQuestions && parsed.suggestedQuestions.length > 3) {
      parsed.suggestedQuestions = parsed.suggestedQuestions.slice(0, 3);
    }

    return parsed;
  } catch (error) {
    console.error('[Pre-Visit AI pipeline error]:', error.message);
    throw error; // Let callers handle storage status update to FAILED
  }
};
