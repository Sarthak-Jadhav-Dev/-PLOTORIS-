"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export function FetchInterceptor() {
  const isIntercepting = useRef(false);

  useEffect(() => {
    if (isIntercepting.current) return;
    isIntercepting.current = true;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          // Clone the response to read the body without consuming the original stream
          const clone = response.clone();
          try {
            const text = await clone.text();
            let errMsg = "";
            try {
              const data = JSON.parse(text);
              errMsg = data?.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : text;
            } catch (e) {
              errMsg = text;
            }
            
            const lowerErrMsg = errMsg.toLowerCase();
            const isRateLimit = response.status === 429 || 
                                lowerErrMsg.includes("429") || 
                                lowerErrMsg.includes("rate limit") || 
                                lowerErrMsg.includes("too many requests") ||
                                lowerErrMsg.includes("quota");
            
            if (isRateLimit) {
              let specificKey = "Text or Embedding API keys";
              if (lowerErrMsg.includes("groq") || lowerErrMsg.includes("llama")) {
                  specificKey = "Groq Text API Key";
              } else if (lowerErrMsg.includes("cohere")) {
                  specificKey = "Cohere Embeddings API Key";
              } else if (lowerErrMsg.includes("openai")) {
                  specificKey = "OpenAI API Key";
              } else if (lowerErrMsg.includes("gemini")) {
                  specificKey = "Gemini API Key";
              }

              toast.error(
                `API Rate limit reached for ${specificKey}. Please update your keys in Project Settings.`, 
                {
                  duration: 8000,
                  style: {
                    background: '#222',
                    color: '#fff',
                    border: '1px solid #ef4444',
                    fontWeight: '500'
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                }
              );
            }
          } catch (e) {
             // Ignore read errors
          }
        }
        
        return response;
      } catch (err: any) {
        throw err;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
      isIntercepting.current = false;
    };
  }, []);

  return null;
}
