import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface GeminiPreviewProps {
  apiKey?: string;
}

const GeminiPreview: React.FC<GeminiPreviewProps> = ({ apiKey }) => {
  const [log, setLog] = useState<string>('Error: ReferenceError: "counter" is not defined at App.tsx:24:5');
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError("请在上方的配置部分添加您的 DeepSeek API Key 以测试此功能。");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { 
              role: "system", 
              content: "你是一名 AI 监管员。分析这个简短的错误日志，准确告诉开发人员哪个文件坏了以及如何修复。控制在 50 字以内。" 
            },
            { 
              role: "user", 
              content: `日志：${log}` 
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }

      const data = await response.json();
      setAnalysis(data.choices?.[0]?.message?.content || "未生成分析结果。");
      
    } catch (err: any) {
      setError(`分析失败: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 mt-8">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="text-purple-400" size={20} />
        <h3 className="text-lg font-semibold text-white">模拟器：DeepSeek 分析</h3>
      </div>
      
      <p className="text-slate-400 text-sm mb-4">
        在生成脚本之前，测试 DeepSeek 模型将如何分析日志。(需要有效 API Key)
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            粘贴虚拟错误日志
          </label>
          <textarea
            value={log}
            onChange={(e) => setLog(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-red-300 focus:border-purple-500 focus:outline-none h-24"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !log}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-all flex items-center space-x-2"
        >
          {loading ? (
            <span>正在连接 DeepSeek...</span>
          ) : (
            <>
              <Sparkles size={16} />
              <span>模拟分析</span>
            </>
          )}
        </button>

        {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 p-3 rounded">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}

        {analysis && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              AI 生成的反馈 (黑板输出)
            </label>
            <div className="bg-slate-900 border-l-4 border-purple-500 p-4 rounded-r">
              <p className="text-slate-200 text-sm whitespace-pre-wrap">{analysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiPreview;