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
    let groqModelName = "llama-3.1-8b-instant";
    return new ChatGroq({
      apiKey: apiKey,
      model: groqModelName,
      temperature: defaultTemp,
      maxTokens: 8192,
    });
  }

  if (apiProvider === "openai") {
    return new ChatOpenAI({
      apiKey: apiKey,
      modelName: "gpt-4o",
      temperature: defaultTemp,
      maxTokens: 8192,
    });
  }

  return new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: defaultModel,
    temperature: defaultTemp,
    maxOutputTokens: 8192,
  });
}

export function getEmbeddings(req: Request) {
  const provider = req.headers.get("x-embedding-provider") || "gemini";
  const apiKey = req.headers.get("x-embedding-key") || req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Embeddings API key is required. Please set it in Project Settings.");
  }

  let embeddings;
  if (provider === "openai") {
    embeddings = new OpenAIEmbeddings({
      apiKey: apiKey,
      modelName: "text-embedding-3-small",
      dimensions: 768,
    });
  } else if (provider === "cohere") {
    embeddings = new CohereEmbeddings({
      apiKey: apiKey,
      model: "embed-english-v3.0",
    });
  } else {
    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      model: "text-embedding-004",
    });
  }

  // Force exactly 768 dimensions for Supabase compatibility
  const force768 = (vec: number[]) => {
    if (vec.length === 768) return vec;
    let newVec = vec.slice(0, 768);
    if (newVec.length < 768) {
      newVec = newVec.concat(new Array(768 - newVec.length).fill(0));
    }
    const mag = Math.sqrt(newVec.reduce((sum, val) => sum + val * val, 0));
    return newVec.map(v => v / (mag || 1));
  };

  const originalEmbedQuery = embeddings.embedQuery.bind(embeddings);
  embeddings.embedQuery = async (text: string) => {
    const vec = await originalEmbedQuery(text);
    return force768(vec);
  };

  const originalEmbedDocuments = embeddings.embedDocuments.bind(embeddings);
  embeddings.embedDocuments = async (texts: string[]) => {
    const vecs = await originalEmbedDocuments(texts);
    return vecs.map(force768);
  };

  return embeddings;
}
