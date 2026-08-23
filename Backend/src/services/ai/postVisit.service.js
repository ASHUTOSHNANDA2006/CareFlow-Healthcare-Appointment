import { ai } from '../../config/genai.js';
import { postVisitSchema } from './schemas.js';

export const summarizeVisit = async (clinicalNotes, prescription) => {
  if (!ai) {
    console.warn('[AI Service Warning]: Google GenAI is not configured. Falling back to mock output.');
    return {
      summary: 'Visit summary (Mock fallback due to configuration missing)',
      medications: prescription || [],
      followUp: 'Follow up as requested.',
      precautions: ['Follow general precautions.'],
    };
  }

  const prompt = `Translate the following clinical notes and explain the prescriptions in simple, patient-friendly language.
Do not invent any new medications or modify the names or dosages of the prescribed medications.
Clinical Notes: "${clinicalNotes}"
Prescriptions: ${JSON.stringify(prescription)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: postVisitSchema,
      },
    });

    const parsed = JSON.parse(response.text);

    // Business validation: Match medication names to prescription
    const validNames = new Set(prescription.map((p) => p.name.toLowerCase()));
    parsed.medications = parsed.medications.filter((med) => validNames.has(med.name.toLowerCase()));

    return parsed;
  } catch (error) {
    console.error('[Post-Visit AI pipeline error]:', error.message);
    throw error;
  }
};
