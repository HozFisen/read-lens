require('dotenv').config
const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: "AIzaSyAcP3m4HeKcYpY3jRxOyHCqUfIdrHVrxig"});

async function main() {
  try {
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Say hello and give a random number between 0-100",
    });
    console.log(response.text);
  } catch (error) {
    console.log(error)
  }
}

main();
