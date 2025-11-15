import React, { useState, useRef } from "react";

// -----------------------------
// UI Primitive Components
// -----------------------------
function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`px-3 py-2 rounded-2xl shadow-sm border bg-white hover:bg-gray-50 active:scale-[.99] transition text-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-white ${className}`}
    >
      {children}
    </span>
  );
}


function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border shadow-sm bg-white ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between p-4 border-b rounded-t-3xl bg-gray-50">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
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
  <label className="text-sm text-gray-700 font-medium block mb-1">{children}</label>
);

const Input = (props) => <input className="w-full px-3 py-2 border rounded-xl text-sm" {...props} />;

const Textarea = (props) => (
  <textarea className="w-full px-3 py-2 border rounded-xl text-sm" {...props} />
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
      border: "1px solid #d1d5db", // light grey
      backgroundColor: checked ? "#111827" : "#e5e7eb", // dark vs light
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      cursor: "pointer",
      transition: "background-color 150ms ease"
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
        transition: "transform 150ms ease"
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
  { label: "LinkedIn post", value: "linkedin" }
];

const MODEL_OPTIONS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-4o", label: "GPT-4o" }
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
      setUrlSources((prev) => [...prev, { url, text: "[Error fetching URL]" }]);
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
    console.log("Calling backend:", `${apiBaseUrl}/generate`, "with body:", body);

    const res = await fetch(`${apiBaseUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const raw = await res.text();
    console.log("Raw backend response:", raw);

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
    if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (typeof data.result === "string") {
      return data.result;
    }
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error("Backend error during fetch:", e);
    return `[Backend error while generating output: ${e.message || String(e)}]`;
  }
};


  const buildMetrics = () => ({ clarity: 0.8, accuracy: 0.75, structure: 0.82 });

  const summarizeRewrite = (notes) => {
    if (!notes) return "Rewrite with updated instructions (no details provided).";
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

const handleGenerate = async () => {
  if (isGenerating || isRewriting) return; // prevent double clicks
  setIsGenerating(true);

  try {
    const allText = [
      ...parsed.map((p) => p.text),
      ...urlSources.map((u) => u.text),
    ].join("\n");

    const body = {
      // 👇 tells the backend this is a fresh generation
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
      // 👇 tells the backend this is a rewrite, not a fresh draft
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
      // 👇 previous draft to *tweak* rather than replace
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
        <header className="flex items-center justify-between mb-6">
  {/* Left: brand + tagline */}
  <div className="flex items-center gap-3">
    {/* Brand icon */}
    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-lg font-bold">
      CE
    </div>

    {/* Title + tagline */}
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
  <nav className="hidden md:flex items-center gap-6 text-sm">
    <button className="text-gray-900 font-medium">Dashboard</button>
    <button className="text-gray-500 hover:text-gray-900">Projects</button>
    <button className="text-gray-500 hover:text-gray-900">Sources</button>
    <button className="text-gray-500 hover:text-gray-900">Outputs</button>
    <button className="text-gray-500 hover:text-gray-900">Templates</button>
  </nav>

  {/* Right: version + user badge */}
  <div className="flex items-center gap-4">
    <div className="inline-flex items-center justify-center rounded-full border border-black bg-black px-3 py-1 text-xs font-medium text-white">
  v2.0.0
</div>

    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700">
      BR
    </div>
  </div>
</header>

{/* Page toolbar / intro */}
<div className="flex items-center justify-between mt-2 mb-4">
  <div>
    <h2 className="text-lg font-semibold">Dashboard</h2>
    <p className="text-sm text-gray-500">
      Manage sources, generate drafts, and track versions.
    </p>
  </div>
  <div className="flex gap-2">
    <Button type="button">New project</Button>
    <Button type="button">View history</Button>
  </div>
</div>

<div className="mt-2 flex gap-6">

          {/* Sidebar */}
          <aside className="hidden md:flex w-56 shrink-0 flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h2 className="text-sm font-semibold mb-2">Workspace</h2>
              <p className="text-xs text-gray-500">
                Title, notes & output types for this session.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-semibold mb-2">Status</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Sources: {parsed.length + urlSources.length}</li>
                <li>• Output versions: {versions.length}</li>
                <li>• Model: {getModelLabel(modelId)}</li>
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <div className="grid lg:grid-cols-3 gap-6 items-start">

         {/* Left column: sources + configuration */}
<div className="space-y-6 lg:col-span-1">
  <div className="mb-2">
    <h2 className="text-lg font-semibold">Inputs</h2>
    <p className="text-sm text-gray-500">
      Add and configure the sources used for drafting.
    </p>
  </div>

  {/* Source documents */}
  <Card>

  <CardHeader
  title="Source documents"
  subtitle="Upload files or add URLs as input sources."
  right={
    <div className="inline-flex items-center justify-center rounded-full border border-gray-900 bg-black px-3 py-1 text-[11px] font-medium text-white">
      {parsed.length + urlSources.length} source
      {parsed.length + urlSources.length === 1 ? "" : "s"}
    </div>
  }
/>



              <CardBody>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Upload Files
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
          No sources added yet. Upload one or more files, or paste a URL to pull
          in public content for this drafting session.
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
      <Button onClick={addUrlSource}>Add URL</Button>
    </div>

              </CardBody>
            </Card>

            {/* Configuration */}
           {/* Configuration */}
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
      <Label>Output Types</Label>
      <p className="text-xs text-gray-500 mb-2">
        Choose one or more content formats to generate in this run.
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
      <Toggle checked={publicSearch} onChange={setPublicSearch} />
    </div>

    <div>
  <Label>Prompt Notes / Rewrite Instructions</Label>
  <Textarea
    rows={4}
    value={promptNotes}
    onChange={(e) => setPromptNotes(e.target.value)}
    placeholder="Key points, tone, constraints, or rewrite instructions..."
  />
  <p className="mt-1 text-xs text-gray-500">
    Use this to guide the initial draft or to tell the engine how to change the
    current version (e.g. &quot;shorter, more formal, add risk section&quot;).
  </p>
</div>


    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleGenerate}
        disabled={hasInitialGeneration || isGenerating || isRewriting}
      >
        {isGenerating && <Spinner />}
        {isGenerating ? "Generating..." : "Generate"}
      </Button>

      <Button
        onClick={handleRewrite}
        disabled={!hasInitialGeneration || isRewriting || isGenerating}
      >
        {isRewriting && <Spinner />}
        {isRewriting ? "Rewriting..." : "Rewrite"}
      </Button>

      <Button
        onClick={() => {
          console.log("View Rubrics clicked");
          setShowRubric(true);
        }}
      >
        View Rubrics
      </Button>

      {hasInitialGeneration && (
        <Button
          onClick={() => setShowNewConfirm(true)}
          disabled={isGenerating || isRewriting}
        >
          New Output
        </Button>
      )}
    </div>
  </CardBody>
</Card>


            {/* Minimal model */}
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
    onChange={(e) => setTemperature(parseFloat(e.target.value))}
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
  <button
    type="button"
    className="text-xs text-gray-700 underline"
    onClick={() => setShowAdvanced((v) => !v)}
  >
    {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
  </button>
  {showAdvanced && (
    <div className="mt-2 space-y-2">
      <Label>API base URL</Label>
      <Input
        placeholder="https://content-engine-backend-v2.vercel.app/api"
        value={apiBaseUrl}
        onChange={(e) => setApiBaseUrl(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button onClick={checkHealth}>Check connection</Button>
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
        <Button onClick={runDiagnostics}>Re-run diagnostics</Button>
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
      <Button onClick={runDiagnostics}>Run diagnostics</Button>
    </div>
  )}
</CardBody>

            </Card>
          </div>

{/* Right column: output + versions */}
<div className="lg:col-span-2 space-y-6">
  <div className="mb-2">
    <h2 className="text-lg font-semibold">Output</h2>
    <p className="text-sm text-gray-500">
      Review generated drafts and manage versions.
    </p>
  </div>

            <Card>
              <CardHeader
  title="Output draft"
  subtitle="Generated content appears here."
  right={
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowRubric(true)}
        className="text-xs text-gray-700 underline"
      >
        Score: {selectedVersion?.score ?? "–"}/100
      </button>
    </div>
  }
/>

              <CardBody>
                <Textarea
                  rows={18}
                  value={output || selectedVersion?.content || ""}
                  onChange={(e) => setOutput(e.target.value)}
                  placeholder="Generated content..."
                />
              </CardBody>
            </Card>

            <Card>
  <CardHeader
    title="Versions"
    subtitle="Saved versions with comments and scores"
  />
  <CardBody>
    {versions.length === 0 ? (
      <p className="text-sm text-gray-500">No versions yet.</p>
    ) : (
      versions.map((v) => (
        <div
          key={v.id}
          className={`p-4 rounded-2xl border mb-3 space-y-2 ${
            selectedVersionId === v.id
              ? "bg-gray-50 border-gray-400"
              : "bg-white"
          }`}
        >
          {/* Header row */}
          <div className="flex justify-between items-center">
            <Button onClick={() => setSelectedVersionId(v.id)}>
              View
            </Button>
            <div className="text-xs text-gray-600">
              V{v.versionNumber} · {new Date(v.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Comment */}
          <div className="text-sm text-gray-800">{v.comment}</div>

          {/* Metadata */}
          <div className="text-xs text-gray-500">
            Public search: {v.publicSearch ? "Enabled" : "Disabled"}
          </div>

          {Array.isArray(v.urls) && v.urls.length > 0 && (
            <div className="text-xs text-gray-500">
              URLs: {v.urls.map((u) => u.url).join(", ")}
            </div>
          )}

          {/* Score + model */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <Pill className="bg-gray-100 text-gray-800 border-gray-300">
              {getModelLabel(v.model?.id)}
            </Pill>
            <span>Score: {v.score}</span>
          </div>

          {/* Delete */}
          <div className="text-right">
            <Button
              className="text-red-600 border-red-200"
              onClick={() =>
                setVersions((prev) => prev.filter((x) => x.id !== v.id))
              }
            >
              Delete
            </Button>
          </div>
        </div>
      ))
    )}
  </CardBody>
</Card>


            <Card>
              <CardHeader
                title="Roadmap Hooks"
                subtitle="Future backend & product evolution"
              />
              <CardBody>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Backend PDF/DOCX parsing for richer sources.</li>
                  <li>Model-based content generation wired to /generate & /rewrite.</li>
                  <li>Output-specific prompts triggered by output selection.</li>
                  <li>Templated outputs and reusable blueprints per content type.</li>
                  <li>Scoring engine tied to rubrics and feedback loop.</li>
                  <li>Sources table.</li>
                  <li>Statement Reliability and Inferences table.</li>
                  <li>RBAC, audit logs, and enterprise integrations.</li>
                  <li>UI re-design for visual appeal (including pills, icons) and efficient layout.</li>
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
              <h3 className="text-lg font-semibold mb-2">Quality Rubrics</h3>
              <ul className="space-y-2 text-sm">
                {selectedVersion?.metrics ? (
                  Object.entries(selectedVersion.metrics).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span>{Math.round(v * 100)}/100</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">
                    No version selected or no metrics available yet.
                  </li>
                )}
              </ul>
              <div className="text-right mt-4">
                <Button onClick={() => setShowRubric(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* New output modal */}
        {showNewConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Start New Output?</h3>
              <p className="text-sm text-gray-600">
                This will clear the current workspace (title, notes, selections,
                versions, and uploaded text).
              </p>
              <div className="mt-4 flex gap-2 justify-end">
                <Button onClick={() => setShowNewConfirm(false)}>Cancel</Button>
                <Button
                  onClick={handleNewOutput}
                  className="border-red-200 text-red-600"
                >
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
