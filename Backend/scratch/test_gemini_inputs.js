import { analyzeSymptoms } from '../src/services/ai/preVisit.service.js';
import { summarizeVisit } from '../src/services/ai/postVisit.service.js';

async function testGeminiInputs() {
  console.log('=== TESTING REAL GEMINI (gemini-3.6-flash) WITH 2 DIFFERENT INPUTS ===\n');

  console.log('--- TEST INPUT 1 ---');
  const input1 = "High fever, severe sore throat and difficulty swallowing for three days.";
  try {
    const res1 = await analyzeSymptoms(input1);
    console.log('INPUT 1 SUCCESS:');
    console.log(JSON.stringify(res1, null, 2));
  } catch (e) {
    console.error('INPUT 1 FAIL:', e.message);
  }

  console.log('\n--- TEST INPUT 2 ---');
  const input2 = "Lower back pain after lifting a heavy box yesterday.";
  try {
    const res2 = await analyzeSymptoms(input2);
    console.log('INPUT 2 SUCCESS:');
    console.log(JSON.stringify(res2, null, 2));
  } catch (e) {
    console.error('INPUT 2 FAIL:', e.message);
  }

  console.log('\n--- TEST POST-VISIT AI ---');
  try {
    const resPost = await summarizeVisit(
      "Lumbar muscle strain diagnosed. Advised bed rest and cold compress.",
      [{ name: "Ibuprofen", dosage: "400mg", frequency: "Twice daily", duration: "5 days" }]
    );
    console.log('POST-VISIT AI SUCCESS:');
    console.log(JSON.stringify(resPost, null, 2));
  } catch (e) {
    console.error('POST-VISIT AI FAIL:', e.message);
  }
}

testGeminiInputs();
