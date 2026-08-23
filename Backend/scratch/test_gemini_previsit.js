import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config/env.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const preVisitSchema = {
  type: 'OBJECT',
  properties: {
    urgency: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
    chiefComplaint: { type: 'STRING' },
    keySymptoms: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestedQuestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['urgency', 'chiefComplaint', 'keySymptoms', 'suggestedQuestions'],
};

try {
  console.log('Testing Gemini 3.6 Flash pre-visit schema...');
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'Patient has fever, headache and fatigue for 2 days.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: preVisitSchema,
    },
  });
  console.log('SUCCESS raw text:', response.text);
  const parsed = JSON.parse(response.text);
  console.log('Parsed urgency:', parsed.urgency);
  console.log('Parsed chiefComplaint:', parsed.chiefComplaint);
  console.log('Parsed keySymptoms:', parsed.keySymptoms);
  console.log('Parsed suggestedQuestions:', parsed.suggestedQuestions);
} catch (err) {
  console.error('FAILED model gemini-3.6-flash:', err.message);
  // Try gemini-2.0-flash-exp as fallback
  try {
    console.log('\nTrying gemini-2.0-flash-exp as fallback...');
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Analyze patient symptoms: fever, headache, fatigue for 2 days. Return JSON with urgency (Low/Medium/High), chiefComplaint, keySymptoms array, suggestedQuestions array.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: preVisitSchema,
      },
    });
    console.log('Fallback SUCCESS:', response2.text);
  } catch (err2) {
    console.error('Fallback also failed:', err2.message);
    // Try plain text approach
    try {
      console.log('\nTrying plain text approach with gemini-2.0-flash...');
      const response3 = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Analyze symptoms: fever, headache, fatigue for 2 days.
Return ONLY a JSON object with these exact fields:
{
  "urgency": "Low" or "Medium" or "High",
  "chiefComplaint": "brief description",
  "keySymptoms": ["symptom1", "symptom2"],
  "suggestedQuestions": ["question1", "question2", "question3"]
}`,
      });
      console.log('Plain text approach SUCCESS:', response3.text?.substring(0, 200));
    } catch (err3) {
      console.error('Plain text also failed:', err3.message);
    }
  }
}
