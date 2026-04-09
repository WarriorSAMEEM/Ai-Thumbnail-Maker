import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Download, Wand2, History, ChevronRight, Settings2, Layout, User, Box, CheckCircle2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { generateThumbnail, type ThumbnailRequest } from '../services/gemini';
import { cn } from '../lib/utils';

export function ThumbnailEditor() {
  const [prompt, setPrompt] = useState('');
  const [styleImage, setStyleImage] = useState<string | undefined>();
  const [subjectImage, setSubjectImage] = useState<string | undefined>();
  const [objectImage, setObjectImage] = useState<string | undefined>();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'refine'>('generate');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');

  const statusMessages = [
    { threshold: 0, message: "Analyzing your prompt and references..." },
    { threshold: 20, message: "Composing the visual layout..." },
    { threshold: 40, message: "Generating high-fidelity details..." },
    { threshold: 70, message: "Applying final stylistic touches..." },
    { threshold: 90, message: "Polishing your masterpiece..." }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingProgress(0);
      setLoadingStatus(statusMessages[0].message);
      
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + Math.random() * 5;
          if (next >= 100) return 99; // Cap at 99 until finished
          
          // Update status message based on threshold
          const currentStatus = [...statusMessages].reverse().find(s => next >= s.threshold);
          if (currentStatus) setLoadingStatus(currentStatus.message);
          
          return next;
        });
      }, 500);
    } else {
      setLoadingProgress(0);
      setLoadingStatus('');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGenerate = async (isRefining = false) => {
    if (!prompt && !isRefining) return;
    
    setIsLoading(true);
    try {
      const req: ThumbnailRequest = {
        prompt,
        styleImage,
        subjectImage,
        objectImage,
        currentImage: isRefining ? (generatedImage || undefined) : undefined
      };
      
      const result = await generateThumbnail(req);
      if (result) {
        setGeneratedImage(result);
        setHistory(prev => [result, ...prev.slice(0, 4)]);
        if (isRefining) setActiveTab('generate');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `thumbnail-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col lg:flex-row">
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-[400px] bg-white border-r border-gray-200 p-6 flex flex-col gap-8 overflow-y-auto max-h-screen">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ThumbnailCraft AI</h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Professional Studio</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Describe your thumbnail
              </label>
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTab('generate')}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                    activeTab === 'generate' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  New
                </button>
                <button 
                  onClick={() => setActiveTab('refine')}
                  disabled={!generatedImage}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition-all disabled:opacity-50",
                    activeTab === 'refine' ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  Refine
                </button>
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'generate' ? "e.g. A dynamic gaming thumbnail with bright neon colors, bold text 'LEVEL UP', and high contrast..." : "e.g. Make the text bigger and change the background to a dark forest..."}
              className="w-full h-32 p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Settings2 className="w-4 h-4 text-gray-400" />
              Reference Images
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <ImageUpload
                label="Style Reference"
                description="Copy layout & aesthetic"
                value={styleImage}
                onChange={setStyleImage}
                className="bg-white"
              />
              <ImageUpload
                label="Main Subject"
                description="Face or character"
                value={subjectImage}
                onChange={setSubjectImage}
              />
              <ImageUpload
                label="Key Object"
                description="Icon or central element"
                value={objectImage}
                onChange={setObjectImage}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button
            onClick={() => handleGenerate(activeTab === 'refine')}
            disabled={isLoading || (!prompt && activeTab === 'generate')}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100",
              activeTab === 'generate' 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200" 
                : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-200"
            )}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : activeTab === 'generate' ? (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Thumbnail
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Apply Refinements
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 p-8 lg:p-12 flex flex-col gap-8 items-center justify-center bg-[#fcfcfc]">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Preview Canvas</h2>
              <p className="text-sm text-gray-500">1280 × 720 (16:9 Aspect Ratio)</p>
            </div>
            {generatedImage && (
              <div className="flex gap-3">
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </div>

          <div className="relative aspect-video w-full bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden group">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-10 p-8"
                >
                  <div className="relative mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full" 
                    />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600" />
                  </div>
                  
                  <div className="w-full max-w-md space-y-4 text-center">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold text-gray-900">
                        <span>{loadingStatus}</span>
                        <span>{Math.round(loadingProgress)}%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-8 pt-4">
                      {statusMessages.map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-all duration-500",
                            loadingProgress >= s.threshold ? "bg-blue-600 scale-125 shadow-lg shadow-blue-200" : "bg-gray-200"
                          )} />
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest pt-4">
                      AI Studio Engine Processing
                    </p>
                  </div>
                </motion.div>
              ) : generatedImage ? (
                <motion.img
                  key="result"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={generatedImage}
                  alt="Generated Thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100">
                    <Layout className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your canvas is empty</h3>
                  <p className="text-gray-500 max-w-sm">
                    Enter a prompt and upload reference images to start generating professional YouTube thumbnails.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <History className="w-4 h-4 text-gray-400" />
                Recent Generations
              </div>
              <div className="grid grid-cols-5 gap-4">
                {history.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGeneratedImage(img)}
                    className={cn(
                      "aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                      generatedImage === img ? "border-blue-500 shadow-lg shadow-blue-100" : "border-transparent"
                    )}
                  >
                    <img src={img} alt={`History ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
