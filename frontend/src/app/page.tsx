"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Shield, Moon, Sun, UploadCloud, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, FileText, RefreshCw, Download, Terminal, WifiOff, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate, useTransform, useScroll } from 'framer-motion';

// --- Types ---
interface ApiResponse {
  overall_risk_score: number;
  total_clauses: number;
  critical_flags: number;
  results: ClauseResult[];
}

interface ClauseResult {
  segment: {
    segment_id: string;
    content: string;
  };
  classification: {
    predicted_category: string;
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  audit?: {
    is_compliant: boolean;
    violation_summary: string;
    redlined_proposal: string;
  };
}

const MOCK_DATA: ApiResponse = {
  overall_risk_score: 23.5,
  total_clauses: 57,
  critical_flags: 1,
  results: [
    {
      segment: {
        segment_id: "Section 1.1",
        content: "The Service Provider agrees to maintain the confidentiality of all proprietary data and shall not disclose such information to any third party without explicit written consent. This obligation of confidentiality shall survive the termination of this Agreement for a period of five (5) years, during which both parties must employ the highest commercial standards of protection to prevent unauthorized data exfiltration, distribution, or accidental exposure. Exceptions are strictly limited to disclosures required by federal or state law enforcement agencies, provided that the disclosing party issues written notice to the protected party at least ten (10) business days prior to the mandated disclosure."
      },
      classification: {
        predicted_category: "Confidentiality",
        risk_level: "Low"
      },
      audit: {
        is_compliant: true,
        violation_summary: "Standard confidentiality bounds detected. No anomalous liabilities found within the scope of governing law.",
        redlined_proposal: ""
      }
    },
    {
      segment: {
        segment_id: "Section 4.3",
        content: "The Client hereby waives any and all rights to litigate for damages exceeding the sum of one month's service fees, regardless of the severity of negligence by the Service Provider. Furthermore, the Client agrees to indemnify, defend, and hold harmless the Service Provider from any third-party claims arising out of catastrophic data loss, platform downtime, or total system failure, even if such failure stems from willful misconduct or gross negligence by the Service Provider's engineering personnel."
      },
      classification: {
        predicted_category: "Limitation of Liability",
        risk_level: "Critical"
      },
      audit: {
        is_compliant: false,
        violation_summary: "Overly broad limitation of liability violates UCC § 2-719(3) regarding unconscionable clauses. High probability of contract nullification.",
        redlined_proposal: '"Except in cases of gross negligence or willful misconduct, liability shall be capped at the total fees paid in the preceding twelve months."'
      }
    }
  ]
};

// Animated Number Counter Component
function AnimatedCounter({ value, decimals = 0 }: { value: number, decimals?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCurrent(easeOut * value);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{current.toFixed(decimals)}</span>;
}

// Typewriter Text Effect Component
function TypewriterText({ text, delay = 0, speed = 15 }: { text: string, delay?: number, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay, speed]);

  return <span className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatAIProposal(displayedText) }} />;
}

// Cybernetic Scramble Text Component
function formatLegalText(text: string): string {
  if (!text) return "";
  
  let formatted = text;
  
  // Rule 1: Hash Bullets (OCR errors)
  formatted = formatted.replace(/#\s*/g, '\n\n• ');
  
  // Rule 2: Capitalized Headers
  formatted = formatted.replace(/([A-Z\s]{5,}):/g, '<strong>$1:</strong>\n');
  
  return formatted;
}

function formatAIProposal(text: string): string {
  if (!text) return "";
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return formatted;
}

// Radial Progress Ring Component
function RadialRiskScore({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const targetStrokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const color = score < 30 ? "#10b981" : score > 60 ? "#ef4444" : "#f59e0b";
  const glow = score < 30 ? "rgba(16,185,129,0.5)" : score > 60 ? "rgba(239,68,68,0.5)" : "rgba(245,158,11,0.5)";
  const textColor = score < 30 ? "text-emerald-600 dark:text-emerald-400" : score > 60 ? "text-red-600 dark:text-red-500" : "text-amber-500 dark:text-amber-400";

  return (
    <div className="relative flex items-center justify-center w-full max-h-[140px] mt-2">
      <svg className="w-[120px] h-[120px] transform -rotate-90" viewBox="0 0 120 120">
        <circle 
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-slate-200 dark:text-slate-800/50"
        />
        <motion.circle 
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetStrokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
          <AnimatedCounter value={score} decimals={1} />
        </span>
      </div>
    </div>
  );
}

// Global Header with Ambient Cursor & Scroll Progress
function GlobalHeader({ theme, setTheme, mounted }: { theme: string | undefined, setTheme: (t: string) => void, mounted: boolean }) {
  const { scrollYProgress } = useScroll();
  const mouseX = useMotionValue(-500); 
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
  };

  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  
  const bgImageDark = useMotionTemplate`radial-gradient(100px circle at ${smoothX}px 50%, rgba(45,212,191,0.15), transparent 100%)`;
  const bgImageLight = useMotionTemplate`radial-gradient(100px circle at ${smoothX}px 50%, rgba(226,232,240,0.8), transparent 100%)`;

  return (
    <header 
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="print:hidden fixed top-0 left-0 right-0 z-[100] backdrop-blur-2xl bg-white/70 dark:bg-[#0B0F19]/70 border-b border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300"
    >
      {/* Interactive Cursor Aura */}
      {mounted && (
        <motion.div 
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{ 
            background: theme === 'dark' ? bgImageDark : bgImageLight,
            opacity: isHovered ? 1 : 0 
          }}
        />
      )}

      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8 py-4 relative z-10">
        
        {/* Left: Logo & Accent Shield */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-slate-900 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-indigo-500 shadow-md">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            ClauseGuard
          </span>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-50 dark:bg-white/5 px-4 py-1.5 border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">
            Risk Engine Online <span className="mx-1.5 opacity-40">•</span> FastAPI Active
          </span>
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-5">
          {mounted && (
            <motion.button 
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </motion.button>
          )}
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      {mounted && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500 dark:bg-cyan-400 origin-left z-20 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          style={{ scaleX: scrollYProgress }}
        />
      )}
    </header>
  );
}

// Interactive Liquid Hero Section
function LiquidHero({ theme }: { theme: string | undefined }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mouseX = useMotionValue(400);
  const mouseY = useMotionValue(150);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mounted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const smoothX = useSpring(mouseX, { stiffness: 75, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 75, damping: 20 });

  // Magnetic Shift for Subheadline (mapped roughly for an 800x300 container)
  const shiftX = useTransform(smoothX, [0, 800], [-5, 5]);
  const shiftY = useTransform(smoothY, [0, 300], [-5, 5]);

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="flex flex-col items-center text-center mt-6 mb-12 px-4 relative z-10 w-full max-w-4xl mx-auto py-8"
    >
      <motion.h1 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0, backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ 
          opacity: { duration: 0.5 },
          y: { duration: 0.5, type: "spring" },
          backgroundPosition: { duration: 8, repeat: Infinity, ease: "linear" } 
        }}
        style={{ backgroundSize: "200% auto" }}
        className="mb-6 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-slate-900 via-slate-600 to-slate-900 dark:from-cyan-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent dark:drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]"
      >
        Instant Contract<br />& Tender Risk Review
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={mounted ? { x: shiftX, y: shiftY } : {}}
        transition={{ delay: 0.1 }}
        className="max-w-2xl text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed cursor-default"
      >
        Upload any commercial agreement or public tender. Our system finds hidden liabilities and drafts safe counter-proposals in seconds.
      </motion.p>
    </div>
  );
}

// Helper to format predicted category (e.g., LIABILITY_LIMITATION -> Liability Limitation)
function formatCategory(category: string): string {
  if (!category || category.toLowerCase() === 'general') return "General Provisions";
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper to format raw segment IDs (e.g., LOC-P2.1 -> Page 2, Segment 1)
function formatSegmentId(segmentId: string): string {
  if (!segmentId) return "Standard Clause";
  if (segmentId.toUpperCase() === "PREAMBLE") return "Preamble";
  
  const matchLoc = segmentId.match(/LOC-P(\d+)\.(\d+)/i);
  if (matchLoc) return `Page ${matchLoc[1]}, Segment ${matchLoc[2]}`;
  
  const matchChunk = segmentId.match(/Chunk-P(\d+)\.(\d+)/i);
  if (matchChunk) return `Page ${matchChunk[1]}, Segment ${matchChunk[2]}`;

  return "Standard Clause";
}

const SpotlightCard = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof motion.div>>(({ children, className = "", onPointerMove, ...props }, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    divRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
    divRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
    if (onPointerMove) onPointerMove(e);
  };
  
  return (
    <motion.div 
      ref={(node: HTMLDivElement) => {
        divRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      onPointerMove={handlePointerMove}
      className={`relative overflow-hidden before:absolute before:inset-0 before:z-[-1] before:bg-[radial-gradient(250px_circle_at_var(--x,_50%)_var(--y,_50%),_rgba(99,102,241,0.08),_transparent_100%)] dark:before:bg-[radial-gradient(250px_circle_at_var(--x,_50%)_var(--y,_50%),_rgba(45,212,191,0.15),_transparent_100%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
});
SpotlightCard.displayName = "SpotlightCard";

const SpotlightButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof motion.button>>(({ children, className = "", onPointerMove, ...props }, ref) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    btnRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
    btnRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
    if (onPointerMove) onPointerMove(e);
  };
  
  return (
    <motion.button 
      ref={(node: HTMLButtonElement) => {
        btnRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      onPointerMove={handlePointerMove}
      className={`relative overflow-hidden before:absolute before:inset-0 before:z-[-1] before:bg-[radial-gradient(250px_circle_at_var(--x,_50%)_var(--y,_50%),_rgba(99,102,241,0.08),_transparent_100%)] dark:before:bg-[radial-gradient(250px_circle_at_var(--x,_50%)_var(--y,_50%),_rgba(45,212,191,0.15),_transparent_100%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
SpotlightButton.displayName = "SpotlightButton";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Real File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Application State
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Audit Control State
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All Risks");
  const [expandedTextClauses, setExpandedTextClauses] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    if (apiData) {
      const firstFailed = apiData.results?.find(r => r?.audit && !r.audit.is_compliant);
      if (firstFailed) {
        setExpandedIds(new Set([firstFailed?.segment?.segment_id || ""]));
      } else {
        setExpandedIds(new Set([apiData.results?.[0]?.segment?.segment_id || ""]));
      }
    }
  }, [apiData]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setBackendError(null);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setBackendError(null);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setBackendError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStartAnalysis = async () => {
    if (!file) return;
    setIsUploading(true);
    setBackendError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/api/v1/analyze/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) errorMsg = errorData.detail;
        } catch (e) {
          // Fallback if parsing fails
        }
        setBackendError(errorMsg);
        setIsUploading(false);
        return;
      }

      const data: ApiResponse = await response.json();
      setApiData(data);
      setIsComplete(true);
    } catch (err: any) {
      console.error("Backend fetch failed:", err);
      setIsUploading(false);
      
      // Handle Network / Connection Refused Errors
      if (err.message === "Failed to fetch") {
        setBackendError("Backend offline. Please start the FastAPI server.");
      } else {
        // Handle Legitimate Backend Rejections (e.g. 422, 500)
        setBackendError(err.message || "An unknown error occurred during analysis.");
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsUploading(false);
    setIsComplete(false);
    setApiData(null);
    setBackendError(null);
    setSearchTerm("");
    setRiskFilter("All Risks");
    setExpandedTextClauses(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRiskColorClasses = (riskLevel: string) => {
    switch(riskLevel) {
      case 'Low': return { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircle className="h-3.5 w-3.5" /> };
      case 'Medium': return { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: <AlertTriangle className="h-3.5 w-3.5" /> };
      case 'High': 
      case 'Critical': return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', shadow: 'shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.2)]', icon: <AlertTriangle className="h-3.5 w-3.5" /> };
      default: return { text: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-900/30', border: 'border-slate-200 dark:border-slate-800', icon: <Shield className="h-3.5 w-3.5" /> };
    }
  };

  const toggleTextExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!id) return;
    const newSet = new Set(expandedTextClauses);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTextClauses(newSet);
  };

  const filteredResults = apiData?.results?.filter(clause => {
    const riskStr = clause?.classification?.risk_level?.toUpperCase() || "";
    const matchesFilter = riskFilter === 'All Risks' || riskStr.includes(riskFilter.toUpperCase());
    
    const searchLower = searchTerm.toLowerCase();
    const contentStr = clause?.segment?.content?.toLowerCase() || "";
    const categoryStr = clause?.classification?.predicted_category?.toLowerCase() || "";
    const matchesSearch = !searchTerm || contentStr.includes(searchLower) || categoryStr.includes(searchLower);
    
    return matchesFilter && matchesSearch;
  }) || [];

  const totalClauses = apiData?.results?.length || 0;
  const safeCount = apiData?.results?.filter(c => c?.classification?.risk_level?.toUpperCase().includes('LOW')).length || 0;
  const mediumCount = apiData?.results?.filter(c => c?.classification?.risk_level?.toUpperCase().includes('MEDIUM')).length || 0;
  const criticalCount = apiData?.results?.filter(c => c?.classification?.risk_level?.toUpperCase().includes('HIGH') || c?.classification?.risk_level?.toUpperCase().includes('CRITICAL')).length || 0;

  const safePct = totalClauses > 0 ? (safeCount / totalClauses) * 100 : 0;
  const mediumPct = totalClauses > 0 ? (mediumCount / totalClauses) * 100 : 0;
  const criticalPct = totalClauses > 0 ? (criticalCount / totalClauses) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Base Background Layer */}
      <div className="fixed inset-0 z-[-2] bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-200" />
      
      {/* Holographic Architectural Grid */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Living Ambient Background Orbs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none print:hidden">
        <motion.div 
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 dark:opacity-20 bg-gradient-to-br from-cyan-300 to-teal-300 dark:from-cyan-600 dark:to-teal-600"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 dark:opacity-20 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-600 dark:to-purple-600"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Global Header */}
      <GlobalHeader theme={theme} setTheme={setTheme} mounted={mounted} />

      {/* Page Wrapper */}
      <main 
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-28 pb-12 sm:px-6 lg:px-8 group/main print:pt-0 print:block"
      >
        {/* Liquid Hero Section */}
        <div className="print:hidden">
          <LiquidHero theme={mounted ? theme : 'light'} />
        </div>

        {/* Bento-box Grid Wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-10 print:hidden"
        >
          
          {/* Orchestration Connection Line (SVG) */}
          <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
            <svg className="w-full h-full" style={{ minHeight: '380px' }}>
              <line 
                x1="16.6%" y1="50%" x2="75%" y2="50%" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="6,6" 
                className="text-slate-300 dark:text-slate-700/60" 
              />
              {isUploading && !isComplete && (
                <motion.circle 
                  cy="50%" r="6" 
                  fill={theme === 'light' ? '#0f172a' : '#22d3ee'} 
                  style={{ filter: theme === 'light' ? 'drop-shadow(0 0 8px rgba(15,23,42,0.4))' : 'drop-shadow(0 0 12px #22d3ee)' }}
                  initial={{ cx: "16.6%" }}
                  animate={{ cx: "75%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </svg>
          </div>

          {/* Left Column (Upload Node) */}
          <SpotlightCard 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            className="col-span-1 relative z-10 flex flex-col rounded-2xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-200"
          >
            <div className="flex-1 rounded-2xl relative overflow-hidden h-full w-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] dark:shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] dark:shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] dark:shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>

              {/* Graceful Error Banner */}
              <AnimatePresence>
                {backendError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pt-6 -mb-2 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 backdrop-blur-md shadow-sm relative">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-0.5">Analysis Failed</p>
                        <p className="text-xs text-red-600 dark:text-red-300 font-medium leading-relaxed">{backendError}</p>
                      </div>
                      <button 
                        onClick={() => setBackendError(null)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors absolute top-3 right-3"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[380px]">
                {!isUploading ? (
                  !file ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
                        isDragOver 
                          ? 'border-slate-900 bg-slate-50 dark:border-cyan-500 dark:bg-cyan-500/10' 
                          : 'border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-400 hover:bg-slate-100 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/5'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf" 
                        className="hidden" 
                      />
                      <div className={`p-4 rounded-full mb-4 transition-colors shadow-sm dark:shadow-none border border-slate-200/60 dark:border-white/5 ${isDragOver ? 'bg-slate-100 dark:bg-cyan-500/20' : 'bg-white dark:bg-white/[0.05] group-hover:bg-slate-50 dark:group-hover:bg-cyan-500/10'}`}>
                        <UploadCloud className={`h-10 w-10 transition-colors ${isDragOver ? 'text-slate-900 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-cyan-400'}`} />
                      </div>
                      <p className="text-slate-900 dark:text-white font-semibold mb-1.5 text-lg">Drag & Drop PDF</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">or click to browse local files</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] shadow-inner p-6 text-center relative">
                      <motion.button 
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.95 }}
                        onClick={removeFile}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white dark:bg-white/5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors shadow-sm border border-slate-200/60 dark:border-transparent"
                        title="Remove file"
                      >
                        <XCircle className="h-5 w-5" />
                      </motion.button>
                      <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-500/10 mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm dark:shadow-none">
                        <FileText className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-semibold mb-1 truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-mono">
                        {formatFileSize(file.size)}
                      </p>
                      <SpotlightButton 
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        onClick={handleStartAnalysis}
                        className="relative overflow-hidden w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border dark:border-cyan-500/30 dark:shadow-[0_0_15px_rgba(34,211,238,0.15)] dark:hover:bg-cyan-500/20 font-bold tracking-wide shadow-md transition-all uppercase text-sm group active:scale-[0.98] active:brightness-90"
                      >
                        <span className="relative z-10">Start Risk Analysis</span>
                        {/* Shimmer Effect */}
                        <motion.div 
                          className="absolute inset-0 z-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                        />
                      </SpotlightButton>
                    </div>
                  )
                ) : !isComplete ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19]/50 shadow-inner relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-0 z-0 w-[200%] h-full bg-gradient-to-r from-transparent via-slate-200/70 dark:via-cyan-500/15 to-transparent skew-x-[-20deg]"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                    
                    {/* Active Laser Scanner Overlay */}
                    <motion.div 
                      className="absolute left-0 right-0 h-[2px] bg-cyan-400 z-20 shadow-[0_0_20px_5px_rgba(34,211,238,0.5)]"
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ ease: "linear", duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    />

                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="relative mb-8">
                        <svg className="w-16 h-16 animate-spin text-slate-800 dark:text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <div className="absolute inset-0 rounded-full blur-xl bg-slate-400/20 dark:bg-cyan-400/30 animate-pulse"></div>
                      </div>
                      <p className="text-slate-900 dark:text-cyan-400 font-mono text-[13px] uppercase tracking-[0.2em] animate-pulse font-bold text-center px-4">
                        Vectorizing & Auditing Clauses...
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 shadow-inner relative"
                  >
                    <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)] dark:shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Analysis Complete</span>
                    </div>

                    <div className="mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 p-4 border border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <FileText className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-semibold mb-1 truncate max-w-[200px]" title={file?.name}>
                      {file?.name || "Document"}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">
                      {file ? formatFileSize(file.size) : "Processed"}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </SpotlightCard>
          
          {/* Rest of Bento Grid (Right Columns) */}
          <div className="col-span-1 lg:col-span-2 relative z-10 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {!isUploading && !isComplete ? (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.02] flex items-center justify-center min-h-[380px] overflow-hidden relative shadow-sm dark:shadow-none"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Shield className="h-64 w-64 text-slate-300 dark:text-slate-700 opacity-[0.15] dark:opacity-10" strokeWidth={1} />
                  </div>
                  <div className="relative z-10 text-center px-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Awaiting Document Payload
                    </p>
                  </div>
                </motion.div>
              ) : isUploading && !isComplete ? (
                /* Animated Skeleton Loader */
                <motion.div 
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full flex flex-col gap-6"
                >
                  <SpotlightCard 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                      <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col justify-center p-6 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 animate-pulse">
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/50 rounded mb-4"></div>
                          <div className="h-12 w-20 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>
                  <SpotlightCard 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none flex-1 p-6 flex flex-col gap-6 animate-pulse"
                  >
                    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                    <div className="flex flex-col gap-4 mt-2">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                      <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                      <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full flex flex-col gap-6"
                >
                  {/* Top Card: Telemetry Scoreboard */}
                  <SpotlightCard 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-200"
                  >
                    <div className="rounded-2xl relative overflow-hidden h-full w-full flex flex-col">
                      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                        <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] dark:shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] dark:shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                        <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] dark:shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Risk Score */}
                        <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 shadow-inner relative">
                          <span className="absolute top-4 left-5 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-[0.15em] font-bold">Total Risk Score</span>
                          <RadialRiskScore score={apiData?.overall_risk_score || 0} />
                        </div>
                        
                        {/* Clauses Scanned */}
                        <div className="flex flex-col justify-center p-6 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 shadow-inner">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-[0.15em] font-bold">Clauses Scanned</span>
                          </div>
                          <span className="text-5xl font-extrabold text-slate-800 dark:text-white">
                            <AnimatedCounter value={apiData?.total_clauses || 0} />
                          </span>
                        </div>

                        {/* Critical Liabilities */}
                        <div className={`flex flex-col justify-center p-6 rounded-xl shadow-inner border ${apiData?.critical_flags && apiData.critical_flags > 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`${apiData?.critical_flags && apiData.critical_flags > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'} text-[11px] uppercase tracking-[0.15em] font-bold`}>Critical Liabilities</span>
                            {apiData?.critical_flags && apiData.critical_flags > 0 ? <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" /> : null}
                          </div>
                          <span className={`text-5xl font-extrabold ${apiData?.critical_flags && apiData.critical_flags > 0 ? 'text-red-600 dark:text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] dark:drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'text-slate-800 dark:text-white'}`}>
                            <AnimatedCounter value={apiData?.critical_flags || 0} />
                          </span>
                        </div>
                        
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Middle Card: Risk Distribution Bar */}
                  <SpotlightCard 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none p-6 flex flex-col gap-4 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Risk Distribution</span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{totalClauses} Total Segments</span>
                    </div>
                    <div className="w-full h-2 flex rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                      <motion.div 
                        title={`${safeCount} Safe Clauses`}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] hover:brightness-110 cursor-pointer" 
                        style={{ width: `${safePct}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${safePct}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.1 }}
                      />
                      <motion.div 
                        title={`${mediumCount} Medium Risk Clauses`}
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)] hover:brightness-110 cursor-pointer" 
                        style={{ width: `${mediumPct}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${mediumPct}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.2 }}
                      />
                      <motion.div 
                        title={`${criticalCount} Critical Risk Clauses`}
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)] hover:brightness-110 cursor-pointer" 
                        style={{ width: `${criticalPct}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${criticalPct}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.3 }}
                      />
                    </div>
                  </SpotlightCard>

                  {/* Bottom Card: Monospace Terminal Specs */}
                  <SpotlightCard 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm dark:shadow-none flex-1 transition-colors duration-200 overflow-hidden p-1.5"
                  >
                    <div className="h-full w-full rounded-xl bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-300 border flex flex-col font-mono text-sm shadow-inner relative overflow-hidden transition-colors z-10">
                      {/* Fake Terminal Header */}
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80 transition-colors">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        </div>
                        <span className="ml-4 text-xs font-semibold text-slate-500">core-engine.log</span>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col justify-center gap-5">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4">
                          <span className="text-slate-500 dark:text-slate-400">Inference_Engine:</span>
                          <span className="text-blue-600 dark:text-cyan-400 font-bold tracking-wide font-mono">LLaMA-3.1 (Groq LPU)</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4">
                          <span className="text-slate-500 dark:text-slate-400">Retrieval_Architecture:</span>
                          <span className="text-blue-600 dark:text-indigo-400 font-bold tracking-wide font-mono">ChromaDB HNSW Index</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4">
                          <span className="text-slate-500 dark:text-slate-400">Classification_Layer:</span>
                          <span className="text-blue-600 dark:text-purple-400 font-bold tracking-wide font-mono">TF-IDF + Random Forest</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">System_Status:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 tracking-wide uppercase text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            Synchronized
                          </span>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Audit Trail Section */}
        <AnimatePresence>
          {isUploading && !isComplete && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-4 pb-16 relative z-10 mt-6"
            >
              <div className="flex items-center gap-3 mb-2 px-2 animate-pulse">
                <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700/50"></div>
              </div>
              
              {[1, 2, 3, 4].map((i) => (
                <SpotlightCard 
                  key={i} 
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 p-6 animate-pulse shadow-sm dark:shadow-none"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-5">
                      <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                      <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          )}

          {isComplete && apiData && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full flex flex-col pb-16 relative z-10 print:w-full print:block print:bg-white print:text-black print:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 px-2">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-slate-900 dark:text-indigo-400" />
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Audit Trail & Injections
                  </h2>
                </div>
                
                {/* Audit Action Bar */}
                <div className="flex items-center gap-3 w-full sm:w-auto print:hidden">
                  <SpotlightButton 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 text-sm font-semibold transition-colors shadow-sm dark:shadow-none"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Upload Another Document
                  </SpotlightButton>
                  <SpotlightButton 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-semibold shadow-md transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Audit
                  </SpotlightButton>
                </div>
              </div>

              {/* Controls Bar (Search & Filter) */}
              <div className="sticky top-[72px] z-30 w-full mb-6 p-3 rounded-xl bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search clauses..."
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200/60 dark:border-white/10 rounded-lg leading-5 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-cyan-500/50 focus:border-slate-300 dark:focus:border-cyan-500/50 sm:text-sm transition-colors"
                  />
                </div>
                <div className="relative min-w-[160px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="block w-full pl-10 pr-8 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer sm:text-sm transition-colors"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="All Risks">All Risks</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Critical">Critical</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="High">High</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Medium">Medium</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Low">Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              {filteredResults.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No clauses match the current filter.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredResults.map((clause, index) => {
                    const style = getRiskColorClasses(clause?.classification?.risk_level || "Low");
                    const isExpanded = expandedIds.has(clause?.segment?.segment_id || "");
                    const isTextExpanded = expandedTextClauses.has(clause?.segment?.segment_id || "");
                    
                    return (
                      <SpotlightCard 
                        key={`${clause?.segment?.segment_id || "clause"}-${index}`} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                        className={`rounded-xl bg-white dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/60 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-all duration-300 ${style.shadow || ''} print:break-inside-avoid print:mb-8 print:bg-white print:border-slate-300 print:text-black`}
                      >
                        <button 
                          data-state={isExpanded ? 'open' : 'closed'}
                          onClick={() => setExpandedIds(prev => {
                            const next = new Set(prev);
                            const id = clause?.segment?.segment_id || "";
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            return next;
                          })}
                          className="w-full flex items-center justify-between p-5 bg-slate-50/50 dark:bg-white/[0.02] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-300 ease-out text-left border-b border-slate-200/60 dark:border-white/0 focus:outline-none relative z-10 group active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-5">
                            <span className="text-slate-900 dark:text-white text-lg font-bold">
                              {formatCategory(clause?.classification?.predicted_category || "")}
                              <span className="ml-3 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-normal font-mono align-middle">
                                {clause?.segment?.segment_id || "Unknown Section"}
                              </span>
                            </span>
                            <motion.span 
                              whileHover={{ scale: 1.05 }}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.border} flex items-center gap-2 cursor-default transition-colors hover:brightness-95 dark:hover:brightness-110`}
                            >
                              {style.icon}
                              {clause?.classification?.risk_level || "Low"} Risk
                            </motion.span>
                          </div>
                          <div className="p-1 rounded-full bg-white dark:bg-white/[0.05] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-white/5 transition-transform duration-300 group-data-[state=open]:rotate-180">
                            <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden relative z-10"
                            >
                              <div className="p-6 border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-transparent">
                                <div className="bg-slate-50 dark:bg-[#121826] print:bg-white print:border-slate-300 p-8 rounded-lg border border-slate-200/60 dark:border-slate-700/50 shadow-inner mb-6 relative">
                                  <motion.div 
                                    animate={{ height: isTextExpanded || (clause?.segment?.content || "").length <= 250 ? "auto" : "150px" }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className={`overflow-hidden print:!max-h-none print:!h-auto print:!overflow-visible print:![mask-image:none] print:![-webkit-mask-image:none] ${!isTextExpanded && (clause?.segment?.content || "").length > 250 ? "[mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]" : ""}`}
                                  >
                                    <p 
                                      className="font-serif text-[1.05rem] leading-[1.8] text-slate-800 dark:text-slate-200 text-justify tracking-wide whitespace-pre-line print:text-black print:drop-shadow-none"
                                      dangerouslySetInnerHTML={{ __html: formatLegalText(clause?.segment?.content || "") }}
                                    />
                                  </motion.div>
                                  {(clause?.segment?.content || "").length > 250 && (
                                    <div className={`flex justify-center print:hidden ${!isTextExpanded ? "absolute bottom-4 left-0 right-0 z-10" : "mt-6"}`}>
                                      <button 
                                        onClick={(e) => toggleTextExpansion(e, clause?.segment?.segment_id || "")}
                                        className="text-xs font-semibold tracking-widest uppercase text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-full backdrop-blur-sm transition-all active:scale-[0.98] active:brightness-90"
                                      >
                                        {isTextExpanded ? "Collapse Text" : "Read Full Clause"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                {clause?.audit && !clause.audit.is_compliant && (
                                  <div className="flex flex-col gap-4 font-sans">
                                    <div className="border-l-4 border-red-500 bg-gradient-to-r from-red-500/10 to-transparent p-5 rounded-r-md shadow-sm">
                                      <p className="text-xs font-mono text-red-700 dark:text-red-400 uppercase tracking-[0.15em] font-bold mb-2 flex items-center gap-2">
                                        <XCircle className="h-4 w-4" /> Statutory Violation
                                      </p>
                                      <p 
                                        className="text-[0.95rem] whitespace-pre-line text-red-900/90 dark:text-red-200/90 font-medium leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: formatAIProposal(clause.audit.violation_summary || "No summary provided.") }}
                                      />
                                    </div>
                                    
                                    {clause.audit.redlined_proposal && (
                                      <div className="border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-500/10 to-transparent p-5 rounded-r-md shadow-sm">
                                        <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.15em] font-bold mb-3 flex items-center gap-2">
                                          <Shield className="h-4 w-4" /> Redlined Counter-Proposal
                                        </p>
                                        <div className="min-h-[64px]">
                                          <p className="text-[0.95rem] whitespace-pre-line text-slate-900 dark:text-emerald-100/90 font-medium leading-relaxed">
                                            <TypewriterText 
                                              text={clause.audit.redlined_proposal} 
                                              delay={150} 
                                              speed={15} 
                                            />
                                            <motion.span
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ repeat: Infinity, duration: 0.8, repeatType: 'reverse' }}
                                              className="inline-block w-1.5 h-4 bg-slate-900 dark:bg-emerald-500 ml-1 translate-y-0.5"
                                            />
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {clause?.audit && clause.audit.is_compliant && (
                                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 p-5 relative overflow-hidden shadow-sm dark:shadow-inner font-sans">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-none dark:shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.15em] font-bold mb-2">AI COMPLIANCE AUDIT</p>
                                    <p 
                                      className="text-[0.95rem] whitespace-pre-line text-emerald-800/90 dark:text-emerald-200/80 leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: formatAIProposal(clause?.audit?.violation_summary || "Standard compliance detected. No anomalous liabilities found.") }}
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </SpotlightCard>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Proprietary Footer */}
      <footer className="w-full border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#0B0F19] py-5 mt-auto relative z-10 transition-colors duration-200">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
            PROPRIETARY ARCHITECTURE ENGINEERED BY{' '}
            <span className="font-bold text-slate-900 dark:text-cyan-400 drop-shadow-none dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
              SAAD ULLAH
            </span>{' '}
            © NEXGEN BUILDS. TECH
          </p>
        </div>
      </footer>
    </div>
  );
}