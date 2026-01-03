export const REQUIREMENTS_TXT = `watchdog==4.0.0
rich==13.7.0
openai==1.55.0
pytest==8.0.0
`;

export const TRAE_PROMPT_TEMPLATE = `你是一名 AI 开发人员，正在与自动化监管员协同工作。

你的目标：
监控项目根目录下的 "AI_TODO.md" 文件。该文件充当我们的共享黑板。

规则：
1. 当 "AI_TODO.md" 报告 "测试失败 (Test Failed)" 状态时，请读取其中包含的错误日志。
2. 分析项目文件，根据错误找出根本原因。
3. 修复代码。
4. 保存文件。
5. 不要自己更新 "AI_TODO.md"。监管员会自动检测你的文件保存操作，重新运行测试，如果你成功了，它会将状态更新为 "✅ 所有测试通过"。
6. 如果你失败了，监管员会用新的错误日志更新黑板。请重试。

当前任务：
现在检查 "AI_TODO.md"。如果需要修复，请立即开始。`;

export const PYTHON_SCRIPT_TEMPLATE = (
  folder: string,
  command: string,
  useAI: boolean,
  debounce: number
) => `import time
import subprocess
import os
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from datetime import datetime

# --- 配置 ---
WATCH_DIR = r"${folder}"
TEST_COMMAND = "${command}"
DEBOUNCE_SECONDS = ${debounce}
AI_TODO_FILE = "AI_TODO.md"
DOCS_FILE = "docs.md"

# 忽略的文件类型和目录
IGNORE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.avi', '.mov', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.tar', '.gz', '.7z', '.exe', '.dll', '.so', '.dylib', '.class', '.o', '.obj', '.env', '.DS_Store', '.log', '.tmp'}
IGNORE_DIRS = {'.git', '__pycache__', '.pytest_cache', 'node_modules', 'venv', 'env', '.idea', '.vscode', 'dist', 'build', 'coverage'}

# DeepSeek / AI 配置 (可选)
USE_AI = ${useAI ? 'True' : 'False'}
# export DEEPSEEK_API_KEY="sk-..." 或在此处设置
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY") 
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

if USE_AI and DEEPSEEK_API_KEY:
    from openai import OpenAI
    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

console = Console()

class AutoTester(FileSystemEventHandler):
    def __init__(self):
        self.last_run = 0
        self.timer = None

    def on_any_event(self, event):
        if event.is_directory:
            return
        
        filename = os.path.basename(event.src_path)
        
        # 忽略脚本自身和 TODO 文件
        if filename in [AI_TODO_FILE, DOCS_FILE, "supervisor.py", "requirements.txt"]:
            return
            
        # 忽略特定后缀
        if any(filename.lower().endswith(ext) for ext in IGNORE_EXTENSIONS):
            return
            
        # 忽略特定目录
        path_parts = event.src_path.split(os.sep)
        if any(part in IGNORE_DIRS for part in path_parts):
            return
            
        current_time = time.time()
        if current_time - self.last_run < DEBOUNCE_SECONDS:
            return
        
        self.last_run = current_time
        console.log(f"[bold yellow]检测到 {filename} 发生变更... 等待稳定。[/]")
        
        time.sleep(1) 
        self.run_tests()

    def run_tests(self):
        console.rule("[bold blue]正在运行测试[/]")
        try:
            # 执行测试命令
            result = subprocess.run(
                TEST_COMMAND, 
                shell=True, 
                capture_output=True, 
                text=True
            )
            
            if result.returncode == 0:
                self.handle_success()
            else:
                self.handle_failure(result.stdout + result.stderr)

        except Exception as e:
            console.print(f"[bold red]执行测试时发生系统错误：[/]\\n{str(e)}")

    def handle_success(self):
        msg = "# ✅ 所有测试通过\\n\\n干得好！系统很稳定。"
        with open(AI_TODO_FILE, "w", encoding="utf-8") as f:
            f.write(msg)
        console.print(Panel("测试通过！", style="green bold"))

    def handle_failure(self, error_log):
        console.print(Panel("测试失败！正在生成报告...", style="red bold"))
        
        analysis = "请查看下方的错误日志。"
        
        # 使用 DeepSeek 进行分析
        if USE_AI and DEEPSEEK_API_KEY:
            try:
                docs_content = ""
                if os.path.exists(DOCS_FILE):
                    with open(DOCS_FILE, 'r', encoding='utf-8') as df:
                        docs_content = df.read()
                        
                system_prompt = "你是一名 QA 负责人。根据提供的文档分析此错误日志。简要解释失败原因并为开发人员提供修复建议。"
                user_content = f"文档:\\n{docs_content[:2000]}\\n\\n错误日志:\\n{error_log[-4000:]}"
                
                response = client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    stream=False
                )
                analysis = response.choices[0].message.content
            except Exception as ai_e:
                console.log(f"[dim]AI 分析失败: {ai_e}[/]")

        # 写入黑板
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report = f"""# ⚠️ 需要 AI 修复
## 状态：测试失败
## 时间戳：{timestamp}

## AI 分析 (DeepSeek)
{analysis}

## 错误日志
\`\`\`text
{error_log}
\`\`\`

## 指令
Trae，请修复上面的 Bug。一旦你保存文件，我将自动重新测试。
"""
        with open(AI_TODO_FILE, "w", encoding="utf-8") as f:
            f.write(report)
        
        console.log(f"[bold red]AI_TODO.md 已更新。等待修复...[/]")

if __name__ == "__main__":
    path = WATCH_DIR if os.path.exists(WATCH_DIR) else "."
    
    event_handler = AutoTester()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    
    abs_path = os.path.abspath(AI_TODO_FILE)
    console.print(Panel(f"AI 监管员已激活 (DeepSeek 版)\\n监控路径: {path}\\n命令: {TEST_COMMAND}\\n\\n[bold]注意：[/] AI_TODO.md 将在此处生成：\\n{abs_path}", style="bold blue"))
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
`;