/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Brain, BookMarked, ArrowRight, Loader2, Play, Pause,
  Sparkles, CheckCircle, ChevronRight, Send, Check
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  summary: string;
  content: string;
  imagePrompt: string;
  audioScript: string;
}

interface CourseData {
  courseTitle: string;
  lessons: Lesson[];
  flashcards: { front: string; back: string }[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"lessons" | "flashcards" | "quiz">("lessons");
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("pollinations_api_key") || "");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const key = params.get("api_key");
    if (key) {
      setApiKey(key);
      localStorage.setItem("pollinations_api_key", key);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else if (params.get("error")) {
      setError(params.get("error") || "Failed to connect to Pollinations");
    }
  }, []);

  const handleConnect = () => {
    const params = new URLSearchParams({
      redirect_uri: window.location.href,
    });
    window.location.href = `https://enter.pollinations.ai/authorize?${params.toString()}`;
  };

  const logout = () => {
    setApiKey("");
    localStorage.removeItem("pollinations_api_key");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (!apiKey) {
      setError("Please connect your Pollinations account first.");
      return;
    }

    setLoading(true);
    setError("");
    setCourseData(null);
    setActiveTab("lessons");
    setActiveLessonIndex(0);
    setCompletedLessons({});

    try {
      const prompt = `You are an expert, supportive AI Socratic Tutor. Your goal is to design a high-quality, structured learning course about the topic: "${topic}".
Break the topic down into 3 distinct, bite-sized, sequential lessons (segments) that make learning easy and not overwhelming.
Each lesson must have:
- A clear, engaging title.
- A concise summary (1 sentence).
- Educational content (2-3 short paragraphs, around 100-150 words total).
- A detailed imagePrompt describing a scientific, technical, or educational diagram or visual representing the lesson's key concept, suitable for the GPT Image model. The style should be clean, high-quality, educational diagram or scientific visualization, 3D render or vector art.
- A clean audioScript containing the text of the lesson, formatted as a simple speech script without markdown characters (like hashes, bold asterisks, list bullets, etc.) so that it can be synthesized seamlessly via text-to-speech.

Also generate 3 flashcards and 3 quiz questions for the overall topic.

Respond ONLY in valid JSON matching this schema:
{
  "courseTitle": "Engaging title of the course",
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Lesson 1: [Title]",
      "summary": "[One sentence summary of this segment]",
      "content": "[Main content text with 2-3 short paragraphs]",
      "imagePrompt": "[Detailed prompt for image generation]",
      "audioScript": "[Text to be spoken, no markdown markdown or punctuation markers]"
    }
  ],
  "flashcards": [
    { "front": "Question or concept", "back": "Detailed answer" }
  ],
  "quiz": [
    { 
      "question": "A multiple choice question", 
      "options": ["Option A", "Option B", "Option C", "Option D"], 
      "correctAnswer": "The exact string of the correct option",
      "explanation": "Explanation of why this is correct" 
    }
  ]
}`;

      const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
           logout();
           throw new Error("API key invalid or expired. Please reconnect.");
        }
        if (res.status === 402) {
           throw new Error("Insufficient Pollen balance. Top up at Pollinations.");
        }
        const errorText = await res.text();
        throw new Error(`Pollinations API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const content = data.choices[0].message.content;
      
      const parsed = JSON.parse(content);
      setCourseData(parsed);

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] font-sans text-[#E1E1E1] pb-20 selection:bg-[#C1A57B]/30">
      <header className="bg-[#0F0F11] border-b border-white/5 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif text-[#C1A57B] tracking-tight italic">studdy.</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs font-medium text-[#C1A57B] bg-[#C1A57B]/10 px-3 py-1.5 rounded-full border border-[#C1A57B]/20">
              Powered by Pollinations.ai
            </div>
            {apiKey ? (
              <button onClick={logout} className="text-xs text-white/50 hover:text-white transition-colors">Disconnect</button>
            ) : (
              <button onClick={handleConnect} className="text-xs font-medium bg-[#161618] hover:bg-[#C1A57B] hover:text-[#0A0A0B] text-[#C1A57B] border border-[#C1A57B]/30 px-3 py-1.5 rounded-full transition-colors">
                Connect Pollinations
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        {!courseData && !loading && (
           <div className="mb-12 text-center max-w-2xl mx-auto">
             <h2 className="text-4xl font-serif tracking-tight mb-4 italic text-white">Master any topic, step-by-step.</h2>
             <p className="text-sm text-white/50 leading-relaxed">
               Enter what you want to learn. We will segment the course into bite-sized lessons, read them word-by-word with audio, explain them with visuals, and guide you Socratic-style.
             </p>
           </div>
        )}

        <form onSubmit={handleGenerate} className="relative group max-w-2xl mx-auto z-10 w-full mb-12">
          <div className="absolute inset-0 bg-[#C1A57B]/5 rounded-full blur-xl group-hover:bg-[#C1A57B]/10 transition-all duration-300"></div>
          <div className="relative flex items-center bg-[#161618] rounded-full overflow-hidden border border-white/10 transition-all focus-within:ring-1 focus-within:ring-[#C1A57B]/50 focus-within:border-[#C1A57B]/50 shadow-inner">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn today?"
              className="w-full px-6 py-4 outline-none text-sm bg-transparent text-white placeholder-white/20"
              disabled={loading || !apiKey}
            />
            {apiKey ? (
              <button
                type="submit"
                disabled={!topic.trim() || loading}
                className="mr-2 h-10 w-10 bg-[#C1A57B] text-[#0A0A0B] rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                className="mr-2 px-5 h-10 text-xs font-medium bg-[#C1A57B] text-[#0A0A0B] rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Connect to Start
              </button>
            )}
          </div>
          {error && <p className="text-red-400 text-xs mt-3 ml-4 font-medium uppercase tracking-widest">{error}</p>}
        </form>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-20 flex flex-col items-center justify-center text-[#C1A57B]"
            >
              <Loader2 className="w-12 h-12 animate-spin mb-6" />
              <p className="text-xs uppercase tracking-widest font-medium text-white/40 animate-pulse">Generating your custom syllabus...</p>
            </motion.div>
          )}

          {courseData && !loading && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex justify-center gap-2 mb-8 bg-[#0F0F11] p-1.5 rounded-2xl border border-white/5 inline-flex mx-auto">
                <TabButton active={activeTab === "lessons"} onClick={() => setActiveTab("lessons")}>
                  <BookOpen className="w-4 h-4" /> Lessons
                </TabButton>
                <TabButton active={activeTab === "flashcards"} onClick={() => setActiveTab("flashcards")}>
                  <Brain className="w-4 h-4" /> Flashcards
                </TabButton>
                <TabButton active={activeTab === "quiz"} onClick={() => setActiveTab("quiz")}>
                  <BookMarked className="w-4 h-4" /> Quiz
                </TabButton>
              </div>

              <div className="bg-[#161618] rounded-2xl shadow-xl shadow-[#000000]/50 border border-white/5 overflow-hidden">
                {activeTab === "lessons" && (
                  <LessonsView
                    courseTitle={courseData.courseTitle}
                    lessons={courseData.lessons}
                    activeLessonIndex={activeLessonIndex}
                    setActiveLessonIndex={setActiveLessonIndex}
                    completedLessons={completedLessons}
                    setCompletedLessons={setCompletedLessons}
                    apiKey={apiKey}
                  />
                )}
                {activeTab === "flashcards" && <FlashcardsView flashcards={courseData.flashcards} />}
                {activeTab === "quiz" && <QuizView quiz={courseData.quiz} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
        active ? "bg-white/5 text-white font-medium shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function LessonAudioReader({ lesson, apiKey }: { lesson: Lesson; apiKey: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Revoke object URL and reset audio states when lesson changes
  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError("");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [lesson.id]);

  const togglePlay = async () => {
    if (!apiKey) {
      setAudioError("Connect your Pollinations account to enable audio speech.");
      return;
    }

    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(e => console.log("Play failed:", e));
        setIsPlaying(true);
      }
      return;
    }

    setLoadingAudio(true);
    setAudioError("");

    try {
      const res = await fetch("https://gen.pollinations.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "qwen-tts",
          input: lesson.audioScript,
          voice: "alloy"
        })
      });

      if (!res.ok) {
        throw new Error(`TTS synthesis failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(e => console.log("Play failed:", e));
        setIsPlaying(true);
      }
    } catch (err: any) {
      setAudioError(err.message || "Failed to load audio");
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Setup paragraph word indices
  const paragraphs = lesson.content.split("\n").filter(p => p.trim() !== "");
  let globalWordCounter = 0;
  const paragraphsWithWords = paragraphs.map((p) => {
    const words = p.split(/\s+/).filter(w => w.length > 0);
    const wordsWithIndices = words.map((word) => {
      const index = globalWordCounter++;
      return { word, index };
    });
    return { text: p, words: wordsWithIndices };
  });

  const totalWords = globalWordCounter;
  const progress = duration > 0 ? currentTime / duration : 0;
  const activeIndex = isPlaying || currentTime > 0 
    ? Math.min(Math.floor(progress * totalWords), totalWords - 1) 
    : -1;

  // Auto-scroll inside reading container
  useEffect(() => {
    if (activeIndex >= 0) {
      const containerEl = document.getElementById("words-container");
      const activeEl = document.getElementById(`word-${activeIndex}`);
      if (containerEl && activeEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const relativeTop = activeRect.top - containerRect.top + containerEl.scrollTop;
        const targetScrollTop = relativeTop - containerEl.clientHeight / 2 + activeRect.height / 2;
        containerEl.scrollTo({
          top: targetScrollTop,
          behavior: "smooth"
        });
      }
    }
  }, [activeIndex]);

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Audio Controls */}
      <div className="bg-[#0F0F11] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={togglePlay}
            disabled={loadingAudio}
            className="h-10 w-10 rounded-full bg-[#C1A57B] text-[#0A0A0B] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loadingAudio ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-[#0A0A0B]" />
            ) : (
              <Play className="w-5 h-5 fill-[#0A0A0B] translate-x-[1px]" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-white/40 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-[#C1A57B] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-xs text-white/40 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
            <span className="text-xs text-white/50">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-transparent text-xs text-[#C1A57B] font-semibold outline-none cursor-pointer"
            >
              <option value={1} className="bg-[#0F0F11]">1.0x</option>
              <option value={1.25} className="bg-[#0F0F11]">1.25x</option>
              <option value={1.5} className="bg-[#0F0F11]">1.5x</option>
            </select>
          </div>
        </div>

        {audioError && (
          <p className="text-xs text-red-400 font-medium tracking-wide">{audioError}</p>
        )}
      </div>

      {/* Synchronized word highlight container */}
      <div 
        id="words-container" 
        className="h-[280px] overflow-y-auto bg-[#0A0A0B] border border-white/5 p-6 rounded-xl space-y-4"
        style={{ scrollbarWidth: "thin", scrollBehavior: "smooth" }}
      >
        {paragraphsWithWords.map((para, pIdx) => (
          <p key={pIdx} className="text-lg leading-relaxed text-left">
            {para.words.map(({ word, index }) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <span
                  key={index}
                  id={`word-${index}`}
                  className={`inline-block mr-1.5 py-0.5 transition-all duration-150 rounded ${
                    isActive
                      ? "text-[#C1A57B] font-bold border-b border-[#C1A57B] drop-shadow-[0_0_8px_rgba(193,165,123,0.6)] scale-105"
                      : isPast
                      ? "text-white"
                      : "text-white/30"
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}

function formatTime(secs: number) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function SocraticTutorChat({ lesson, apiKey }: { lesson: Lesson; apiKey: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant" | "system"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset Socratic chat state on lesson change
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hello! I am your AI Socratic Tutor. Let's discuss "${lesson.title}". What questions do you have about the concepts here, or would you like me to test your understanding?`
      }
    ]);
    setError("");
    setInput("");
  }, [lesson.id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || !apiKey) return;

    const userText = input.trim();
    setInput("");
    setError("");

    const updatedMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const systemMessage = {
        role: "system" as const,
        content: `You are an upbeat, encouraging, and empathetic Socratic Tutor helper for the lesson: "${lesson.title}".
The content of the lesson is: "${lesson.content}".
Your role is to help the student learn and master the concept by checking for understanding and providing guidance using Socratic questioning.
Do not provide immediate answers or solutions to problems. Instead, help the student generate their own answers by asking leading questions, providing small hints, or offering simple everyday analogies.
Ask only one question at a time. If the student is stuck, guide them. Praise correct thinking and show excitement.
Keep responses concise (under 100 words).`
      };

      const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai",
          messages: [systemMessage, ...updatedMessages.map(m => ({ role: m.role, content: m.content }))],
          temperature: 0.7
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to get reply: ${res.statusText}`);
      }

      const data = await res.json();
      const assistantReply = data.choices[0].message.content;

      setMessages(prev => [...prev, { role: "assistant", content: assistantReply }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const suggestions = [
    "Explain this with a simple analogy.",
    "Help me test my knowledge on this.",
    "What is the main takeaway here?",
    "Why is this concept important?"
  ];

  return (
    <div className="bg-[#161618] border border-white/5 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-[#0F0F11] border-b border-white/5 px-4 py-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#C1A57B] animate-pulse"></div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-[#C1A57B] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Socratic AI Tutor
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
        {messages.map((m, idx) => {
          if (m.role === "system") return null;
          const isUser = m.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  isUser
                    ? "bg-[#C1A57B] text-[#0A0A0B] rounded-tr-none font-medium"
                    : "bg-[#0F0F11] text-white/80 border border-white/5 rounded-tl-none leading-relaxed text-left"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0F0F11] border border-white/5 text-white/50 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C1A57B]" />
              Tutor is thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-2.5 rounded-lg text-left">
            {error}
          </div>
        )}
      </div>

      {messages.length === 1 && !loading && (
        <div className="p-3 border-t border-white/5 bg-[#0F0F11]/50 flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => loadSuggestion(s)}
              className="text-xs bg-[#161618] hover:bg-white/5 text-white/60 hover:text-white border border-white/5 px-2.5 py-1.5 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 bg-[#0F0F11] border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question or ask to be quizzed..."
          className="flex-1 bg-[#161618] border border-white/5 rounded-xl px-4 py-2 text-sm outline-none text-white focus:border-[#C1A57B]/30"
          disabled={loading || !apiKey}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || !apiKey}
          className="bg-[#C1A57B] hover:opacity-90 disabled:opacity-50 text-[#0A0A0B] h-9 w-9 rounded-xl flex items-center justify-center transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function LessonsView({
  courseTitle,
  lessons,
  activeLessonIndex,
  setActiveLessonIndex,
  completedLessons,
  setCompletedLessons,
  apiKey
}: {
  courseTitle: string;
  lessons: Lesson[];
  activeLessonIndex: number;
  setActiveLessonIndex: (i: number) => void;
  completedLessons: Record<string, boolean>;
  setCompletedLessons: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  apiKey: string;
}) {
  const currentLesson = lessons[activeLessonIndex];
  
  if (!currentLesson) return <div className="p-12 text-center text-white/40">No lessons generated.</div>;

  const toggleComplete = (id: string) => {
    setCompletedLessons(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const activeGPTImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    currentLesson.imagePrompt
  )}?model=gptimage&width=800&height=480&nologo=true&seed=42`;

  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 space-y-8 text-left"
    >
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs uppercase tracking-widest text-[#C1A57B] font-semibold">Active Course</span>
        <h2 className="text-3xl font-serif text-white italic tracking-tight mt-1">{courseTitle}</h2>
        
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#C1A57B]/70 to-[#C1A57B] rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-xs text-white/60 font-medium whitespace-nowrap">
            {completedCount} / {lessons.length} Lessons ({progressPercent}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Syllabus Navigation Panel */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">Syllabus</h3>
          <div className="flex flex-col gap-2.5">
            {lessons.map((lesson, idx) => {
              const isActive = idx === activeLessonIndex;
              const isCompleted = !!completedLessons[lesson.id];

              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonIndex(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 group relative overflow-hidden ${
                    isActive
                      ? "bg-[#161618] border-[#C1A57B]/40 text-white shadow-lg shadow-black/20"
                      : "bg-[#0F0F11] border-white/5 text-white/60 hover:bg-[#161618]/50 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-[#C1A57B]/5 pointer-events-none"></div>
                  )}

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(lesson.id);
                    }}
                    className={`mt-0.5 h-[18px] w-[18px] rounded border flex items-center justify-center transition-all cursor-pointer ${
                      isCompleted
                        ? "bg-[#C1A57B] border-[#C1A57B] text-[#0A0A0B]"
                        : "border-white/20 text-transparent hover:border-[#C1A57B]/50"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-[#C1A57B] tracking-wider">
                      Segment {idx + 1}
                    </span>
                    <h4 className="text-sm font-medium leading-tight mt-0.5 truncate">{lesson.title}</h4>
                    <p className="text-xs text-white/40 mt-1 line-clamp-1 group-hover:text-white/60 transition-colors">
                      {lesson.summary}
                    </p>
                  </div>
                  
                  <ChevronRight className={`w-4 h-4 self-center shrink-0 transition-transform ${
                    isActive ? "text-[#C1A57B] translate-x-0.5" : "text-white/20 group-hover:text-white/40"
                  }`} />
                </button>
              );
            })}
          </div>

          {progressPercent === 100 && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#C1A57B]/10 border border-[#C1A57B]/30 p-4 rounded-xl text-center space-y-2"
            >
              <div className="flex justify-center text-[#C1A57B]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h5 className="text-xs font-semibold text-white uppercase tracking-wider">All Segments Read!</h5>
              <p className="text-[11px] text-white/60">
                You've completed the curriculum. Try testing your knowledge in the **Flashcards** and **Quiz** tabs above!
              </p>
            </motion.div>
          )}
        </div>

        {/* Content & Interactive Learning Space */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-[#0F0F11] group shadow-2xl">
              <img
                src={activeGPTImage}
                alt={currentLesson.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-85"></div>
              
              <div className="absolute top-4 left-4 bg-[#0A0A0B]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1A57B]"></div>
                <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                  GPT Image Explanatory Visual
                </span>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-[10px] uppercase font-semibold text-[#C1A57B] tracking-wider block">
                  Lesson Concept
                </span>
                <p className="text-sm text-white/90 font-medium leading-snug mt-1">
                  {currentLesson.summary}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#161618] border border-white/5 p-6 rounded-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif text-[#C1A57B] italic">{currentLesson.title}</h3>
              <button
                onClick={() => toggleComplete(currentLesson.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                  completedLessons[currentLesson.id]
                    ? "bg-[#C1A57B]/20 border-[#C1A57B]/40 text-[#C1A57B]"
                    : "border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                {completedLessons[currentLesson.id] ? "Completed" : "Mark Complete"}
              </button>
            </div>
            
            <LessonAudioReader lesson={currentLesson} apiKey={apiKey} />
          </div>

          <SocraticTutorChat lesson={currentLesson} apiKey={apiKey} />
        </div>
      </div>
    </motion.div>
  );
}

function FlashcardsView({ flashcards }: { flashcards: { front: string; back: string }[] }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % flashcards.length);
    }, 150);
  };
  
  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const current = flashcards[index];

  if (!flashcards || flashcards.length === 0) return <div className="p-12 text-center text-white/40">No flashcards generated.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-lg mb-8 flex justify-between items-center text-xs font-medium text-white/40 uppercase tracking-widest text-left">
        <span>Flashcard {index + 1}/{flashcards.length}</span>
        <button onClick={() => setIsFlipped(!isFlipped)} className="flex items-center gap-1.5 text-[#C1A57B] hover:opacity-80 transition-opacity">
          Tap to Flip
        </button>
      </div>

      <div 
        className="relative w-full max-w-lg h-80 perspective-1000 cursor-pointer group" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-[#0A0A0B] rounded-2xl border border-white/5 p-10 flex flex-col justify-center items-center text-center overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
             <h3 className="text-2xl font-serif max-w-xs leading-relaxed mb-6 text-white">{current.front}</h3>
             <div className="px-4 py-1.5 rounded-full border border-[#C1A57B]/30 text-[#C1A57B] text-xs font-medium">
               Tap to Reveal Answer
             </div>
             <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C1A57B] to-transparent opacity-20"></div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-[#0A0A0B] rounded-2xl border border-[#C1A57B]/30 p-10 flex flex-col justify-center items-center text-center shadow-lg shadow-[#C1A57B]/5 overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
             <p className="text-lg font-sans text-white/80 overflow-y-auto max-h-full px-2" style={{scrollbarWidth: "thin"}}>{current.back}</p>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-4 mt-12 w-full max-w-lg justify-center">
        <button onClick={prevCard} className="px-6 py-2.5 rounded-full bg-white/5 text-white/60 font-medium text-sm hover:bg-white/10 hover:text-white transition-colors">Previous</button>
        <button onClick={nextCard} className="px-6 py-2.5 rounded-full bg-[#C1A57B] text-[#0A0A0B] font-medium text-sm hover:opacity-90 transition-opacity">Next Card</button>
      </div>
    </motion.div>
  );
}

function QuizView({ quiz }: { quiz: { question: string; options: string[]; correctAnswer: string; explanation: string }[] }) {
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz || quiz.length === 0) return <div className="p-12 text-center text-white/40">No quiz generated.</div>;

  const score = Object.keys(selections).filter(i => selections[parseInt(i)] === quiz[parseInt(i)].correctAnswer).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-12 text-left">
      <div className="mb-8 flex justify-between items-end border-b border-white/5 pb-6">
        <h3 className="text-3xl font-serif text-[#C1A57B] italic tracking-tight">Knowledge Check</h3>
        {submitted && (
          <div className="text-sm font-medium text-white/80 bg-white/5 px-4 py-2 rounded-lg">Score: <span className="text-[#C1A57B]">{score}</span> / {quiz.length}</div>
        )}
      </div>

      <div className="space-y-12">
        {quiz.map((q, i) => (
          <div key={i} className="space-y-5">
            <h4 className="text-xl font-serif text-white"><span className="text-white/40 mr-2">{i + 1}.</span> {q.question}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, optIdx) => {
                const isSelected = selections[i] === opt;
                const isCorrect = opt === q.correctAnswer;
                
                let btnStyle = "border-white/5 text-white/70 hover:border-[#C1A57B]/30 hover:bg-[#C1A57B]/5";
                
                if (submitted) {
                  if (isSelected && isCorrect) btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                  else if (isSelected && !isCorrect) btnStyle = "border-red-500/50 bg-red-500/10 text-red-400";
                  else if (isCorrect) btnStyle = "border-emerald-500/20 text-emerald-300";
                  else btnStyle = "border-white/5 text-white/30 opacity-60";
                } else if (isSelected) {
                  btnStyle = "border-[#C1A57B]/50 bg-[#C1A57B]/10 text-[#C1A57B]";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => !submitted && setSelections(prev => ({ ...prev, [i]: opt }))}
                    disabled={submitted}
                    className={`text-left px-5 py-4 rounded-xl border transition-all text-sm ${btnStyle}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-5 bg-white/5 rounded-xl border border-[#C1A57B]/20 text-sm">
                <span className="font-serif italic text-[#C1A57B] block mb-1">Explanation</span>
                <span className="text-white/70 leading-relaxed">{q.explanation}</span>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {!submitted && Object.keys(selections).length === quiz.length && (
        <div className="mt-12 flex justify-center border-t border-white/5 pt-8">
          <button 
            onClick={() => setSubmitted(true)}
            className="px-8 py-3 bg-[#C1A57B] text-[#0A0A0B] font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Submit Answers
          </button>
        </div>
      )}
    </motion.div>
  );
}
