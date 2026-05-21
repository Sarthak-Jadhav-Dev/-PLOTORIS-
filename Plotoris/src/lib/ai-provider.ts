import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { CohereEmbeddings } from "@langchain/cohere";

export function getLLM(req: Request, defaultTemp = 0.2, defaultModel = "gemini-2.0-flash") {
  const apiProvider = req.headers.get("x-api-provider") || "gemini";
  const apiKey = req.headers.get("x-api-key") || req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Text generation API key is required. Please set it in Project Settings.");
  }

  if (apiProvider === "groq") {
    let groqModelName = "llama-3.3-70b-versatile";
    return new ChatGroq({
      apiKey: apiKey,
      model: groqModelName,
      temperature: defaultTemp,
    });
  }

  if (apiProvider === "openai") {
    return new ChatOpenAI({
      apiKey: apiKey,
      modelName: "gpt-4o",
      temperature: defaultTemp,
    });
  }

  return new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: defaultModel,
    temperature: defaultTemp,
  });
}

export function getEmbeddings(req: Request) {
  const provider = req.headers.get("x-embedding-provider") || "gemini";
  const apiKey = req.headers.get("x-embedding-key") || req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Embeddings API key is required. Please set it in Project Settings.");
  }

  if (provider === "openai") {
    return new OpenAIEmbeddings({
      apiKey: apiKey,
      modelName: "text-embedding-3-small",
    });
  }

  if (provider === "cohere") {
    return new CohereEmbeddings({
      apiKey: apiKey,
      model: "embed-english-v3.0",
    });
  }

  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    model: "text-embedding-004",
  });
}
