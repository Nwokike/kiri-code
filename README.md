<div align="center">

  <img src="public/icons.svg" alt="Kiri Code" />

  <p>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/WebContainers-blue?style=flat-square" alt="WebContainers">
  </p>

  <h3>⚠️ PROJECT ARCHIVED & DEPRECATED ⚠️</h3>

</div>

> **Notice:** This project is no longer actively maintained and has been archived in a read-only state.

## Why is this archived?

I built Kiri Code to explore what in-browser AI coding tools could do. I am proud of the project, but keeping it going takes more time and money than I can justify right now.

My main work is in Python, so maintaining a large TypeScript and React app is outside my usual focus. For an active alternative in this space, see [Bolt DIY](https://github.com/stackblitz-labs/bolt.diy), the official open source version of Bolt.new. 

The code will stay public for historical, educational, and research use. You are welcome to fork it, study the WebContainer work, or reuse parts of the code, but there will be **no further updates, bug fixes, or support will be provided.**

---

## Legacy Documentation

<details>
<summary><b>Click here to view the original project documentation</b></summary>

<img src="public/icons.svg" alt="Kiri Code" />

An autonomous, 100% serverless, polyglot AI coding IDE that runs entirely in your browser.

Kiri Code brings the power of cloud-native development to the Edge. Built on top of WebContainers, it provides a full Node.js operating system inside your browser, augmented by background WebWorkers for Python, PHP, and Ruby execution. No backend. No Docker. No monthly server costs.

---

## 🌟 Features

* **Zero-Backend Architecture:** Everything from file hosting to AI agent orchestration happens locally on the client.
* **The "Two-Brain" Polyglot Engine:** Seamlessly write and execute Node.js, Python (Pyodide), PHP, and Ruby natively in the browser without UI-blocking.
* **Bring Your Own Key (BYOK) Vault:** Supports 20+ LLM providers (Anthropic, Gemini, OpenAI, Deepseek, etc.) via encrypted local storage.
* **Serverless GitHub Autonomy:** Uses `isomorphic-git` and LightningFS to clone, commit, and push directly to GitHub, bypassing traditional backends.
* **Progressive Web App (PWA):** Installable on iOS, Android, and Desktop. Caches heavy WASM binaries locally for instant offline boots.
* **Professional UX:** Utilizes `flexlayout-react` for a fully customizable, draggable, VS Code-like pane system.

---

## 🏗️ The Architecture Explained

Kiri Code solves several notoriously difficult browser-IDE challenges:

### 1. The File System Bridge
WebContainers (Node.js) and WASM environments (like Pyodide) operate in isolated memory spaces. Kiri Code utilizes a custom `RuntimeRouter` that recursively syncs LightningFS (IndexedDB) with the active WebWorker memory just-in-time for execution, allowing Python scripts to read files created by the Node.js agent.

### 2. The Agent-Terminal Emitter
Instead of hiding AI agent thoughts in the developer console, Kiri Code utilizes a `terminalEmitter` bus to pipe the Vercel AI SDK's tool executions (like running `npm install` or writing files) directly into the user's `xterm.js` UI, providing a transparent "Vibe Coding" experience.

### 3. Continuous Auto-Sync
A dedicated background loop watches the WebContainer memory. Upon any file change, it debounces for 1 second, writes the file to the browser's persistent IndexedDB, and queues a background Git commit.

---

## 🚀 Getting Started

Because Kiri Code requires highly specific Cross-Origin Isolation headers for WebContainers, you must run it using the provided Vite dev server.

### Prerequisites
* Node.js 18+
* `pnpm` (recommended) or `npm`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Nwokike/kiri-code.git
cd kiri-code

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

### Production Deployment

Kiri Code is built to be deployed on Edge networks like Cloudflare Pages or Vercel. Ensure your hosting provider is configured to send the following HTTP headers:

```http
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

---

## 🔑 Security & BYOK

Kiri Code operates strictly on a **Bring Your Own Key** model.

1.  Click the **"ON"** profile badge in the top right.
2.  Enter your GitHub PAT or LLM Provider API keys.
3.  Keys are saved to `localStorage`. They are never transmitted anywhere except directly to the official LLM/GitHub endpoints.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
</details>
