// Schema specifications for Gemini Structured Output (responseSchema option)

export const preVisitSchema = {
  type: 'OBJECT',
  properties: {
    urgency: {
      type: 'STRING',
      enum: ['Low', 'Medium', 'High'],
    },
    chiefComplaint: {
      type: 'STRING',
      description: 'Concise summary of the patient complaint.',
    },
    keySymptoms: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Extracted key symptoms.',
    },
    suggestedQuestions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Suggested questions the doctor may ask the patient. Maximum 3 questions.',
    },
  },
  required: ['urgency', 'chiefComplaint', 'keySymptoms', 'suggestedQuestions'],
};

export const postVisitSchema = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'A friendly and clear explanation of what was discussed, translated to patient-friendly language.',
    },
    medications: {
      type: 'ARRAY',
      description: 'Clarifying details on doctor prescribed medications. Do not invent any medication.',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          dosage: { type: 'STRING' },
          frequency: { type: 'STRING' },
          duration: { type: 'STRING' },
        },
        required: ['name', 'dosage', 'frequency', 'duration'],
      },
    },
    followUp: {
      type: 'STRING',
      description: 'Instructions on follow-up timeline or milestones.',
    },
    precautions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Safety guidelines or warnings related to the symptoms and prescription.',
    },
  },
  required: ['summary', 'medications', 'followUp', 'precautions'],
};
