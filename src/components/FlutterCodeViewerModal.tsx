import React, { useState } from 'react';
import { FLUTTER_PROJECT_FILES, FlutterFile } from '../data/flutterCode';
import { Check, Copy, Code2, Download, FileCode, Smartphone, X, Terminal } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterCodeViewerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_PROJECT_FILES[1]); // main.dart
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const element = document.createElement('a');
    const fileContent = selectedFile.code;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(blob);
    element.download = selectedFile.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1E1E2E] text-slate-100 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181825] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Flutter (Dart) 소스코드 및 프로젝트</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/20 text-sky-300 rounded-full border border-sky-500/30">
                  Material 3 / Dart 3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                플러터 앱 프로젝트 전체 코드입니다. 소스코드를 복사하여 Flutter 프로젝트에 바로 사용해보세요!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* File Sidebar Tree */}
          <div className="w-64 bg-[#181825] border-r border-slate-800 p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 flex items-center gap-1.0">
              <Code2 className="w-3.5 h-3.5" /> Flutter Files
            </div>

            {FLUTTER_PROJECT_FILES.map((file) => {
              const isActive = selectedFile.filename === file.filename;
              return (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}

            <div className="mt-auto p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> 시작하는 방법
              </div>
              1. Flutter SDK 설치<br />
              2. <code className="text-amber-300">flutter create paw_log</code><br />
              3. 위 코드들로 <code className="text-sky-300">lib/</code> 교체<br />
              4. <code className="text-emerald-300">flutter run</code> 실행
            </div>
          </div>

          {/* Code View Area */}
          <div className="flex-1 flex flex-col bg-[#1E1E2E] overflow-hidden">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-[#181825]/50 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300">{selectedFile.path}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAll}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> 파일 다운로드
                </button>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '복사 완료!' : '코드 복사'}
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-6 overflow-auto font-mono text-xs leading-relaxed text-slate-200 bg-[#1E1E2E]">
              <pre className="whitespace-pre">
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
