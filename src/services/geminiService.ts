import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function parseResume(resumeText: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract skills from the following resume text. Return a JSON array of strings.
    
    Resume Text:
    ${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse resume skills", e);
    return [];
  }
}

export async function recommendCompanies(studentSkills: string[], studentCgpa: number, companies: any[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the student's skills and CGPA, recommend the top 3 companies from the list. Provide a brief reason for each recommendation.
    
    Student Skills: ${studentSkills.join(", ")}
    Student CGPA: ${studentCgpa}
    
    Companies:
    ${JSON.stringify(companies)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            companyId: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["companyId", "reason"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to get company recommendations", e);
    return [];
  }
}

export async function suggestSkillGaps(studentSkills: string[], companyRequiredSkills: string[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Compare the student's skills with the company's required skills. Suggest which skills the student should learn to be more eligible. Return a JSON array of strings.
    
    Student Skills: ${studentSkills.join(", ")}
    Company Required Skills: ${companyRequiredSkills.join(", ")}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to suggest skill gaps", e);
    return [];
  }
}
