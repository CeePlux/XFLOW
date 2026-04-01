import React, { useState, useEffect, useRef } from 'react';
import { 
  Twitter, 
  Copy, 
  Download, 
  RefreshCw, 
  Trash2, 
  Zap, 
  Search, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Calendar,
  Clock,
  Check,
  X,
  History,
  LayoutDashboard,
  ExternalLink,
  TrendingUp,
  ArrowUpRight,
  Globe,
  Moon,
  Sun,
  BarChart3,
  PieChart,
  Users,
  Eye,
  ArrowUp,
  ArrowDown,
  Heart,
  MessageSquare,
  Lightbulb,
  FileText,
  Sparkles,
  Wand2,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { Niche, TwitterPost, GenerationStep, Trend, Region, ContentIdea } from './types';
import { 
  generateTwitterPosts, 
  regenerateSinglePost, 
  fetchTrendsForNiches,
  discoverTrendingNiches,
  generateContentIdeas
} from './services/geminiService';
import Onboarding from './components/Onboarding';

const NICHES: Niche[] = [
  'Football', 'Crypto', 'Mystery & Conspiracy', 'Entertainment', 
  'Technology', 'Politics', 'Business', 'Sports', 'Science', 'Health',
  'Relationships & Dating', 'AI & Machine Learning', 'Gaming',
  'Fashion & Beauty', 'Travel & Lifestyle', 'Finance & Investing',
  'Food & Cooking', 'Mental Health', 'Environment', 'Education',
  'Music', 'Movies & TV', 'Anime & Manga', 'Parenting',
  'Real Estate', 'Automotive', 'Art & Design'
];

const REGIONS: Region[] = [
  'Global', 'United States', 'United Kingdom', 'Nigeria', 'India', 'Canada', 'Australia', 'Germany', 'France', 'Brazil'
];

export default function App() {
  const [selectedNiches, setSelectedNiches] = useState<Niche[]>([]);
  const [dynamicNiches, setDynamicNiches] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region>('Global');
  const [posts, setPosts] = useState<TwitterPost[]>([]);
  const [history, setHistory] = useState<TwitterPost[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<TwitterPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'trends', label: 'Simulating X API fetch', status: 'pending' },
    { id: 'niche', label: 'Parsing X trends', status: 'pending' },
    { id: 'posts', label: 'Generating viral content', status: 'pending' },
    { id: 'images', label: 'AI Image Generation (Gemini)', status: 'pending' },
  ]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'trends' | 'scheduled' | 'analytics' | 'ideas'>('generate');
  const [schedulingPost, setSchedulingPost] = useState<TwitterPost | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<ContentIdea[]>([]);
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);
  const [ideasView, setIdeasView] = useState<'explore' | 'saved'>('explore');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNiche, setFilterNiche] = useState<Niche | 'All'>('All');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    const savedHistory = localStorage.getItem('xflow_history');
    const savedScheduled = localStorage.getItem('xflow_scheduled');
    const savedIdeas = localStorage.getItem('xflow_ideas');
    const savedTheme = localStorage.getItem('xflow_theme') as 'dark' | 'light';
    const onboardingCompleted = localStorage.getItem('xflow_onboarding_completed');
    
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedScheduled) setScheduledPosts(JSON.parse(savedScheduled));
    if (savedIdeas) setSavedIdeas(JSON.parse(savedIdeas));
    if (savedTheme) setTheme(savedTheme);
    if (!onboardingCompleted) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('xflow_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('xflow_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('xflow_scheduled', JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  useEffect(() => {
    localStorage.setItem('xflow_ideas', JSON.stringify(savedIdeas));
  }, [savedIdeas]);

  const handleFetchIdeas = async () => {
    if (selectedNiches.length === 0) return;
    setIsFetchingIdeas(true);
    try {
      const newIdeas = await generateContentIdeas(selectedNiches, selectedRegion);
      setIdeas(newIdeas);
      setTrends([]); // Reset other generation
      setActiveTab('ideas');
    } catch (error) {
      console.error("Failed to fetch ideas", error);
    } finally {
      setIsFetchingIdeas(false);
    }
  };

  const toggleSaveIdea = (idea: ContentIdea) => {
    setSavedIdeas(prev => 
      prev.some(i => i.id === idea.id) 
        ? prev.filter(i => i.id !== idea.id) 
        : [idea, ...prev]
    );
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche as Niche) ? prev.filter(n => n !== niche) : [...prev, niche as Niche]
    );
  };

  const handleDiscoverNiches = async () => {
    setIsDiscovering(true);
    try {
      const liveNiches = await discoverTrendingNiches(selectedRegion);
      setDynamicNiches(liveNiches);
      // Auto-select the first few discovered niches for convenience
      setSelectedNiches(liveNiches.slice(0, 3) as Niche[]);
    } catch (error) {
      console.error("Discovering niches failed", error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const updateStep = (id: string, status: 'loading' | 'completed') => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleFetchTrends = async () => {
    if (selectedNiches.length === 0) return;
    setIsFetchingTrends(true);
    try {
      const fetchedTrends = await fetchTrendsForNiches(selectedNiches, selectedRegion);
      setTrends(fetchedTrends);
      setIdeas([]); // Reset other generation
      setActiveTab('trends');
    } catch (error) {
      console.error("Fetching trends failed", error);
    } finally {
      setIsFetchingTrends(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedNiches.length === 0) return;
    
    setIsGenerating(true);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    
    try {
      updateStep('trends', 'loading');
      await new Promise(r => setTimeout(r, 1000));
      updateStep('trends', 'completed');
      
      updateStep('niche', 'loading');
      await new Promise(r => setTimeout(r, 800));
      updateStep('niche', 'completed');
      
      updateStep('posts', 'loading');
      const newPosts = await generateTwitterPosts(selectedNiches, selectedRegion);
      updateStep('posts', 'completed');
      
      updateStep('images', 'loading');
      // Images are now generated inside generateTwitterPosts
      const postsWithMetrics = newPosts.map(post => ({
        ...post,
        metrics: {
          likes: Math.floor(Math.random() * 500) + 50,
          retweets: Math.floor(Math.random() * 100) + 10,
          replies: Math.floor(Math.random() * 50) + 5,
          impressions: Math.floor(Math.random() * 10000) + 1000,
          engagementRate: parseFloat((Math.random() * 5 + 1).toFixed(1))
        }
      }));
      await new Promise(r => setTimeout(r, 500));
      updateStep('images', 'completed');
      
      setPosts(prev => [...postsWithMetrics, ...prev]);
      setTrends([]);
      setIdeas([]);
      setHistory(prev => [...postsWithMetrics, ...prev]);
      setActiveTab('generate');
      // Reset filters when new posts are generated to show them
      setSearchQuery('');
      setFilterNiche('All');
      setFilterDate('all');
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (id: string, niche: Niche, instruction?: string) => {
    try {
      const newPost = await regenerateSinglePost(niche, selectedRegion, instruction);
      const postWithMetrics = {
        ...newPost,
        metrics: {
          likes: Math.floor(Math.random() * 500) + 50,
          retweets: Math.floor(Math.random() * 100) + 10,
          replies: Math.floor(Math.random() * 50) + 5,
          impressions: Math.floor(Math.random() * 10000) + 1000,
          engagementRate: parseFloat((Math.random() * 5 + 1).toFixed(1))
        }
      };
      setPosts(prev => prev.map(p => p.id === id ? postWithMetrics : p));
      setHistory(prev => [postWithMetrics, ...prev]);
    } catch (error) {
      console.error("Regeneration failed", error);
    }
  };

  const handleEditPost = (id: string, newContent: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
    setHistory(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
    setScheduledPosts(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
  };

  const copyToClipboard = (post: TwitterPost) => {
    const text = `${post.content}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    // Simple toast could be added here
  };

  const postToTwitter = (post: TwitterPost) => {
    const text = encodeURIComponent(`${post.content}\n\n${post.hashtags.join(' ')}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    if (activeTab === 'history') setPosts([]);
  };

  const clearScheduled = () => {
    setScheduledPosts([]);
  };

  const handleSchedule = (post: TwitterPost, date: string) => {
    const scheduledAt = new Date(date).getTime();
    const newScheduledPost = { ...post, scheduledAt };
    setScheduledPosts(prev => [...prev, newScheduledPost].sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0)));
    setSchedulingPost(null);
    // Optionally remove from current feed if it was there
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  const cancelScheduled = (id: string) => {
    setScheduledPosts(prev => prev.filter(p => p.id !== id));
  };

  const filterPosts = (postsToFilter: TwitterPost[]) => {
    return postsToFilter.filter(post => {
      // Keyword filter
      const matchesKeyword = searchQuery === '' || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.niche.toLowerCase().includes(searchQuery.toLowerCase());

      // Niche filter
      const matchesNiche = filterNiche === 'All' || post.niche === filterNiche;

      // Date filter
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      
      let matchesDate = true;
      if (filterDate === 'today') {
        matchesDate = (now - post.timestamp) < oneDay;
      } else if (filterDate === 'week') {
        matchesDate = (now - post.timestamp) < oneWeek;
      }

      return matchesKeyword && matchesNiche && matchesDate;
    });
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('xflow_onboarding_completed', 'true');
  };

  const filteredPosts = filterPosts(posts);
  const filteredHistory = filterPosts(history);
  const filteredScheduled = filterPosts(scheduledPosts);
  
  const analyticsData = history.slice(0, 10).reverse().map((post, i) => ({
    name: `Post ${i + 1}`,
    likes: post.metrics?.likes || 0,
    retweets: post.metrics?.retweets || 0,
    engagement: post.metrics?.engagementRate || 0,
  }));
  
  const baseIdeas = ideasView === 'explore' 
    ? [...ideas, ...savedIdeas.filter(si => !ideas.some(i => i.id === si.id))]
    : savedIdeas;

  const filteredIdeas = baseIdeas.filter(idea => {
    const matchesKeyword = searchQuery === '' || 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.angle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.niche.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesNiche = filterNiche === 'All' || idea.niche === filterNiche;
    
    return matchesKeyword && matchesNiche;
  });

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding 
            step={onboardingStep}
            setStep={setOnboardingStep}
            onComplete={handleOnboardingComplete}
            selectedNiches={selectedNiches}
            setSelectedNiches={setSelectedNiches}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            niches={NICHES}
            regions={REGIONS}
          />
        )}
      </AnimatePresence>
      
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background text-primary font-sans overflow-x-hidden transition-colors duration-300">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 z-50 glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center accent-glow">
            <Zap className="text-background fill-background" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-accent">XFLOW</h1>
        </div>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-card border border-border text-accent hover:border-accent/50 transition-all accent-glow"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Navigation Section */}
      <nav className="px-6 py-3 flex items-center justify-between gap-2 bg-card border-b border-border sticky top-[88px] z-40">
        <button 
          onClick={() => setActiveTab('generate')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'generate' ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
          )}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Generate</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'history' ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
          )}
        >
          <History size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
        </button>
        <button 
          onClick={() => setActiveTab('trends')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'trends' ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
          )}
        >
          <TrendingUp size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Trends</span>
        </button>
        <button 
          onClick={() => setActiveTab('scheduled')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'scheduled' ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
          )}
        >
          <Calendar size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Queue</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'analytics' ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
          )}
        >
          <BarChart3 size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Analytics</span>
        </button>
        <button 
          onClick={() => setActiveTab('ideas')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'ideas' ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"
          )}
        >
          <Lightbulb size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ideas</span>
        </button>
      </nav>

      <main className="flex-1 p-6 space-y-8 pb-24">
        {/* Global Search & Filter Bar */}
        {(activeTab === 'generate' || activeTab === 'history' || activeTab === 'scheduled' || activeTab === 'ideas') && (
          <section className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text"
                  placeholder="Search posts, tags, niches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors text-text-primary"
                />
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "p-3 rounded-2xl border transition-all",
                  isFilterOpen || filterNiche !== 'All' || filterDate !== 'all'
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-card border-border text-text-secondary hover:border-accent/50"
                )}
              >
                <LayoutDashboard size={20} />
              </button>
            </div>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Filter by Niche</label>
                      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
                        <button
                          onClick={() => setFilterNiche('All')}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                            filterNiche === 'All'
                              ? "bg-accent/20 text-accent border-accent"
                              : "bg-background border-border text-text-secondary"
                          )}
                        >
                          All Niches
                        </button>
                        {NICHES.map(niche => (
                          <button
                            key={niche}
                            onClick={() => setFilterNiche(niche)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                              filterNiche === niche
                                ? "bg-accent/20 text-accent border-accent"
                                : "bg-background border-border text-text-secondary"
                            )}
                          >
                            {niche}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Filter by Date</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'all', label: 'All Time' },
                          { id: 'today', label: 'Today' },
                          { id: 'week', label: 'This Week' }
                        ].map(date => (
                          <button
                            key={date.id}
                            onClick={() => setFilterDate(date.id as any)}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-medium transition-all border",
                              filterDate === date.id
                                ? "bg-accent/20 text-accent border-accent"
                                : "bg-background border-border text-text-secondary"
                            )}
                          >
                            {date.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setFilterNiche('All');
                        setFilterDate('all');
                      }}
                      className="w-full py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {activeTab === 'generate' ? (
          <>
            {/* Region Selector */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Globe size={18} className="text-accent" />
                  Target Region
                </h2>
                <span className="text-xs text-text-muted">{selectedRegion}</span>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                      selectedRegion === region
                        ? "bg-accent/20 text-accent border-accent"
                        : "bg-card border-border text-text-secondary hover:border-accent/50"
                    )}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </section>

            {/* Niche Selector */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Search size={18} className="text-accent" />
                  Select Niches
                </h2>
                <button 
                  onClick={handleDiscoverNiches}
                  disabled={isDiscovering}
                  className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 font-bold uppercase tracking-wider"
                >
                  {isDiscovering ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : (
                    <Zap size={12} className="fill-accent" />
                  )}
                  Discover Live Topics
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const currentList = dynamicNiches.length > 0 ? dynamicNiches : NICHES;
                    if (selectedNiches.length === currentList.length) {
                      setSelectedNiches([]);
                    } else {
                      setSelectedNiches([...currentList] as Niche[]);
                    }
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    selectedNiches.length > 0 && selectedNiches.length === (dynamicNiches.length > 0 ? dynamicNiches.length : NICHES.length)
                      ? "bg-accent text-background border-accent accent-glow"
                      : "bg-card border-border text-text-secondary hover:border-accent/50"
                  )}
                >
                  All Niche
                </button>
                {(dynamicNiches.length > 0 ? dynamicNiches : NICHES).map(niche => (
                  <button
                    key={niche}
                    onClick={() => toggleNiche(niche)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      selectedNiches.includes(niche as Niche)
                        ? "bg-accent text-background border-accent accent-glow"
                        : "bg-card border-border text-text-secondary hover:border-accent/50"
                    )}
                  >
                    {niche}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={selectedNiches.length === 0 || isGenerating}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all",
                    selectedNiches.length > 0 && !isGenerating
                      ? "bg-accent text-background hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-card border-border text-text-muted cursor-not-allowed"
                  )}
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Posts
                    </>
                  )}
                </button>
                <button
                  onClick={handleFetchTrends}
                  disabled={selectedNiches.length === 0 || isFetchingTrends}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all",
                    selectedNiches.length > 0 && !isFetchingTrends
                      ? "bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20"
                      : "bg-card border-border text-text-muted cursor-not-allowed"
                  )}
                >
                  {isFetchingTrends ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <TrendingUp size={16} />
                      Trends
                    </>
                  )}
                </button>
                <button
                  onClick={handleFetchIdeas}
                  disabled={selectedNiches.length === 0 || isFetchingIdeas}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all",
                    selectedNiches.length > 0 && !isFetchingIdeas
                      ? "bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20"
                      : "bg-card border-border text-text-muted cursor-not-allowed"
                  )}
                >
                  {isFetchingIdeas ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Lightbulb size={16} />
                      Ideas
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Loading Steps */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 rounded-2xl bg-card border border-border space-y-4"
                >
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className="relative">
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="text-accent" size={20} />
                        ) : step.status === 'loading' ? (
                          <Loader2 className="text-accent animate-spin" size={20} />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/10" />
                        )}
                        {idx < steps.length - 1 && (
                          <div className={cn(
                            "absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-4",
                            step.status === 'completed' ? "bg-accent" : "bg-white/10"
                          )} />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        step.status === 'pending' ? "text-white/20" : "text-white"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts Feed */}
            <div className="space-y-6">
              {filteredPosts.length === 0 && posts.length > 0 && (
                <div className="py-10 text-center text-white/40 text-sm">
                  No posts match your current filters.
                </div>
              )}
              {filteredPosts.map((post, idx) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  index={idx}
                  onRegenerate={(instruction) => handleRegenerate(post.id, post.niche, instruction)}
                  onEdit={(newContent) => handleEditPost(post.id, newContent)}
                  onCopy={() => copyToClipboard(post)}
                  onPost={() => postToTwitter(post)}
                  onDownload={() => downloadImage(post.imageUrl, `xflow-${post.niche}-${post.id}`)}
                  onSchedule={() => setSchedulingPost(post)}
                />
              ))}
            </div>
          </>
        ) : activeTab === 'trends' ? (
          /* Trends Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp size={24} className="text-accent" />
                Live X Trends
              </h2>
              <button 
                onClick={handleFetchTrends}
                disabled={isFetchingTrends}
                className="text-accent hover:text-accent/80 flex items-center gap-1 text-sm font-medium"
              >
                <RefreshCw size={16} className={cn(isFetchingTrends && "animate-spin")} />
                Refresh
              </button>
            </div>

            {trends.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp size={32} className="text-white/20" />
                </div>
                <p className="text-white/40">Select niches and scan to see live trends.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trends.map((trend, idx) => (
                  <motion.div
                    key={`${trend.topic}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-2xl bg-card border border-border flex items-start justify-between group hover:border-accent/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent/60">
                          {trend.niche}
                        </span>
                        {trend.volume && (
                          <span className="text-[10px] text-text-muted">• {trend.volume}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-text-primary group-hover:text-accent transition-colors">
                        {trend.topic}
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {trend.description}
                      </p>
                      
                      {/* Viral Examples */}
                      {trend.examples && trend.examples.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Viral Examples</p>
                          <div className="space-y-1.5">
                            {trend.examples.map((example, eIdx) => (
                              <div key={eIdx} className="p-2 rounded-lg bg-background border border-border text-[11px] text-text-secondary italic leading-relaxed">
                                "{example}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Sentiment Analysis */}
                      {trend.sentiment && (
                        <div className="mt-4 p-3 rounded-xl bg-background/50 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Sentiment Analysis</p>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                              trend.sentiment.label === 'Positive' ? "bg-green-500/10 text-green-500" :
                              trend.sentiment.label === 'Negative' ? "bg-red-500/10 text-red-500" :
                              "bg-blue-500/10 text-blue-500"
                            )}>
                              {trend.sentiment.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${trend.sentiment.positive}%` }} 
                              title={`Positive: ${trend.sentiment.positive}%`}
                            />
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${trend.sentiment.neutral}%` }} 
                              title={`Neutral: ${trend.sentiment.neutral}%`}
                            />
                            <div 
                              className="h-full bg-red-500" 
                              style={{ width: `${trend.sentiment.negative}%` }} 
                              title={`Negative: ${trend.sentiment.negative}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-text-muted uppercase tracking-tighter">
                            <span>Pos: {trend.sentiment.positive}%</span>
                            <span>Neu: {trend.sentiment.neutral}%</span>
                            <span>Neg: {trend.sentiment.negative}%</span>
                          </div>
                        </div>
                      )}

                      {/* Viral Tweets */}
                      {trend.viralTweets && trend.viralTweets.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Viral Discourse</p>
                          <div className="space-y-2">
                            {trend.viralTweets.map((tweet, tIdx) => (
                              <div key={tIdx} className="p-3 rounded-xl bg-background border border-border space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                    {tweet.user[0]}
                                  </div>
                                  <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[10px] font-bold text-text-primary">{tweet.user}</span>
                                    <span className="text-[9px] text-text-muted">{tweet.handle}</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-text-secondary leading-relaxed italic">
                                  "{tweet.content}"
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                  <span className="text-[9px] text-text-muted flex items-center gap-1">
                                    <Heart size={10} className="text-red-500/60" /> {tweet.likes}
                                  </span>
                                  <span className="text-[9px] text-text-muted flex items-center gap-1">
                                    <RefreshCw size={10} className="text-accent/60" /> {tweet.retweets}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2 rounded-full bg-white/5 text-white/20 group-hover:bg-accent/20 group-hover:text-accent transition-all shrink-0">
                      <ArrowUpRight size={18} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'scheduled' ? (
          /* Scheduled Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={24} className="text-accent" />
                Scheduled Queue
              </h2>
              <button 
                onClick={clearScheduled}
                className="text-secondary hover:text-secondary/80 flex items-center gap-1 text-sm font-medium"
              >
                <Trash2 size={16} />
                Clear Queue
              </button>
            </div>

            {scheduledPosts.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Clock size={32} className="text-white/20" />
                </div>
                <p className="text-white/40">No posts scheduled. Plan your content!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredScheduled.length === 0 && (
                  <div className="py-10 text-center text-white/40 text-sm">
                    No scheduled posts match your current filters.
                  </div>
                )}
                {filteredScheduled.map((post, idx) => (
                  <PostCard 
                    key={`${post.id}-${idx}`} 
                    post={post} 
                    index={idx}
                    isScheduledView
                    onRegenerate={(instruction) => handleRegenerate(post.id, post.niche, instruction)}
                    onEdit={(newContent) => handleEditPost(post.id, newContent)}
                    onCopy={() => copyToClipboard(post)}
                    onPost={() => postToTwitter(post)}
                    onDownload={() => downloadImage(post.imageUrl, `xflow-scheduled-${post.id}`)}
                    onCancelSchedule={() => cancelScheduled(post.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'analytics' ? (
          /* Analytics Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Content Performance</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp size={12} />
                Live Insights
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent">
                    <Users size={18} />
                  </div>
                  <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                    <ArrowUp size={10} />
                    12%
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Reach</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {history.reduce((acc, p) => acc + (p.metrics?.impressions || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                    <ArrowUp size={10} />
                    8.4%
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Likes</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {history.reduce((acc, p) => acc + (p.metrics?.likes || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent">
                    <Calendar size={18} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Scheduled</p>
                  <p className="text-2xl font-bold text-text-primary">{scheduledPosts.length}</p>
                </div>
              </div>
              <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Avg. Engagement</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {history.length > 0 ? (history.reduce((acc, p) => acc + (p.metrics?.engagementRate || 0), 0) / history.length).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-card border border-border rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <BarChartIcon size={32} className="text-white/20" />
                </div>
                <p className="text-white/40">No data available yet. Generate and post content to see analytics!</p>
              </div>
            ) : (
              <>
                {/* Engagement Chart */}
                <div className="p-6 rounded-3xl bg-card border border-border space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-text-primary">Engagement Rate (%)</h3>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Last 10 Posts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-accent">
                        {history.length > 0 ? (history.reduce((acc, p) => acc + (p.metrics?.engagementRate || 0), 0) / history.length).toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Avg. Performance</p>
                    </div>
                  </div>
                  
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                          itemStyle={{ color: '#00f2ff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="#00f2ff" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#00f2ff', strokeWidth: 2, stroke: '#1a1a1a' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Likes & Retweets Chart */}
                <div className="p-6 rounded-3xl bg-card border border-border space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-text-primary">Likes & Retweets</h3>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Volume per Post</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-[8px] font-bold text-text-muted uppercase">Likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        <span className="text-[8px] font-bold text-text-muted uppercase">RTs</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="likes" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="retweets" fill="#ff00ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Top Performing Posts */}
            <div className="space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <ArrowUpRight size={18} className="text-accent" />
                Top Performing Posts
              </h3>
              <div className="space-y-3">
                {history.slice(0, 3).map((post, idx) => (
                  <div key={post.id} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary font-medium line-clamp-1">{post.content}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <CheckCircle2 size={10} /> {post.metrics?.likes}
                        </span>
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <RefreshCw size={10} /> {post.metrics?.retweets}
                        </span>
                        <span className="text-[10px] text-accent font-bold">
                          {post.metrics?.engagementRate}% ER
                        </span>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${idx === 0 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-accent/10 text-accent'}`}>
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'ideas' ? (
          /* Ideas Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={24} className="text-secondary" />
                Viral Brainstorm
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-card border border-border rounded-xl p-1">
                  <button
                    onClick={() => setIdeasView('explore')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      ideasView === 'explore' ? "bg-secondary text-background" : "text-text-muted hover:text-text-secondary"
                    )}
                  >
                    Explore
                  </button>
                  <button
                    onClick={() => setIdeasView('saved')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      ideasView === 'saved' ? "bg-secondary text-background" : "text-text-muted hover:text-text-secondary"
                    )}
                  >
                    Saved ({savedIdeas.length})
                  </button>
                </div>
                <button 
                  onClick={handleFetchIdeas}
                  disabled={isFetchingIdeas}
                  className="p-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                >
                  {isFetchingIdeas ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                </button>
              </div>
            </div>

            {filteredIdeas.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Lightbulb size={32} className="text-white/20" />
                </div>
                <p className="text-white/40">
                  {ideasView === 'saved' 
                    ? (searchQuery || filterNiche !== 'All' ? 'No saved ideas match your filters.' : 'You haven\'t saved any ideas yet.')
                    : (searchQuery || filterNiche !== 'All' ? 'No ideas match your filters.' : 'Select niches and brainstorm to see viral ideas.')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIdeas.map((idea, idx) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-3xl bg-card border border-border space-y-4 group hover:border-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
                        {idea.niche}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleSaveIdea(idea)}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            savedIdeas.some(si => si.id === idea.id) 
                              ? "bg-secondary text-background" 
                              : "bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                        >
                          <Check size={14} />
                        </button>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                          <FileText size={10} />
                          {idea.suggestedFormat}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-text-primary group-hover:text-secondary transition-colors">
                        {idea.title}
                      </h3>
                      <div className="p-3 rounded-2xl bg-secondary/5 border border-secondary/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/60 mb-1">The Hook</p>
                        <p className="text-sm font-medium text-text-primary italic leading-relaxed">
                          "{idea.hook}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">The Angle</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{idea.angle}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Viral Factor</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{idea.potentialViralFactor}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        // In a real app, this would pre-fill the generator
                        setActiveTab('generate');
                        setSearchQuery(idea.title);
                      }}
                      className="w-full py-3 rounded-2xl bg-secondary text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} />
                      Draft from Idea
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Generation History</h2>
              <button 
                onClick={clearHistory}
                className="text-secondary hover:text-secondary/80 flex items-center gap-1 text-sm font-medium"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
            {history.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <History size={32} className="text-white/20" />
                </div>
                <p className="text-white/40">No history yet. Generate some posts!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHistory.length === 0 && (
                  <div className="py-10 text-center text-white/40 text-sm">
                    No history items match your current filters.
                  </div>
                )}
                {filteredHistory.map((post, idx) => (
                  <PostCard 
                    key={`${post.id}-${idx}`} 
                    post={post} 
                    index={idx}
                    onRegenerate={(instruction) => handleRegenerate(post.id, post.niche, instruction)}
                    onEdit={(newContent) => handleEditPost(post.id, newContent)}
                    onCopy={() => copyToClipboard(post)}
                    onPost={() => postToTwitter(post)}
                    onDownload={() => downloadImage(post.imageUrl, `xflow-history-${post.id}`)}
                    onSchedule={() => setSchedulingPost(post)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="p-8 text-center text-white/20 text-xs">
        <p>© 2026 XFLOW AI • MVP STAGE</p>
      </footer>

      {/* Schedule Modal */}
      <AnimatePresence>
        {schedulingPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock size={20} className="text-accent" />
                  Schedule Post
                </h3>
                <button 
                  onClick={() => setSchedulingPost(null)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/40"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-white/5 border border-border">
                  <p className="text-xs text-white/60 line-clamp-2 italic">
                    "{schedulingPost.content}"
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">Select Date & Time</label>
                  <input 
                    type="datetime-local"
                    id="schedule-datetime"
                    defaultValue={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent/50 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSchedulingPost(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const dateInput = document.getElementById('schedule-datetime') as HTMLInputElement;
                    if (dateInput.value) {
                      handleSchedule(schedulingPost, dateInput.value);
                    }
                  }}
                  className="flex-[2] py-3 rounded-xl bg-accent text-background text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all accent-glow"
                >
                  Confirm Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

interface PostCardProps {
  post: TwitterPost;
  index: number;
  onRegenerate: (instruction?: string) => void | Promise<void>;
  onEdit: (newContent: string) => void;
  onCopy: () => void;
  onPost: () => void;
  onDownload: () => void | Promise<void>;
  onSchedule?: () => void;
  onCancelSchedule?: () => void;
  isScheduledView?: boolean;
  key?: React.Key;
}

function PostCard({ 
  post, 
  index, 
  onRegenerate, 
  onEdit,
  onCopy, 
  onPost, 
  onDownload,
  onSchedule,
  onCancelSchedule,
  isScheduledView = false
}: PostCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [refineInstruction, setRefineInstruction] = useState('');

  const handleSaveEdit = () => {
    onEdit(editedContent);
    setIsEditing(false);
  };

  const handleRegen = async (instruction?: string) => {
    setIsRegenerating(true);
    await onRegenerate(instruction);
    setIsRegenerating(false);
    setIsRefining(false);
    setRefineInstruction('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-3xl border border-border overflow-hidden flex flex-col"
    >
      {/* Image Header */}
      <div className="relative aspect-[16/9] bg-white/5">
        <img 
          src={post.imageUrl} 
          alt={post.imageSearchTerm}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="px-3 py-1 rounded-full bg-accent text-background text-[10px] font-bold uppercase tracking-wider w-fit">
            {post.niche}
          </span>
          {post.scheduledAt && (
            <span className="px-3 py-1 rounded-full bg-secondary text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <Clock size={10} />
              {formatDate(post.scheduledAt)}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[10px] text-white/60 flex items-center gap-1">
            <Search size={10} />
            Search: {post.imageSearchTerm}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-white/5 border border-accent/30 rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[100px] resize-none"
                placeholder="Edit post content..."
              />
              <div className="flex justify-between items-center">
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest",
                  editedContent.length > 280 ? "text-destructive" : "text-text-muted"
                )}>
                  {editedContent.length} / 280 chars
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(post.content);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-text-muted text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    disabled={editedContent.length > 280 || editedContent.trim() === ''}
                    className="px-3 py-1.5 rounded-lg bg-accent text-background text-[10px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start gap-4">
                <p className="text-sm leading-relaxed text-text-primary flex-1">
                  {post.content}
                </p>
                {!isScheduledView && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-white/5 text-accent hover:bg-accent/10 transition-colors shrink-0"
                    title="Edit content"
                  >
                    <FileText size={14} />
                  </button>
                )}
              </div>
              <div className="flex justify-end">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                  {post.content.length} / 280 chars
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Engagement Tactic */}
        <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 flex items-start gap-3">
          <Zap size={16} className="text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent/60">Suggested Tactic</p>
            <p className="text-xs text-text-secondary italic leading-relaxed">
              {post.engagementTactic}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {post.hashtags.map(tag => (
            <span key={tag} className="text-accent text-xs font-medium">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>

        {/* Metrics (if available) */}
        {post.metrics && (
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-border">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-text-muted">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Likes</span>
              </div>
              <span className="text-xs font-bold text-text-primary">{post.metrics.likes}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-text-muted">
                <RefreshCw size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">RTs</span>
              </div>
              <span className="text-xs font-bold text-text-primary">{post.metrics.retweets}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-text-muted">
                <Eye size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Views</span>
              </div>
              <span className="text-xs font-bold text-text-primary">{post.metrics.impressions}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-text-muted">
                <TrendingUp size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Rate</span>
              </div>
              <span className="text-xs font-bold text-accent">{post.metrics.engagementRate}%</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {!isScheduledView && (
            <button 
              onClick={() => setIsRefining(!isRefining)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all col-span-2 ${isRefining ? 'bg-accent text-background' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}
            >
              <Wand2 size={14} />
              Refine with AI
            </button>
          )}
          {isScheduledView ? (
            <>
              <button 
                onClick={onPost}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Twitter size={14} />
                Post Now
              </button>
              <button 
                onClick={onCancelSchedule}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/20 text-secondary text-xs font-bold hover:bg-secondary/30 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={onPost}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1DA1F2] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Twitter size={14} />
                Post to X
              </button>
              <button 
                onClick={onSchedule}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
              >
                <Clock size={14} />
                Schedule
              </button>
            </>
          )}
          <button 
            onClick={onCopy}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
          >
            <Copy size={14} />
            Copy Text
          </button>
          <button 
            onClick={onDownload}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 transition-colors"
          >
            <Download size={14} />
            Image
          </button>
          {!isScheduledView && (
            <button 
              onClick={() => handleRegen()}
              disabled={isRegenerating}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 transition-colors disabled:opacity-50 col-span-2"
            >
              <RefreshCw size={14} className={cn(isRegenerating && "animate-spin")} />
              Regen
            </button>
          )}
        </div>

        {/* Refine Input */}
        <AnimatePresence>
          {isRefining && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-4 space-y-3 border-t border-border mt-2"
            >
              <div className="flex flex-wrap gap-1">
                {['Funny', 'Thread', 'Under 100 chars', 'Expand', 'Hook', 'Professional'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleRegen(preset === 'Under 100 chars' ? 'Condense to under 100 characters' : preset === 'Expand' ? 'Expand with more detail' : preset === 'Thread' ? 'Make it a Twitter Thread' : `Make it ${preset.toLowerCase()}`)}
                    className="px-2 py-1 bg-white/5 border border-border rounded-lg text-[8px] font-bold uppercase tracking-wider text-text-muted hover:bg-accent hover:text-background transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  placeholder="e.g., 'Make it funnier', 'Under 100 chars'..."
                  className="flex-1 bg-white/5 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                  onKeyDown={(e) => e.key === 'Enter' && handleRegen(refineInstruction)}
                />
                <button 
                  onClick={() => handleRegen(refineInstruction)}
                  disabled={isRegenerating || !refineInstruction.trim()}
                  className="px-4 py-2 bg-accent text-background text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {isRegenerating ? '...' : 'Apply'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
