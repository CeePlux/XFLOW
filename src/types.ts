export type Niche = 
  | 'Football' 
  | 'Crypto' 
  | 'Mystery & Conspiracy' 
  | 'Entertainment' 
  | 'Technology' 
  | 'Politics' 
  | 'Business' 
  | 'Sports' 
  | 'Science' 
  | 'Health'
  | 'Relationships & Dating'
  | 'AI & Machine Learning'
  | 'Gaming'
  | 'Fashion & Beauty'
  | 'Travel & Lifestyle'
  | 'Finance & Investing'
  | 'Food & Cooking'
  | 'Mental Health'
  | 'Environment'
  | 'Education'
  | 'Music'
  | 'Movies & TV'
  | 'Anime & Manga'
  | 'Parenting'
  | 'Real Estate'
  | 'Automotive'
  | 'Art & Design';

export type Region = 'Global' | 'United States' | 'United Kingdom' | 'Nigeria' | 'India' | 'Canada' | 'Australia' | 'Germany' | 'France' | 'Brazil';

export interface ViralTweet {
  user: string;
  handle: string;
  content: string;
  likes: string;
  retweets: string;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  label: 'Positive' | 'Neutral' | 'Negative';
}

export interface Trend {
  niche: Niche;
  topic: string;
  volume?: string;
  description: string;
  examples: string[];
  viralTweets: ViralTweet[];
  sentiment: SentimentAnalysis;
}

export interface PostMetrics {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  engagementRate: number;
}

export interface TwitterPost {
  id: string;
  niche: Niche;
  content: string;
  hashtags: string[];
  imageUrl: string;
  imageSearchTerm: string;
  timestamp: number;
  scheduledAt?: number;
  engagementTactic: string;
  metrics?: PostMetrics;
}

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

export interface ContentIdea {
  id: string;
  niche: Niche;
  title: string;
  hook: string;
  angle: string;
  potentialViralFactor: string;
  suggestedFormat: 'Single Post' | 'Thread' | 'Poll' | 'Visual';
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
