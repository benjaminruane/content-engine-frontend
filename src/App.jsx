import React, { useState, useRef } from "react";

// -----------------------------
// UI Primitive Components
// -----------------------------
function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "px-3 py-2 rounded-xl text-sm font-medium transition active:scale-[.98]";

  const variants = {
    default:
      "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm",
    primary: "bg-black text-white border border-black hover:bg-gray-900",
    secondary:
      "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200",
    quiet:
      "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
    danger:
      "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Pill({ variant = "subtle", children, className = "" }) {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium";

  const variants = {
    subtle: "bg-gray-50 text-gray-700 border border-gray-200",
    outline: "bg-white text-gray-700 border border-gray-300",
    solid: "bg-gray-900 text-white border border-gray-900",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-gray-100 shadow-sm bg-white ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between p-4 border-b rounded-t-3xl bg-gray-50">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div>{right}</div>
    </div>
  );
}

function CardBody({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1"
      aria-hidden="true"
    />
  );
}

const Label = ({ children }) => (
  <label className="text-sm text-gray-700 font-medium block mb-1">
    {children}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full px-3 py-2 border rounded-xl text-sm ${className}`}
    {...props}
  />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300 ${className}`}
    {...props}
  />
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      width: "44px",
      height: "24px",
      borderRadius: "999px",
      padding: "2px",
      border: "1px solid #d1d5db",
      backgroundColor: checked ? "#111827" : "#e5e7eb",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      cursor: "pointer",
      transition: "background-color 150ms ease",
    }}
  >
    <span
      style={{
        width: "18px",
        height: "18px",
        borderRadius: "999px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 150ms ease",
      }}
    />
  </button>
);

// -----------------------------
// Constants
// -----------------------------
const OUTPUT_TYPES = [
  { label: "Investor reporting commentary", value: "investor" },
  { label: "Detailed note for existing investors", value: "detailed" },
  { label: "Press release", value: "press" },
  { label: "LinkedIn post", value: "linkedin" },
];

const MODEL_OPTIONS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-4o", label: "GPT-4o" },
];

// -----------------------------
// App Component
// -----------------------------
export default function App() {
  // Source handling
  const [parsed, setParsed] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlSources, setUrlSources] = useState([]);
  const fileInputRef = useRef(null);

  const addFiles = async (files) => {
    if (!files) return;
    const arr = [];
    for (let f of files) {
      const text = await f.text();
      arr.push({ file: f, text });
    }
    setParsed((prev) => [...prev, ...arr]);
  };

  const addUrlSource = async () => {
    if (!urlInput) return;
    const url = urlInput.trim();
    if (!url) return;
    try {
      const res = await fetch(url);
      const text = await res.text();
      setUrlSources((prev) => [...prev, { url, text }]);
      setUrlInput("");
    } catch (e) {
      console.error("URL fetch failed", e);
      setUrlSources((prev) => [
        ...prev,
        { url, text: "[Error fetching URL]" },
      ]);
    }
  };

  // Config
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [publicSearch, setPublicSearch] = useState(false);
  const [promptNotes, setPromptNotes] = useState("");
  const [title, setTitle] = useState("");

  const toggleType = (t) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  };

  // Versions
  const [output, setOutput] = useState("");
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [showRubric, setShowRubric] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // Model config
  const [modelId, setModelId] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(2048);

  // Backend
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(
    "https://content-engine-backend-v2.vercel.app/api"
  );
  const [apiStatus, setApiStatus] = useState("Unknown");

  // Diagnostics & loading
  const [diagnostics, setDiagnostics] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);

  const checkHealth = async () => {
    if (!apiBaseUrl) return;
    try {
      const r = await fetch(`${apiBaseUrl}/health`);
      setApiStatus(r.ok ? "OK" : "Error");
    } catch {
      setApiStatus("Error");
    }
  };

  const runGenerateRequest = async (body) => {
    if (!apiBaseUrl) {
      return (
        "DEMO OUTPUT\n\n" +
        `Title: ${body.title || "(untitled)"}\n` +
        `Public search: ${body.publicSearch ? "ON" : "OFF"}\n` +
        `Types: ${body.selectedTypes?.join(", ") || "(none)"}\n\n` +
        "[This is demo text because no API Base URL is configured.]"
      );
    }
    try {
      const res = await fetch(`${apiBaseUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text();

      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
        // not JSON
      }

      if (!data) return raw || "[No output from backend]";

      if (typeof data.output === "string" && data.output.trim().length > 0) {
        return data.output;
      }
      if (
        Array.isArray(data.choices) &&
        data.choices[0]?.message?.content
      ) {
        return data.choices[0].message.content;
      }
      if (typeof data.result === "string") {
        return data.result;
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("Backend error during fetch:", e);
      return `[Backend error while generating output: ${
        e.message || String(e)
      }]`;
    }
  };

  const buildMetrics = () => ({ clarity: 0.8, accuracy: 0.75, structure: 0.82 });

  const summarizeRewrite = (notes) => {
    if (!notes)
      return "Rewrite with updated instructions (no details provided).";
    const trimmed = notes.trim();
    if (trimmed.length <= 80) return `Rewrite: ${trimmed}`;
    return `Rewrite: ${trimmed.slice(0, 77)}...`;
  };

  const getModelLabel = (id) =>
    MODEL_OPTIONS.find((m) => m.id === id)?.label || id;

  // -----------------------------
  // Handlers
  // -----------------------------
  const hasInitialGeneration = versions.length > 0;
  const hasSources = parsed.length + urlSources.length > 0;
  const hasOutputTypes = selectedTypes.length > 0;

  const handleGenerate = async () => {
    if (isGenerating || isRewriting) return;
    setIsGenerating(true);

    try {
      const allText = [
        ...parsed.map((p) => p.text),
        ...urlSources.map((u) => u.text),
      ].join("\n");

      const body = {
        mode: "generate",
        title,
        notes: promptNotes,
        selectedTypes,
        publicSearch,
        model: { id: modelId, temperature, maxTokens },
        modelId,
        temperature,
        maxTokens,
        text: allText,
      };

      const out = await runGenerateRequest(body);

      const versionNumber = versions.length + 1;
      const newVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        timestamp: new Date().toISOString(),
        content: out,
        comment: "Initial generation",
        score: Math.round(Math.random() * 40) + 60,
        metrics: buildMetrics(),
        publicSearch,
        urls: urlSources,
        model: { id: modelId, temperature, maxTokens },
      };

      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersionId(newVersion.id);
      setOutput(out);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async () => {
    if (!selectedVersionId || isRewriting || isGenerating) return;

    const base =
      versions.find((v) => v.id === selectedVersionId) ||
      (versions.length > 0 ? versions[versions.length - 1] : null);

    if (!base) return;

    setIsRewriting(true);

    try {
      const allText = [
        ...parsed.map((p) => p.text),
        ...urlSources.map((u) => u.text),
      ].join("\n");

      const body = {
        mode: "rewrite",
        title,
        notes: promptNotes,
        selectedTypes,
        publicSearch,
        model: { id: modelId, temperature, maxTokens },
        modelId,
        temperature,
        maxTokens,
        text: allText,
        previousContent: base.content,
      };

      const out = await runGenerateRequest(body);

      const versionNumber = versions.length + 1;
      const newVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        timestamp: new Date().toISOString(),
        content: out,
        comment: `${summarizeRewrite(promptNotes)} (${
          promptNotes || "no explicit notes"
        })`,
        score: Math.round(Math.random() * 40) + 60,
        metrics: buildMetrics(),
        publicSearch,
        urls: urlSources,
        model: { id: modelId, temperature, maxTokens },
      };

      setVersions((prev) => [...prev, newVersion]);
      setSelectedVersionId(newVersion.id);
      setOutput(out);
      setPromptNotes("");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleNewOutput = () => {
    setParsed([]);
    setUrlSources([]);
    setSelectedVersionId(null);
    setVersions([]);
    setOutput("");
    setPromptNotes("");
    setSelectedTypes([]);
    setTitle("");
    setShowNewConfirm(false);
  };

  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) ||
    (versions.length > 0 ? versions[versions.length - 1] : null);

  const runDiagnostics = () => {
    const msgs = [];
    if (OUTPUT_TYPES.length === 4) msgs.push("OK: Output types defined.");
    if (MODEL_OPTIONS.length >= 2) msgs.push("OK: Model options present.");
    if (versions.length === 0) msgs.push("OK: No versions yet (fresh session).");
    if (typeof publicSearch === "boolean")
      msgs.push("OK: Public search is boolean.");
    setDiagnostics(msgs);
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          {/* Left: brand + tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-lg font-bold">
              CE
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Brightline Content Engine
              </h1>
              <p className="text-sm text-gray-500">
                Structured AI drafting for investment, reporting & communications.
              </p>
            </div>
          </div>

          {/* Middle: navigation */}
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <button className="px-3 py-1.5 rounded-full bg-black text-white font-medium">
              Dashboard
            </button>
            <button className="text-gray-500 hover:text-gray-900">
              Projects
            </button>
            <button className="text-gray-500 hover:text-gray-900">
              Sources
            </button>
            <button className="text-gray-500 hover:text-gray-900">
              Outputs
            </button>
            <button className="text-gray-500 hover:text-gray-900">
              Templates
            </button>
          </nav>

          {/* Right: version + user badge */}
          <div className="flex items-center gap-4">
            <Pill variant="subtle" className="px-3">
              v2.0.0
            </Pill>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700">
              BR
            </div>
          </div>
        </header>

        {/* Page toolbar / intro */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-sm text-gray-500">
              Manage sources, generate drafts, and track versions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowNewConfirm(true)}
            >
              New project
            </Button>
            <Button type="button" variant="secondary">
              View history
            </Button>
          </div>
        </div>

        {/* Inputs / Output headings row */}
        <div className="grid lg:grid-cols-3 gap-6 items-end mb-4">
          <div>
            <h2 className="text-lg font-semibold">Inputs & configuration</h2>
            <p className="text-sm text-gray-500">
              Add sources and control how the engine drafts content.
            </p>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold">Output</h2>
            <p className="text-sm text-gray-500">
              Review generated drafts and manage versions.
            </p>
          </div>
        </div>

        {/* Main content area */}
        <div className="mt-2 flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:flex w-60 shrink-0 flex-col gap-5">
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-1">Workspace</h2>
              <p className="text-xs text-gray-500">
                Overview of your drafting session.
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-1">Status</h3>
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Sources</span>
                  <span className="font-medium">
                    {parsed.length + urlSources.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Versions</span>
                  <span className="font-medium">{versions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model</span>
                  <span className="font-medium">
                    {getModelLabel(modelId)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Model & controls */}
            <Card>
              <CardHeader
                title="Model & controls"
                subtitle="Select the model and basic generation settings."
              />
              <CardBody className="space-y-3">
                <div>
                  <Label>Model</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Temperature</Label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={temperature}
                    onChange={(e) =>
                      setTemperature(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                    <span>More stable</span>
                    <span>{temperature.toFixed(2)}</span>
                    <span>More creative</span>
                  </div>
                </div>

                <div>
                  <Label>Max tokens</Label>
                  <Input
                    type="number"
                    min={100}
                    max={4000}
                    step={50}
                    value={maxTokens}
                    onChange={(e) =>
                      setMaxTokens(
                        parseInt(e.target.value || "0", 10) || 0
                      )
                    }
                  />
                </div>

                <div className="mt-2">
                  <Button
                    variant="quiet"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="text-xs"
                  >
                    {showAdvanced
                      ? "Hide advanced settings"
                      : "Show advanced settings"}
                  </Button>
                  {showAdvanced && (
                    <div className="mt-2 space-y-2">
                      <Label>API base URL</Label>
                      <Input
                        placeholder="https://content-engine-backend-v2.vercel.app/api"
                        value={apiBaseUrl}
                        onChange={(e) =>
                          setApiBaseUrl(e.target.value)
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={checkHealth}>
                          Check connection
                        </Button>
                        <span className="text-xs text-gray-500">
                          Status: {apiStatus}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Diagnostics */}
            <Card>
              <CardHeader
                title="Diagnostics"
                subtitle="Quick sanity checks for this session."
              />
              <CardBody>
                {diagnostics ? (
                  <>
                    <div className="flex gap-2 mb-3">
                      <Button onClick={runDiagnostics}>
                        Re-run diagnostics
                      </Button>
                      <Button onClick={() => setDiagnostics(null)}>
                        Clear
                      </Button>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {diagnostics.map((d, i) => (
                        <li
                          key={i}
                          className="px-2 py-1 rounded-md bg-gray-50 text-gray-700"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex flex-col items-start gap-2 text-sm text-gray-500">
                    <p>No diagnostics run yet for this session.</p>
                    <Button onClick={runDiagnostics}>
                      Run diagnostics
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <div className="grid lg:grid-cols-3 gap-6 items-start">
              {/* Left column: configuration + sources */}
              <div className="space-y-6 lg:col-span-1">
                {/* Configuration card */}
                <Card>
                  <CardHeader
                    title="Configuration"
                    subtitle="Control how the engine drafts and rewrites content."
                  />
                  <CardBody className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Q3 Portfolio Update"
                      />
                    </div>

                    <div>
                      <Label>Output types</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Choose one or more content formats to generate in this
                        run.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {OUTPUT_TYPES.map((o) => {
                          const active = selectedTypes.includes(o.value);
                          return (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => toggleType(o.value)}
                              className={
                                "px-3 py-1.5 rounded-full text-xs border transition " +
                                (active
                                  ? "bg-black text-white border-black shadow-sm"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
                              }
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Include public domain search</Label>
                      <Toggle
                        checked={publicSearch}
                        onChange={setPublicSearch}
                      />
                    </div>

                    <div>
                      <Label>Prompt notes / rewrite instructions</Label>
                      <Textarea
                        rows={4}
                        value={promptNotes}
                        onChange={(e) => setPromptNotes(e.target.value)}
                        placeholder="Key points, tone, constraints, or rewrite instructions..."
                        className="placeholder:text-gray-400"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use this to guide the initial draft or to tell the engine
                        how to change the current version (e.g. &quot;shorter, more
                        formal, add risk section&quot;).
                      </p>
                    </div>

                    {/* Buttons row */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="primary"
                        onClick={handleGenerate}
                        disabled={
                          hasInitialGeneration ||
                          isGenerating ||
                          isRewriting ||
                          !hasSources ||
                          !hasOutputTypes
                        }
                      >
                        {isGenerating && <Spinner />}
                        {isGenerating ? "Generating..." : "Generate"}
                      </Button>

                      <Button
                        onClick={handleRewrite}
                        disabled={
                          !hasInitialGeneration ||
                          isRewriting ||
                          isGenerating
                        }
                      >
                        {isRewriting && <Spinner />}
                        {isRewriting ? "Rewriting..." : "Rewrite"}
                      </Button>

                      <Button
                        variant="quiet"
                        onClick={() => setShowRubric(true)}
                      >
                        View rubrics
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                {/* Source documents card */}
                <Card>
                  <CardHeader
                    title="Source documents"
                    subtitle="Bring in files or web pages as drafting sources."
                    right={
                      <Pill variant="outline" className="px-3">
                        {parsed.length + urlSources.length} source
                        {parsed.length + urlSources.length === 1 ? "" : "s"}
                      </Pill>
                    }
                  />
                  <CardBody>
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      style={{ display: "none" }}
                      onChange={(e) => addFiles(e.target.files)}
                    />

                    {/* Existing sources */}
                    <div className="mt-4 space-y-2">
                      {parsed.length === 0 && urlSources.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No sources added yet. Upload one or more files, or paste
                          a URL to pull in public content for this drafting
                          session.
                        </p>
                      ) : (
                        <>
                          {parsed.map((p, i) => (
                            <div
                              key={i}
                              className="text-sm border p-2 rounded-xl bg-gray-50"
                            >
                              <b>{p.file.name}</b>
                              <div className="text-xs text-gray-500">
                                {String(p.text || "").slice(0, 160)}
                              </div>
                            </div>
                          ))}

                          {urlSources.map((u, i) => (
                            <div
                              key={`url-${i}`}
                              className="text-sm border p-2 rounded-xl bg-gray-50"
                            >
                              <b>{u.url}</b>
                              <div className="text-xs text-gray-500">
                                {String(u.text || "").slice(0, 160)}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* URL input row */}
                    <div className="mt-4 flex gap-2">
                      <Input
                        placeholder="https://example.com/article"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <Button variant="secondary" onClick={addUrlSource}>
                        Add URL
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Right column: output + versions + roadmap */}
              <div className="lg:col-span-2 space-y-6">
                {/* Draft output */}
                <Card>
                  <CardHeader
                    title="Draft output"
                    subtitle="Your generated draft appears here. Edit directly or use Rewrite to create a new version."
                    right={
                      <Button
                        variant="quiet"
                        onClick={() => setShowRubric(true)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                      >
                        Score: {selectedVersion?.score ?? "–"}/100
                      </Button>
                    }
                  />
                  <CardBody className="space-y-3">
                    <Textarea
                      rows={18}
                      value={output || selectedVersion?.content || ""}
                      onChange={(e) => setOutput(e.target.value)}
                      placeholder="Generated content..."
                      className="placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can edit this draft directly. Use{" "}
                      <strong>Rewrite</strong> to generate an updated
                      version while keeping this one saved.
                    </p>
                  </CardBody>
                </Card>

                {/* Versions – timeline style */}
                <Card>
                  <CardHeader
                    title="Versions"
                    subtitle="Saved versions with comments and scores."
                  />
                  <CardBody>
                    {versions.length === 0 ? (
                      <p className="text-sm text-gray-500">No versions yet.</p>
                    ) : (
                      <div className="relative">
                        {/* Vertical timeline line */}
                        <div
                          className="absolute left-2 top-2 bottom-4 w-px bg-gray-200"
                          aria-hidden="true"
                        />

                        <div className="space-y-4">
                          {versions.map((v) => {
                            const isSelected = selectedVersionId === v.id;

                            return (
                              <div key={v.id} className="relative pl-6">
                                {/* Dot on the timeline */}
                                <span
                                  className={
                                    "absolute left-1 top-3 w-2 h-2 rounded-full border " +
                                    (isSelected
                                      ? "bg-black border-black"
                                      : "bg-white border-gray-400")
                                  }
                                  aria-hidden="true"
                                />

                                {/* Version card */}
                                <div
                                  className={
                                    "rounded-2xl border p-3 space-y-2 transition " +
                                    (isSelected
                                      ? "bg-gray-50 border-gray-500"
                                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-400")
                                  }
                                >
                                  {/* Top row: version label + timestamp */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <Pill variant="subtle" className="px-2">
                                        V{v.versionNumber}
                                      </Pill>
                                      {isSelected && (
                                        <span className="text-[11px] text-gray-500">
                                          Currently viewing
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(
                                        v.timestamp
                                      ).toLocaleString()}
                                    </div>
                                  </div>

                                  {/* Comment / summary */}
                                  <div className="text-sm text-gray-800">
                                    {v.comment}
                                  </div>

                                  {/* Metadata row */}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                    <span>
                                      Public search:{" "}
                                      {v.publicSearch
                                        ? "Enabled"
                                        : "Disabled"}
                                    </span>
                                    {Array.isArray(v.urls) &&
                                      v.urls.length > 0 && (
                                        <span className="truncate">
                                          URLs:{" "}
                                          {v.urls
                                            .map((u) => u.url)
                                            .join(", ")}
                                        </span>
                                      )}
                                  </div>

                                  {/* Score + model + actions */}
                                  <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <Pill variant="outline">
                                        {getModelLabel(v.model?.id)}
                                      </Pill>
                                      <span>Score: {v.score}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="quiet"
                                        onClick={() =>
                                          setSelectedVersionId(v.id)
                                        }
                                        className="text-xs"
                                      >
                                        View
                                      </Button>
                                      <Button
                                        variant="danger"
                                        onClick={() =>
                                          setVersions((prev) =>
                                            prev.filter((x) => x.id !== v.id)
                                          )
                                        }
                                        className="text-xs"
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Roadmap */}
                <Card>
                  <CardHeader
                    title="Future roadmap"
                    subtitle="Planned capabilities for this content engine."
                  />
                  <CardBody className="space-y-2">
                    <p className="text-xs text-gray-500">
                      These items are not yet live. They outline where the
                      product is heading as the prototype matures.
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                      <li>
                        Richer source ingestion (PDF, DOCX and structured data
                        feeds).
                      </li>
                      <li>
                        Deeper model integration for drafting and rewriting via
                        /generate.
                      </li>
                      <li>
                        Output-specific prompts based on selected content types.
                      </li>
                      <li>
                        Templated outputs and reusable blueprints per document
                        family.
                      </li>
                      <li>
                        Scoring engine tied to detailed rubrics and a feedback
                        loop.
                      </li>
                      <li>
                        Dedicated sources table with traceability and filtering.
                      </li>
                      <li>
                        Statement reliability and inference tracking views.
                      </li>
                      <li>
                        Role-based access controls, audit logs and enterprise
                        integrations.
                      </li>
                      <li>
                        Additional UI polish, theming options and efficiency
                        tweaks.
                      </li>
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </main>
        </div>

        {/* Rubric modal */}
        {showRubric && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                Quality rubrics
              </h3>
              <ul className="space-y-2 text-sm">
                {selectedVersion?.metrics ? (
                  Object.entries(selectedVersion.metrics).map(
                    ([k, v]) => (
                      <li key={k} className="flex justify-between">
                        <span>{k}</span>
                        <span>{Math.round(v * 100)}/100</span>
                      </li>
                    )
                  )
                ) : (
                  <li className="text-sm text-gray-500">
                    No version selected or no metrics available yet.
                  </li>
                )}
              </ul>
              <div className="text-right mt-4">
                <Button onClick={() => setShowRubric(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* New output / project modal */}
        {showNewConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                Start new output?
              </h3>
              <p className="text-sm text-gray-600">
                This will clear the current workspace (title, notes,
                selections, versions, and uploaded text).
              </p>
              <div className="mt-4 flex gap-2 justify-end">
                <Button onClick={() => setShowNewConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleNewOutput}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
