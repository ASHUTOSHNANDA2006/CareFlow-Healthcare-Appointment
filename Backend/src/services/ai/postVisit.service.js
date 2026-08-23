import { ai } from '../../config/genai.js';
import { postVisitSchema } from './schemas.js';

export const summarizeVisit = async (clinicalNotes, prescription) => {
  console.log('[AI POST-VISIT REQUEST] Clinical notes:', clinicalNotes);
  console.log('[AI POST-VISIT REQUEST] Prescription items:', prescription?.length || 0);

  if (!ai) {
    console.error('[Post-Visit AI Error]: Google GenAI client is not initialized.');
    throw new Error('Google GenAI client is not initialized.');
  }

  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps:
Clinical Notes: "${clinicalNotes}"
Prescriptions: ${JSON.stringify(prescription)}

Do not invent any new medications or modify the names or dosages of the prescribed medications.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: postVisitSchema,
      },
    });

    const parsed = JSON.parse(response.text);

    // Business validation: Match medication names to prescription
    if (prescription && prescription.length > 0) {
      const validNames = new Set(prescription.map((p) => p.name.toLowerCase()));
      parsed.medications = parsed.medications.filter((med) => validNames.has(med.name.toLowerCase()));
    }

    console.log('[AI POST-VISIT RESPONSE] Status: SUCCESS, Provider: Gemini (gemini-2.0-flash)');
    console.log('[AI POST-VISIT RESPONSE] Summary length:', parsed.summary?.length);

    return parsed;
  } catch (error) {
    console.error('[Post-Visit AI pipeline error]:', error.message);
    throw error; // Caller marks VisitNote.aiStatus = 'FAILED'
  }
};
