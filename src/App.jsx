import React, { useState, useRef } from "react";

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl text-sm font-medium px-3 py-2 transition active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-offset-1";

  const variants = {
    default:
      "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm",
    primary:
      "bg-black text-white border border-black hover:bg-slate-900 shadow-sm",
    quiet:
      "bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent",
    danger:
      "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 shadow-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ className = "", children }) {
  return (
    <div
      className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

function CardBody({ className = "", children }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${className}`}
      {...props}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${className}`}
      {...props}
    />
  );
}

function Pill({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function qualityTone(score) {
  if (score == null) return "neutral";
  if (score >= 85) return "success";
  if (score >= 70) return "warning";
  return "danger";
}

function formatDateTime(d) {
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

const SCENARIOS = [
  { id: "new_investment", label: "New direct investment" },
  { id: "new_fund_commitment", label: "New fund commitment" },
  { id: "exit_realisation", label: "Exit/realization" },
  { id: "revaluation", label: "Revaluation" },
];

const OUTPUT_TYPES = [
  { id: "transaction_text", label: "Transaction text" },
  { id: "investment_note", label: "Investor letter" },
  { id: "press_release", label: "Press release" },
  { id: "linkedin_post", label: "LinkedIn post" },
];

const MODEL_OPTIONS = [
  { id: "gpt-4o-mini", label: "gpt-4o-mini (fast, cheap)" },
  { id: "gpt-4o", label: "gpt-4o (strong general model)" },
  { id: "gpt-4.1-mini", label: "gpt-4.1-mini (balanced)" },
  { id: "gpt-4.1", label: "gpt-4.1 (highest quality)" },
];

function getScenarioLabel(id) {
  const match = SCENARIOS.find((s) => s.id === id);
  return match ? match.label : id || "Default";
}

function getModelLabel(id) {
  const match = MODEL_OPTIONS.find((m) => m.id === id);
  return match ? match.label.split(" ")[0] : id || "model";
}

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(
    "https://content-engine-backend-v2.vercel.app/api"
  );
  const [connectionStatus, setConnectionStatus] = useState(null);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [rawText, setRawText] = useState("");

  const [scenario, setScenario] = useState("new_investment");
  const [selectedTypes, setSelectedTypes] = useState(["transaction_text"]);

  const [modelId, setModelId] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(2048);

  const [publicSearch, setPublicSearch] = useState(false);

  const [maxWords, setMaxWords] = useState("");

  // sources: { name, text, size, kind: "file" | "url" }
  const [sources, setSources] = useState([]);
  const fileInputRef = useRef(null);
  const [urlInput, setUrlInput] = useState("");

  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [draftText, setDraftText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);

  const [rewriteNotes, setRewriteNotes] = useState("");

  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const showToast = (message, duration = 2500) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  const currentVersion =
    versions.find((v) => v.id === selectedVersionId) || null;

  const combinedText = () => {
    const parts = [];
    if (rawText && rawText.trim().length > 0) parts.push(rawText.trim());
    sources.forEach((s) => {
      if (s.text && s.text.trim().length > 0) parts.push(s.text.trim());
    });
    return parts.join("\n\n");
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = String(e.target?.result || "");
        setSources((prev) => [
          ...prev,
          {
            name: file.name,
            text,
            size: file.size,
            kind: "file",
          },
        ]);
      };
      reader.readAsText(file);
    });
  };

  const handleDropFiles = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleAddUrlSource = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      showToast("Enter a URL first");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      showToast("Invalid URL");
      return;
    }

    if (!apiBaseUrl) {
      showToast("Set API base URL first");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/fetch-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        console.error("URL fetch failed with status", res.status);
        showToast("Failed to fetch URL");
        return;
      }

      const data = await res.json();
      if (!data.text || !data.text.trim()) {
        showToast("No readable text found at URL");
        return;
      }

      setSources((prev) => [
        ...prev,
        {
          name: trimmed,
          text: data.text,
          size: null,
          kind: "url",
        },
      ]);
      setUrlInput("");
      showToast("URL source added");
    } catch (e) {
      console.error("URL fetch error", e);
      showToast("Failed to fetch URL");
    }
  };

  const toggleType = (id) => {
    setSelectedTypes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  const handleCheckConnection = async () => {
    try {
      setConnectionStatus("checking");
      const res = await fetch(`${apiBaseUrl}/health`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setConnectionStatus("ok");
      showToast("Backend connection OK");
    } catch (e) {
      console.error("Health check failed", e);
      setConnectionStatus("error");
      showToast("Backend connection failed");
    }
  };

  const callBackend = async (path, payload) => {
    const res = await fetch(`${apiBaseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  };

  const handleGenerate = async () => {
    if (!apiBaseUrl) {
      showToast("Set API base URL first");
      return;
    }
    const textPayload = combinedText();
    if (!textPayload) {
      showToast("Add some source text, file or URL first");
      return;
    }
    if (!selectedTypes.length) {
      showToast("Select at least one output type");
      return;
    }

    const numericMaxWords =
      maxWords && !Number.isNaN(parseInt(maxWords, 10))
        ? parseInt(maxWords, 10)
        : undefined;

    const existingMax =
      versions.reduce(
        (max, v) =>
          v.versionNumber && v.versionNumber > max ? v.versionNumber : max,
        0
      ) || 0;

    setIsGenerating(true);
    try {
      const payload = {
        title,
        notes,
        text: textPayload,
        selectedTypes,
        scenario,
        modelId,
        temperature,
        maxTokens,
        publicSearch,
        maxWords: numericMaxWords,
      };

      const data = await callBackend("generate", payload);

      const outputs = Array.isArray(data.outputs) ? data.outputs : [];
      if (!outputs.length) {
        showToast("No outputs returned from backend");
        setIsGenerating(false);
        return;
      }

      const now = new Date();
      const newVersions = outputs.map((o, idx) => {
        const id = `${now.getTime()}-${idx}`;
        return {
          id,
          versionNumber: existingMax + idx + 1,
          createdAt: now.toISOString(),
          title: title || "Untitled",
          scenario,
          outputType: o.outputType,
          text: o.text,
          score: o.score,
          metrics: o.metrics || {},
        };
      });

      setVersions((prev) => [...prev, ...newVersions]);
      const primary = newVersions[0];
      setSelectedVersionId(primary.id);
      setDraftText(primary.text);
      showToast("Draft generated");
    } catch (e) {
      console.error("Error generating", e);
      showToast("Error generating draft");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async () => {
    if (!currentVersion) {
      showToast("Select a version to rewrite");
      return;
    }
    if (!apiBaseUrl) {
      showToast("Set API base URL first");
      return;
    }
    const textPayload = draftText || currentVersion.text;
    if (!textPayload) {
      showToast("Nothing to rewrite");
      return;
    }

    const numericMaxWords =
      maxWords && !Number.isNaN(parseInt(maxWords, 10))
        ? parseInt(maxWords, 10)
        : undefined;

    const existingMax =
      versions.reduce(
        (max, v) =>
          v.versionNumber && v.versionNumber > max ? v.versionNumber : max,
        0
      ) || 0;

    setIsRewriting(true);
    try {
      const payload = {
        text: textPayload,
        notes: rewriteNotes,
        outputType: currentVersion.outputType,
        scenario,
        modelId,
        temperature,
        maxTokens,
        maxWords: numericMaxWords,
      };

      const data = await callBackend("rewrite", payload);
      const out =
        Array.isArray(data.outputs) && data.outputs[0]
          ? data.outputs[0]
          : null;

      if (!out) {
        showToast("No rewrite returned from backend");
        setIsRewriting(false);
        return;
      }

      const now = new Date();
      const id = `${now.getTime()}-rw`;

      const newVersion = {
        id,
        versionNumber: existingMax + 1,
        createdAt: now.toISOString(),
        title: title || currentVersion.title || "Untitled",
        scenario,
        outputType: currentVersion.outputType,
        text: out.text,
        score: out.score,
        metrics: out.metrics || {},
      };

      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersionId(id);
      setDraftText(out.text);
      showToast("Rewrite completed");
    } catch (e) {
      console.error("Error rewriting", e);
      showToast("Error rewriting draft");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleSelectVersion = (id) => {
    setSelectedVersionId(id);
    const v = versions.find((v) => v.id === id);
    if (v) setDraftText(v.text);
  };

  const handleDeleteVersion = (id) => {
    setVersions((prev) => {
      const filtered = prev.filter((v) => v.id !== id);
      if (selectedVersionId === id) {
        const fallback = filtered[filtered.length - 1] || null;
        setSelectedVersionId(fallback ? fallback.id : null);
        setDraftText(fallback ? fallback.text : "");
      }
      return filtered;
    });
  };

  const handleCopyDraft = async () => {
    if (!draftText) {
      showToast("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(draftText);
      showToast("Draft copied to clipboard");
    } catch (e) {
      console.error("Copy failed", e);
      showToast("Unable to copy");
    }
  };

  const handleDownloadDraft = () => {
    if (!draftText) {
      showToast("Nothing to download");
      return;
    }
    const blob = new Blob([draftText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title || "draft-output") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Draft downloaded");
  };

  const sortedVersions = [...versions].sort((a, b) => {
    const av = a.versionNumber || 0;
    const bv = b.versionNumber || 0;
    if (av !== bv) return av - bv;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const primaryOutputLabel =
    selectedTypes.length === 1
      ? OUTPUT_TYPES.find((t) => t.id === selectedTypes[0])?.label ||
        selectedTypes[0]
      : `${selectedTypes.length} outputs selected`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center text-xs font-semibold">
              CE
            </div>
            <div>
              <div className="text-sm font-semibold">
                Content Engine – single workspace
              </div>
              <div className="text-xs text-slate-500">
                Event-based prompts • Multi-output • Scored versions
              </div>
            </div>
          </div>
          <div className="hidden md:block text-xs text-slate-400">
            Brightline prototype
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        {/* Left column – inputs */}
        <div className="space-y-4">
          {/* Event & title */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold">Event & title</div>
                <div className="text-xs text-slate-500">
                  Define what happened and what you need written.
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Title / headline <span className="font-normal">(optional)</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acquisition of XYZ by ABC Partners"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Helpful for press releases and LinkedIn posts, but not required for all
                  outputs.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Event type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScenario(s.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] border ${
                        scenario === s.id
                          ? "bg-black text-white border-black"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Used to adjust scenario-specific prompting and scoring.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Instructions / constraints
                </label>
                <TextArea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key messages, must-include points, audience notes..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">Source material</div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {/* Attached sources first */}
              {sources.length > 0 && (
                <div className="border border-slate-100 rounded-xl px-3 py-2 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-medium text-slate-600">
                      Attached sources
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {sources.length} source
                      {sources.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {sources.map((s, idx) => {
                      let meta = "";
                      if (s.kind === "file") {
                        meta = s.size
                          ? `${Math.round(s.size / 1024)} KB`
                          : "file";
                      } else if (s.kind === "url") {
                        const len = s.text ? s.text.length : 0;
                        const k = Math.max(1, Math.round(len / 1000));
                        meta = `URL · ~${k}k chars`;
                      } else {
                        meta = "source";
                      }
                      return (
                        <li
                          key={`${s.name}-${idx}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {meta}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Files */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Files
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-1">
                  Upload investment memos, IM extracts, emails, board papers, or
                  notes. Text files work best.
                </p>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 px-4 py-6 text-xs text-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-100"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={handleDropFiles}
                >
                  <div className="text-lg mb-1">📄</div>
                  <div className="font-medium mb-0.5">
                    Drop files here, or click to upload
                  </div>
                  <div className="text-[11px] text-slate-500">
                    We’ll extract text and treat each file as a separate source.
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* URL */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  URL
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Paste a link to a public article or announcement. The backend
                  will fetch readable on-page text where possible.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    className="text-xs"
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button
                    variant="default"
                    className="text-xs whitespace-nowrap"
                    onClick={handleAddUrlSource}
                  >
                    Add URL
                  </Button>
                </div>
              </div>

              {/* Manual text */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Manual text
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Paste or type any additional source material here – email
                  chains, call notes, bullet points, internal commentary, etc.
                </p>
                <TextArea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste IM extracts, memos, emails, notes..."
                />
              </div>

              {/* Public domain search */}
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-700">
                    Public domain search
                  </span>
                  <button
                    type="button"
                    onClick={() => setPublicSearch((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      publicSearch ? "bg-black" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        publicSearch ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                    <span className="sr-only">
                      Toggle public domain search
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Optionally allow limited background context from public web
                  sources. Currently a flag only – full search behaviour to be
                  implemented later.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Advanced settings */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold">Advanced settings</div>
                <div className="text-xs text-slate-500">
                  Connection details and model controls.
                </div>
              </div>
              <Button
                variant="quiet"
                className="text-xs"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Hide" : "Show"}
              </Button>
            </CardHeader>
            {showAdvanced && (
              <CardBody className="space-y-3">
                {/* API + connection */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Backend API base URL
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      className="text-xs"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="https://your-backend.vercel.app/api"
                    />
                    <Button
                      variant="quiet"
                      className="text-xs whitespace-nowrap"
                      onClick={handleCheckConnection}
                    >
                      Check
                    </Button>
                    {connectionStatus === "ok" && (
                      <Pill tone="success" className="text-[10px]">
                        Connected
                      </Pill>
                    )}
                    {connectionStatus === "error" && (
                      <Pill tone="danger" className="text-[10px]">
                        Error
                      </Pill>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Change this when you deploy a new backend or test a
                    different environment.
                  </p>
                </div>

                {/* Model controls */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-[11px] font-medium text-slate-700 mb-1">
                      Model
                    </div>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                    >
                      {MODEL_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mini models are fast and cheap; full models are better
                      for nuance and complex drafting.
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-700 mb-1">
                      Temp
                    </div>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="text-[11px]"
                      value={temperature}
                      onChange={(e) =>
                        setTemperature(parseFloat(e.target.value) || 0)
                      }
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      0.0 = strict and deterministic. Higher values are more
                      creative. Typical range: 0.1–0.4.
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-700 mb-1">
                      Max tokens
                    </div>
                    <Input
                      type="number"
                      min="256"
                      className="text-[11px]"
                      value={maxTokens}
                      onChange={(e) =>
                        setMaxTokens(parseInt(e.target.value, 10) || 512)
                      }
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Technical upper bound on model output length (not the
                      same as words).
                    </p>
                  </div>
                </div>
              </CardBody>
            )}
          </Card>
        </div>

        {/* Right column – outputs & versions */}
        <div className="space-y-4">
          {/* Output types */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold">Output types</div>
                <div className="text-xs text-slate-500">
                  Choose which formats you want for this event and optionally
                  cap the length.
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {OUTPUT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleType(t.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] border ${
                        selectedTypes.includes(t.id)
                          ? "bg-black text-white border-black"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Maximum words (optional)
                  </label>
                  <Input
                    type="number"
                    min="50"
                    className="text-xs"
                    placeholder="e.g. 300"
                    value={maxWords}
                    onChange={(e) => setMaxWords(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Soft guidance plus hard cap. The engine will aim to stay
                    within this length.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate draft"}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Current draft */}
          <Card>
            <CardHeader className="flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">Draft output</div>
                {currentVersion && (
                  <Pill tone={qualityTone(currentVersion.score)}>
                    Score: {currentVersion.score ?? "–"}
                  </Pill>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Pill className="text-[10px]">
                  {getScenarioLabel(scenario)}
                </Pill>
                <Pill className="text-[10px]">
                  {primaryOutputLabel}
                </Pill>
                <Pill className="text-[10px]">
                  {getModelLabel(modelId)}
                </Pill>
                {maxWords && (
                  <Pill className="text-[10px]">
                    ≤ {maxWords} words
                  </Pill>
                )}
                <Pill className="text-[10px]">
                  Public search: {publicSearch ? "On" : "Off"}
                </Pill>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <TextArea
                rows={18}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Generated draft will appear here. You can edit before rewriting."
              />
              {/* Export options */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button variant="default" className="text-xs" onClick={handleCopyDraft}>
                    Copy draft
                  </Button>
                  <Button variant="quiet" className="text-xs" onClick={handleDownloadDraft}>
                    Download .txt
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Rewrite instructions (optional)
                </label>
                <TextArea
                  rows={3}
                  value={rewriteNotes}
                  onChange={(e) => setRewriteNotes(e.target.value)}
                  placeholder="e.g. Shorten, make tone more neutral, add risk disclosure..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="default"
                  onClick={handleRewrite}
                  disabled={isRewriting}
                >
                  {isRewriting ? "Rewriting..." : "Rewrite draft"}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Versions timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">Versions</div>
                <div className="text-xs text-slate-500">
                  {sortedVersions.length === 0
                    ? "No versions yet"
                    : `${sortedVersions.length} version${
                        sortedVersions.length > 1 ? "s" : ""
                      }`}
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 max-h-[260px] overflow-auto">
              {sortedVersions.length === 0 && (
                <div className="text-xs text-slate-500">
                  Generate a draft to start building a version history.
                </div>
              )}
              {sortedVersions.map((v, idx) => {
                const dt = new Date(v.createdAt);
                const outputLabel = v.outputType
                  ? v.outputType.replace("_", " ")
                  : "output";
                const versionNumber = v.versionNumber || idx + 1;
                const isSelected = v.id === selectedVersionId;

                return (
                  <div key={v.id} className="flex items-stretch gap-2">
                    {/* Timeline column */}
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          isSelected ? "bg-black" : "bg-slate-300"
                        }`}
                      />
                      {idx < sortedVersions.length - 1 && (
                        <div className="flex-1 w-px bg-slate-200 mt-1" />
                      )}
                    </div>
                    {/* Card column */}
                    <div
                      className={`flex-1 rounded-xl border px-3 py-2 mb-1 ${
                        isSelected
                          ? "border-black bg-slate-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-xs font-medium truncate">
                          v{versionNumber} ·{" "}
                          <span className="capitalize">{outputLabel}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Score: {v.score != null ? v.score : "–"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(dt)}
                          </span>
                          <span className="text-[11px] text-slate-700 truncate">
                            {v.title}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="quiet"
                            className="text-[11px] px-2 py-1"
                            onClick={() => handleSelectVersion(v.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="quiet"
                            className="text-[11px] px-2 py-1"
                            onClick={() => handleDeleteVersion(v.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-full shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
