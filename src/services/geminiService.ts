import { GoogleGenAI, Type } from "@google/genai";
import { Niche, TwitterPost, Trend, Region, ContentIdea } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function fetchTrendsForNiches(selectedNiches: Niche[], region: Region = 'Global'): Promise<Trend[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Identify the top 2-3 trending topics, viral hashtags, and breaking news specifically on X (Twitter) right now in the ${region} region for each of these niches: ${selectedNiches.join(", ")}.
    
    Use the Google Search tool to find actual real-time data from X.com, trend-tracking sites, or news sites reporting on X's current viral discourse in ${region}.
    
    For each niche, provide:
    1. The trending topic or hashtag.
    2. A brief description of why it's trending (1 sentence).
    3. Estimated volume or "velocity" if available (e.g. "50k posts", "Exploding", "Rising").
    4. 2-3 specific examples of viral tweets, user-generated content, or popular takes related to this topic.
    5. 2-3 detailed viral tweets (user name, handle, content, likes, retweets).
    6. A sentiment analysis of the conversation (percentage of positive, neutral, negative, and an overall label).
    
    Return the result as a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            niche: { type: Type.STRING },
            topic: { type: Type.STRING },
            volume: { type: Type.STRING },
            description: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            viralTweets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  user: { type: Type.STRING },
                  handle: { type: Type.STRING },
                  content: { type: Type.STRING },
                  likes: { type: Type.STRING },
                  retweets: { type: Type.STRING }
                },
                required: ["user", "handle", "content", "likes", "retweets"]
              }
            },
            sentiment: {
              type: Type.OBJECT,
              properties: {
                positive: { type: Type.NUMBER },
                neutral: { type: Type.NUMBER },
                negative: { type: Type.NUMBER },
                label: { type: Type.STRING }
              },
              required: ["positive", "neutral", "negative", "label"]
            }
          },
          required: ["niche", "topic", "description", "examples", "viralTweets", "sentiment"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function discoverTrendingNiches(region: Region = 'Global'): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Identify the top 10 most viral and trending categories or "niches" specifically on X (Twitter) right now in the ${region} region.
    
    Use the Google Search tool to find actual real-time data from X.com, trend-tracking sites, or news sites reporting on X's current viral discourse in ${region}.
    
    Return the result as a JSON array of strings, where each string is a concise category name (e.g., "AI Tech", "EPL Football", "US Elections", "K-Pop").
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function generateAIImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-quality, professional social media photography for: ${prompt}. Cinematic lighting, 8k resolution, trending on X style.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      const base64EncodeString = imagePart.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    // Fallback to placeholder if generation fails or quota exceeded
    const encoded = encodeURIComponent(prompt);
    return `https://loremflickr.com/800/450/${encoded}?lock=${Math.floor(Math.random() * 1000)}`;
  }
}

export async function generateTwitterPosts(selectedNiches: Niche[], region: Region = 'Global'): Promise<TwitterPost[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Simulate a direct API call to X (Twitter) trending endpoints by searching for the current top 20 trending topics, viral hashtags, and breaking news specifically on X.com right now in the ${region} region for these niches: ${selectedNiches.join(", ")}.
    
    Use the Google Search tool to find actual real-time data from X.com, trend-tracking sites (like Trends24 or similar), or news sites reporting on X's current viral discourse in ${region}.
    
    For each niche provided, generate a set of viral posts. Total posts: 5.
    
    Each post must:
    1. Be based on a REAL trending topic or viral conversation currently happening on X in ${region}.
    2. Be written in a punchy, high-engagement style (max 250 characters).
    3. Include 3-5 relevant hashtags that are currently trending for that specific topic.
    4. Provide a descriptive image search term (2-4 words) for a high-quality, relevant photo.
    5. Suggest a specific engagement tactic (e.g., "Ask a question about [topic]", "Run a poll on [options]", "Encourage replies by [method]").
    
    Return the result as a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            niche: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            imageSearchTerm: { type: Type.STRING },
            engagementTactic: { type: Type.STRING }
          },
          required: ["niche", "content", "hashtags", "imageSearchTerm", "engagementTactic"]
        }
      }
    }
  });

  const postsData = JSON.parse(response.text || "[]");
  
  // Generate images in parallel
  const postsWithImages = await Promise.all(postsData.map(async (post: any) => {
    const imageUrl = await generateAIImage(post.imageSearchTerm);
    return {
      id: Math.random().toString(36).substring(7),
      ...post,
      imageUrl,
      timestamp: Date.now()
    };
  }));

  return postsWithImages;
}

export async function regenerateSinglePost(niche: Niche, region: Region = 'Global', instruction?: string): Promise<TwitterPost> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Simulate a direct API call to X (Twitter) trending endpoints to identify ONE high-engagement trending topic or viral debate currently happening on X.com in the ${region} region for the niche: ${niche}.
    
    Use the Google Search tool to find actual real-time data from X.com or trend-tracking sites for ${region}.
    
    ${instruction ? `CRITICAL INSTRUCTION: The user wants you to refine the post with this specific feedback: "${instruction}". 
    - If they ask for a "Thread", return the content as multiple numbered tweets separated by "---".
    - If they ask for a specific length (e.g., "under 100 chars"), strictly adhere to it.
    - If they ask to "Expand", provide a more detailed and comprehensive post or thread.
    Adjust the tone, length, or structure accordingly while keeping it relevant to the trend.` : 'Write a punchy, viral post (max 250 characters).'}
    Include 3-5 hashtags.
    Provide a descriptive image search term for Unsplash.
    Suggest a specific engagement tactic (e.g., "Ask a question about [topic]", "Run a poll on [options]", "Encourage replies by [method]").
    
    Return as JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          niche: { type: Type.STRING },
          content: { type: Type.STRING },
          hashtags: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          imageSearchTerm: { type: Type.STRING },
          engagementTactic: { type: Type.STRING }
        },
        required: ["niche", "content", "hashtags", "imageSearchTerm", "engagementTactic"]
      }
    }
  });

  const postData = JSON.parse(response.text || "{}");
  const imageUrl = await generateAIImage(postData.imageSearchTerm);
  
  return {
    id: Math.random().toString(36).substring(7),
    ...postData,
    imageUrl,
    timestamp: Date.now()
  };
}

export async function generateContentIdeas(selectedNiches: Niche[], region: Region = 'Global'): Promise<ContentIdea[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Based on current viral trends on X (Twitter) in the ${region} region for these niches: ${selectedNiches.join(", ")}, 
    generate 6 unique, high-potential content IDEAS (not full posts).
    
    For each idea, provide:
    1. A catchy title for the idea.
    2. A "Viral Hook" (the opening line that stops the scroll).
    3. The "Angle" or unique perspective of the content.
    4. Why it has potential to go viral.
    5. The best format for this idea (Single Post, Thread, Poll, or Visual).
    
    Return the result as a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            niche: { type: Type.STRING },
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            angle: { type: Type.STRING },
            potentialViralFactor: { type: Type.STRING },
            suggestedFormat: { type: Type.STRING, enum: ['Single Post', 'Thread', 'Poll', 'Visual'] }
          },
          required: ["niche", "title", "hook", "angle", "potentialViralFactor", "suggestedFormat"]
        }
      }
    }
  });

  const ideasData = JSON.parse(response.text || "[]");
  
  return ideasData.map((idea: any) => ({
    id: Math.random().toString(36).substring(7),
    ...idea
  }));
}
