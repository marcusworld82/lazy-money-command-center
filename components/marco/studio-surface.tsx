"use client";

import * as React from "react";
import { AudioLines, Camera, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";

const IMAGE_MODELS = [
  { id: "gpt-image-2", name: "GPT Image 2" },
  { id: "seedream-4", name: "Seedream 4 4K" },
  { id: "flux-pro", name: "FLUX Pro" },
  { id: "nano-banana", name: "NanoBanana Pro" },
];

const VIDEO_MODELS = [
  { id: "seedance-2", name: "Seedance 2.0" },
  { id: "seedance-2-fast", name: "Seedance 2.0 Fast" },
  { id: "kling-3", name: "Kling 3.0" },
  { id: "kling-3-omni", name: "Kling 3.0 Omni" },
];

export function StudioSurface({ kind }: { kind: "image" | "video" }) {
  const models = kind === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const [tab, setTab] = React.useState(kind === "image" ? "create" : "frames");
  const [model, setModel] = React.useState(models[0].id);
  const [prompt, setPrompt] = React.useState("");
  const [count, setCount] = React.useState(1);
  const [audio, setAudio] = React.useState(true);
  const [polish, setPolish] = React.useState(false);
  const [output, setOutput] = React.useState(kind === "image" ? "1:1 · 1k" : "Auto | 720p | 5s");
  const [quality, setQuality] = React.useState("Low");
  const [modeName, setModeName] = React.useState("Normal");

  return (
    <div className="oa-wrap">
      <header className="oa-head">
        <h1>{kind === "image" ? "Create Image" : "Frame to Video"}</h1>
      </header>
      <div className="oa-tabs">
        {kind === "image" ? (
          <>
            <button type="button" className={tab === "create" ? "is-on" : ""} onClick={() => setTab("create")}>Create Image</button>
            <button type="button" className={tab === "variations" ? "is-on" : ""} onClick={() => setTab("variations")}>Image Variations</button>
          </>
        ) : (
          <>
            <button type="button" className={tab === "frames" ? "is-on" : ""} onClick={() => setTab("frames")}>Start/End Frame</button>
            <button type="button" className={tab === "text" ? "is-on" : ""} onClick={() => setTab("text")}>Text with Reference</button>
          </>
        )}
      </div>
      <label className="oa-row">
        <span>Model</span>
        <select value={model} onChange={(event) => setModel(event.target.value)}>
          {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {kind === "video" && tab === "frames" && (
        <section className="oa-card">
          <h2>Set start & end frame</h2>
          <div className="oa-frames">
            <button type="button" disabled><ImageIcon size={22} />Add a start frame<small>History</small></button>
            <i>⇄</i>
            <button type="button" disabled><ImageIcon size={22} />Add an end frame<small>History</small></button>
          </div>
        </section>
      )}
      <section className="oa-card">
        <h2>{kind === "image" ? "Describe your image" : "Describe your video"}</h2>
        {kind === "image" && (
          <button type="button" className="oa-refs" disabled>
            <b>Add visual references</b>
            <span>Optional · JPEG/PNG/WEBP · 0/16</span>
          </button>
        )}
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={kind === "video" ? "Describe scene transitions, camera movement, or character actions." : "Describe what you want to see"} rows={kind === "video" ? 6 : 7} />
        <div className="oa-tools">
          {kind === "video" ? <span><Camera size={14} /> Camera</span> : <span>Auto Polish</span>}
          {kind === "image" && (<label className="oa-switch"><input type="checkbox" checked={polish} onChange={(event) => setPolish(event.target.checked)} /><i /></label>)}
          <button type="button" disabled aria-label="Clear"><Trash2 size={14} /></button>
        </div>
      </section>
      {kind === "video" ? (
        <div className="oa-grid">
          <label className="oa-tile"><AudioLines size={16} /><span>Audio</span><b>{audio ? "On" : "Off"}</b><input type="checkbox" checked={audio} onChange={(event) => setAudio(event.target.checked)} /></label>
          <label className="oa-tile"><span>Mode</span><select value={modeName} onChange={(event) => setModeName(event.target.value)}><option>Normal</option><option>Fast</option></select></label>
          <label className="oa-tile oa-span"><span>Output</span><select value={output} onChange={(event) => setOutput(event.target.value)}><option>Auto | 720p | 5s</option><option>9:16 | 720p | 5s</option><option>16:9 | 1080p | 5s</option></select></label>
        </div>
      ) : (
        <div className="oa-grid">
          <label className="oa-tile"><span>Output</span><select value={output} onChange={(event) => setOutput(event.target.value)}><option>1:1 · 1k</option><option>3:4 · 1k</option><option>9:16 · 1k</option><option>16:9 · 1k</option></select></label>
          <label className="oa-tile"><span>Quality</span><select value={quality} onChange={(event) => setQuality(event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
        </div>
      )}
      <footer className="oa-foot">
        <div className="oa-count"><button type="button" onClick={() => setCount((n) => Math.max(1, n - 1))}>−</button><b>{count}/8</b><button type="button" onClick={() => setCount((n) => Math.min(8, n + 1))}>+</button></div>
        <button type="button" className="oa-go" disabled><Sparkles size={15} />Generate<small>Connect fal before a real render</small></button>
      </footer>
    </div>
  );
}
