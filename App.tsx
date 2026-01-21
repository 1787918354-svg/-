
import React, { useState, useCallback, useRef } from 'react';
import { Upload, Trash2, Download, RefreshCw, Image as ImageIcon, CheckCircle, AlertCircle, Wand2, History } from 'lucide-react';
import { AppState, ProcessingResult } from './types';
import { removeWatermark } from './services/geminiService';
import EditorCanvas from './components/EditorCanvas';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Analyzing image...");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setState(AppState.EDITING);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedImage) return;
    
    setState(AppState.PROCESSING);
    setLoadingMsg("Removing watermark with AI...");
    setError(null);

    try {
      // In this version, we send the original image to Gemini with explicit instructions.
      // Gemini 2.5 Flash Image is smart enough to find the watermarks and remove them.
      const result = await removeWatermark(selectedImage);
      setResultImage(result);
      setState(AppState.COMPLETED);
      
      const newEntry: ProcessingResult = {
        originalUrl: selectedImage,
        resultUrl: result,
        timestamp: Date.now()
      };
      setHistory(prev => [newEntry, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to process image. Please try again.");
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResultImage(null);
    setState(AppState.IDLE);
    setError(null);
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `magic-eraser-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - History */}
      <aside className="w-full md:w-80 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-auto md:h-screen transition-all">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Wand2 className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Magic Eraser
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4 text-slate-400 font-medium text-sm">
            <History size={16} />
            Recent Edits
          </div>
          
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm text-center">
              <ImageIcon size={32} className="mb-2 opacity-20" />
              <p>No history yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {history.map((item) => (
                <div 
                  key={item.timestamp} 
                  className="group relative rounded-lg overflow-hidden border border-slate-800 hover:border-blue-500 transition-colors cursor-pointer aspect-square"
                  onClick={() => {
                    setResultImage(item.resultUrl);
                    setSelectedImage(item.originalUrl);
                    setState(AppState.COMPLETED);
                  }}
                >
                  <img src={item.resultUrl} className="w-full h-full object-cover" alt="History" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
          Powered by Gemini 2.5 Flash
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen relative">
        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              state === AppState.IDLE ? 'bg-slate-500' :
              state === AppState.PROCESSING ? 'bg-amber-500 animate-pulse' :
              'bg-emerald-500'
            }`} />
            <span className="text-sm font-medium text-slate-300">
              {state === AppState.IDLE && "Ready to start"}
              {state === AppState.EDITING && "Edit Mode"}
              {state === AppState.PROCESSING && "Processing..."}
              {state === AppState.COMPLETED && "Done"}
              {state === AppState.ERROR && "Error encountered"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {(state === AppState.EDITING || state === AppState.COMPLETED || state === AppState.ERROR) && (
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <Trash2 size={16} />
                Discard
              </button>
            )}
            
            {state === AppState.COMPLETED && (
              <button 
                onClick={downloadResult}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-blue-900/20 transition-all"
              >
                <Download size={16} />
                Download Result
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
          {state === AppState.IDLE ? (
            <div className="max-w-xl w-full">
              <label className="group relative border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                  <Upload className="text-slate-400 group-hover:text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Upload an image</h2>
                <p className="text-slate-500 text-center mb-8">
                  Drag and drop or click to browse.<br />
                  Supports PNG, JPG, and WEBP.
                </p>
                <span className="px-6 py-2.5 bg-slate-900 rounded-full text-sm font-medium text-slate-300 group-hover:bg-slate-800 transition-colors">
                  Choose File
                </span>
              </label>
              
              <div className="mt-12 grid grid-cols-3 gap-6 opacity-40">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">1</div>
                  <span className="text-xs font-semibold">Upload Photo</span>
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">2</div>
                  <span className="text-xs font-semibold">AI Detection</span>
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">3</div>
                  <span className="text-xs font-semibold">Instant Magic</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
              <div className="w-full max-w-4xl flex-1 relative flex items-center justify-center">
                {state === AppState.EDITING && selectedImage && (
                  <EditorCanvas 
                    imageSrc={selectedImage} 
                    onImageReady={(canvas) => { canvasRef.current = canvas; }} 
                  />
                )}

                {state === AppState.PROCESSING && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white mb-1">{loadingMsg}</p>
                      <p className="text-sm text-slate-500">This usually takes a few seconds...</p>
                    </div>
                  </div>
                )}

                {state === AppState.COMPLETED && resultImage && (
                  <div className="w-full h-full flex items-center justify-center relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                    <img src={resultImage} className="max-w-full max-h-full object-contain" alt="Result" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex justify-center">
                        <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md px-4 py-2 rounded-full text-emerald-400 text-sm font-medium">
                            <CheckCircle size={16} />
                            Watermark successfully removed
                        </div>
                    </div>
                  </div>
                )}

                {state === AppState.ERROR && (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-900/50 rounded-xl border border-red-500/20">
                     <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                       <AlertCircle size={40} />
                     </div>
                     <div className="text-center px-6">
                        <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
                        <p className="text-slate-400 max-w-sm mb-6">{error}</p>
                        <button 
                          onClick={handleProcess}
                          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                        >
                          <RefreshCw size={16} />
                          Try Again
                        </button>
                     </div>
                   </div>
                )}
              </div>

              {state === AppState.EDITING && (
                <div className="w-full max-w-md flex flex-col gap-4">
                  <button 
                    onClick={handleProcess}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 transition-all"
                  >
                    <Wand2 />
                    Remove Watermark
                  </button>
                  <p className="text-center text-slate-500 text-xs">
                    Our AI automatically detects and intelligently fills watermarked areas.
                  </p>
                </div>
              )}

              {state === AppState.COMPLETED && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Start New
                  </button>
                  <button 
                    onClick={downloadResult}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-colors"
                  >
                    Save Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        {state === AppState.IDLE && (
          <footer className="p-8 text-center text-slate-600 text-sm">
            <p>&copy; 2024 Magic Eraser AI. Professional watermark removal using Gemini Vision.</p>
          </footer>
        )}
      </main>
    </div>
  );
};

export default App;
