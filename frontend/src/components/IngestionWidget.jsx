import React, { useState, useEffect, useRef } from 'react';
import { 
    Upload, FileText, CheckCircle, AlertCircle, X, 
    Minus, Maximize2, Terminal, Activity 
} from 'lucide-react';
import { uploadDocument } from '../api';

const IngestionWidget = ({ isOpen, onClose, onUploadSuccess }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [file, setFile] = useState(null);
    const [module, setModule] = useState("General");
    const [status, setStatus] = useState("idle"); 
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    
    // Auto-scroll logs
    const logEndRef = useRef(null);
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time: timestamp, msg, type }]);
    };

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setStatus("idle");
            setProgress(0);
            addLog(`Selected file: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus("uploading");
        setProgress(0);
        addLog(`Starting upload for ${file.name}...`, 'info');

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request timed out (10s)")), 10000)
        );

        try {
            // Race between upload and timeout
            const result = await Promise.race([
                uploadDocument(file, module, (percent) => {
                    setProgress(percent);
                    if (percent % 20 === 0 && percent < 100) {
                        addLog(`Upload progress: ${percent}%`);
                    }
                }),
                timeoutPromise
            ]);
            
            setStatus("success");
            setProgress(100);
            addLog(`Upload complete. Node ID: ${result.node_id}`, 'success');
            addLog(`Graph updated.`, 'success');
            onUploadSuccess();
            
            setTimeout(() => {
                setFile(null);
                setStatus("idle");
                setProgress(0);
            }, 3000);
            
        } catch (error) {
            console.error(error);
            setStatus("error");
            addLog(`Error: ${error.message}`, 'error');
            
            if (error.message.includes("timed out")) {
                 addLog("Tip: Check Backend console for freeze/crash.", 'info');
            }
        }
    };

    // Minimized View
    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-72 overflow-hidden flex flex-col">
                <div 
                    className="bg-gray-900 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMinimized(false)}
                >
                    <div className="flex items-center gap-2">
                        {status === 'uploading' ? (
                            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                        ) : (
                            <Upload className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-semibold text-white">Ingestion</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'uploading' && (
                            <span className="text-xs text-blue-400">{progress}%</span>
                        )}
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                {/* Progress bar line when minimized */}
                {status === 'uploading' && (
                    <div className="h-1 w-full bg-gray-700">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Expanded View
    return (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-96 flex flex-col max-h-[80vh] backdrop-blur-sm bg-opacity-95">
            {/* Header */}
            <div className="bg-gray-900 p-3 rounded-t-lg border-b border-gray-700 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-400" />
                    Ingestion Manager
                </h3>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setIsMinimized(true)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Minimize"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-red-900 rounded text-gray-400 hover:text-white"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* File Drop Area */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                    file 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                }`}>
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept=".txt,.md,.json"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                        <FileText className={`w-8 h-8 ${file ? 'text-blue-400' : 'text-gray-400'}`} />
                        <span className="text-xs text-gray-300 font-medium truncate max-w-full px-2">
                            {file ? file.name : "Select Document (MD/TXT)"}
                        </span>
                    </label>
                </div>

                {/* Controls */}
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Module Tag</label>
                        <input 
                            type="text" 
                            value={module}
                            onChange={(e) => setModule(e.target.value)}
                            className="w-full bg-black/20 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none mt-1"
                            placeholder="e.g. Payments"
                        />
                    </div>

                    {status === 'uploading' && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleUpload} 
                        disabled={!file || status === 'uploading'}
                        className={`w-full py-2 rounded text-sm font-semibold transition-all ${
                            status === 'success' 
                                ? 'bg-green-600 text-white cursor-default'
                                : status === 'error'
                                ? 'bg-red-600 text-white hover:bg-red-500'
                                : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {status === 'success' ? (
                            <span className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Done</span>
                        ) : status === 'error' ? (
                            <span className="flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4" /> Retry</span>
                        ) : (
                            'Ingest Document'
                        )}
                    </button>
                </div>

                {/* Debug Console */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Terminal className="w-3 h-3" />
                        <span className="text-[10px] font-mono uppercase">System Logs</span>
                    </div>
                    <div className="bg-black/40 rounded p-2 h-24 overflow-y-auto font-mono text-[10px] text-gray-300 space-y-1 custom-scrollbar">
                        {logs.length === 0 && <span className="text-gray-600 italic">Ready...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${
                                log.type === 'error' ? 'text-red-400' : 
                                log.type === 'success' ? 'text-green-400' : ''
                            }`}>
                                <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                <span>{log.msg}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IngestionWidget;

