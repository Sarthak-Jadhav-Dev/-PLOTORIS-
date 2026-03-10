<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Deep%20Research%20AI%20Team&fontSize=50&animation=fadeIn" />

  **An advanced, multi-agent AI framework based on LangGraph that orchestrates a team of specialized AI workers to perform deep, comprehensive research.**
  
  [![Python](https://img.shields.io/badge/Python-3.12+-blue.svg?style=for-the-badge&logo=python)](https://python.org)
  [![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=for-the-badge&logo=docker)](https://docker.com)
  [![MCP](https://img.shields.io/badge/MCP-Ready-brightgreen.svg?style=for-the-badge&logo=dependabot)](https://modelcontextprotocol.io/)
</div>

<br>

<div align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Magnifying%20Glass%20Tilted%20Right.png" alt="Magnifying Glass" width="50" height="50" />
</div>

## ✨ Features

- 🧠 **Multi-Agent Architecture**: A "Leader" agent breaks down complex queries and distributes them to specialized "Worker" agents.
- 📚 **RAG & Vector Search**: Includes Qdrant-backed vector search to ground research in your own PDF/Document datasets!
- 🔌 **MCP Native**: Run it as an automated, locally-hosted tool for your favorite MCP-compatible clients (like Claude Desktop).
- 🐳 **Fully Dockerized**: Completely containerized for easy and reliable execution anywhere, bypassing dependency hell.

---

## 🏃‍♂️ Normal Mode (Standalone CLI)

You can run the script normally via your terminal. In this mode, the system will prompt you interactively for the research query and settings.

### 1. Setup your Environment

Create a `.env` file in the root of the project and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the System
```bash
python main.py
```
*The script will prompt you for your query, the number of worker agents to spawn, and whether you want to use local documents (RAG) for the research context.*

---

## 🤖 MCP Mode (Model Context Protocol)

<div align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Robot.png" alt="Robot" width="50" height="50" />
</div>

The best way to experience this system is by plugging it directly into an LLM client (like Claude Desktop) as a local **MCP Tool**. Because we've bundled this into a Docker container, it takes only minutes to get running!

### 1. Download the Docker Image

You can pull the official image straight from Docker Hub:
```bash
docker pull sarthakjadhav200206/mcp-deep-research:latest
```

*(Alternatively, you can build it locally using `docker build -t mcp-deep-research .`)*

### 2. Configure your API Keys (Crucial Step)

Since the Docker container doesn't automatically know your Gemini API key, you have to provide it. You should do this by putting your API key in a `.env` file somewhere safe on your computer.

For example, create a file at `C:\Users\User\my-secrets\.env` and put this inside:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Configure your MCP Client (e.g., Claude Desktop)

In your MCP Client's configuration file (for Claude, it's typically `claude_desktop_config.json`), add the server definition. Notice we map two things:
1. The `--env-file` parameter pointing to your secret `.env` file.
2. A volume mount (`-v`) for the `docker.sock` so the MCP server can launch its own nested containers if it needs to spin up the Qdrant database.

```json
{
  "mcpServers": {
    "deep-research-team": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--env-file", "C:\\Users\\User\\my-secrets\\.env",
        "-v", "/var/run/docker.sock:/var/run/docker.sock",
        "sarthakjadhav200206/mcp-deep-research:latest"
      ]
    }
  }
}
```

### 4. Ask your AI to run it!
Restart your MCP Client. Now you can type prompts directly to Claude like:
> *"I need to research the impact of quantum computing on modern cryptography. Please use the 'run_deep_research' tool with 4 worker nodes."*

The Client will spin up the Dockerized MCP server, execute the multi-agent graph, aggregate the vast research, and present it back to you instantly!

---
<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" />
</div>
