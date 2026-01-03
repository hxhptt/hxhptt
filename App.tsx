import React, { useState, useEffect } from 'react';
import { Download, Terminal, Settings, FileCode, Play, Cpu, Code2, FileText } from 'lucide-react';
import { PYTHON_SCRIPT_TEMPLATE, REQUIREMENTS_TXT, TRAE_PROMPT_TEMPLATE, README_MD } from './constants';
import CodeViewer from './components/CodeViewer';
import GeminiPreview from './components/GeminiPreview';

function App() {
  const [folder, setFolder] = useState('.');
  const [command, setCommand] = useState('pytest');
  const [debounce, setDebounce] = useState(3);
  const [useAI, setUseAI] = useState(true);
  const [apiKey, setApiKey] = useState(''); 
  const [activeTab, setActiveTab] = useState<'script' | 'requirements' | 'prompt' | 'readme'>('script');

  const generatedScript = PYTHON_SCRIPT_TEMPLATE(folder, command, useAI, debounce);

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
              <Cpu className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AI 监管员生成器</h1>
              <p className="text-xs text-slate-400">DeepSeek 驱动的自动化测试与 Bug 报告工具</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">文档</a>
             <button 
                onClick={() => downloadFile('supervisor.py', generatedScript)}
                className="bg-white text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2"
             >
                <Download size={16} />
                <span>下载脚本</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg">
            <div className="flex items-center space-x-2 mb-6 border-b border-slate-800 pb-4">
              <Settings className="text-blue-400" size={20} />
              <h2 className="text-lg font-semibold text-white">配置</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">监控目录</label>
                <input 
                  type="text" 
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="例如 ./src 或 /absolute/path"
                />
                <p className="text-[10px] text-slate-500 mt-1">要监控的相对或绝对路径。</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">测试命令</label>
                <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-mono text-lg">{`>`}</span>
                    <input 
                    type="text" 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-green-400 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="pytest"
                    />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">文件保存时运行的命令 (例如: npm test, pytest)。</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">防抖 (秒)</label>
                    <input 
                    type="number" 
                    value={debounce}
                    onChange={(e) => setDebounce(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    min={1}
                    max={10}
                    />
                </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">AI 分析</label>
                    <button 
                        onClick={() => setUseAI(!useAI)}
                        className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors border ${useAI ? 'bg-purple-900/30 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >
                        {useAI ? 'DeepSeek' : '已禁用'}
                    </button>
                </div>
              </div>

               {useAI && (
                <div className="pt-4 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-purple-400 mb-1 uppercase tracking-wider">
                        DeepSeek API Key (可选)
                    </label>
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                        下方的模拟器需要此项。生成的 Python 脚本将期望在环境变量 <code>DEEPSEEK_API_KEY</code> 中找到它。
                    </p>
                </div>
               )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg">
             <div className="flex items-center space-x-2 mb-4">
                <Play className="text-green-400" size={20} />
                <h2 className="text-lg font-semibold text-white">全自动 BUG 调试</h2>
             </div>
             <p className="text-sm text-slate-400 mb-4">
               让 AI 死磕 AI，具体的空了再写，兄弟们先试试。
             </p>
             <div className="space-y-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-200">使用方法：</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>下载 <code>supervisor.py</code> 和 <code>requirements.txt</code>。</li>
                    <li>安装依赖: <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">pip install -r requirements.txt</code></li>
                    <li>设置 Key: <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">export DEEPSEEK_API_KEY=sk-...</code></li>
                    <li>运行: <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">python supervisor.py</code></li>
                    <li>如果测试失败，DeepSeek 会分析日志并写入 <code>AI_TODO.md</code>。</li>
                </ol>
             </div>
          </div>

          {useAI && <GeminiPreview apiKey={apiKey} />}

        </div>

        {/* Right Panel: Output */}
        <div className="lg:col-span-8 flex flex-col h-full">
            
            {/* Tabs */}
            <div className="flex space-x-1 mb-4 bg-slate-900/50 p-1 rounded-lg w-fit overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('script')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'script' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Terminal size={16} />
                    <span>supervisor.py</span>
                </button>
                <button 
                    onClick={() => setActiveTab('requirements')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'requirements' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <FileCode size={16} />
                    <span>requirements.txt</span>
                </button>
                <button 
                    onClick={() => setActiveTab('readme')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'readme' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <FileText size={16} />
                    <span>README.md</span>
                </button>
                <button 
                    onClick={() => setActiveTab('prompt')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'prompt' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Code2 size={16} />
                    <span>Trae 提示词</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {activeTab === 'script' && (
                    <CodeViewer 
                        filename="supervisor.py" 
                        code={generatedScript} 
                        language="python"
                    />
                )}
                {activeTab === 'requirements' && (
                    <CodeViewer 
                        filename="requirements.txt" 
                        code={REQUIREMENTS_TXT} 
                        language="text"
                    />
                )}
                {activeTab === 'readme' && (
                     <CodeViewer 
                        filename="README.md" 
                        code={README_MD} 
                        language="markdown"
                    />
                )}
                {activeTab === 'prompt' && (
                     <CodeViewer 
                        filename="trae_instructions.txt" 
                        code={TRAE_PROMPT_TEMPLATE} 
                        language="text"
                    />
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;