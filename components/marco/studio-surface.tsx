"use client";

import * as React from "react";
import { Film, Image as ImageIcon, MicOff, Plus, Sparkles } from "lucide-react";

const IMAGE_MODELS = [
  { id: "seedream-4", name: "Seedream 4 4K", cost: "—" },
  { id: "flux-pro", name: "FLUX Pro", cost: "—" },
  { id: "nano-banana", name: "NanoBanana Pro", cost: "—" },
];

const VIDEO_MODELS = [
  { id: "kling-3", name: "Kling 3.0", cost: "210–2400" },
  { id: "kling-3-omni", name: "Kling 3.0 Omni", cost: "210–1725" },
  { id: "seedance-2-fast", name: "Seedance 2.0 Fast", cost: "450–5000" },
  { id: "seedance-2", name: "Seedance 2.0", cost: "550–6500" },
];

const IMAGE_TUTORIALS = [
  "Creating multiple images",
  "Change perspective of an edit",
  "Producing film-style stills",
  "Keeping product text",
];

const VIDEO_TUTORIALS = [
  "Producing UGC-style",
  "Motion transfer with Kling",
  "Keeping product text",
  "Discover Kling 3.0 Omni",
];

export function StudioSurface({ kind }: { kind: "image" | "video" }) {
  const models = kind === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const [model, setModel] = React.useState(models[0].id);
  const [prompt, setPrompt] = React.useState("");
  const [aspect, setAspect] = React.useState(kind === "image" ? "3:4" : "9:16");
  const [count, setCount] = React.useState(2);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const selected = models.find((item) => item.id === model) ?? models[0];

  return (
    <div className="zy-studio">
      <aside className="zy-studio-tools">
        <div className="zy-studio-tools-head">
          <span>{kind === "image" ? "Image Generator" : "Video Generator"}</span>
          <em>Tools</em>
        </div>

        <label>
          Model
          <button type="button" className="zy-model-btn" onClick={() => setPickerOpen((open) => !open)}>
            <Sparkles size={14} />
            <b>{selected.name}</b>
            <small>{selected.cost === "—" ? "Cost unknown until connected" : selected.cost}</small>
          </button>
        </label>
        {pickerOpen && (
          <div className="zy-model-menu">
            {models.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === model ? "is-active" : ""}
                onClick={() => {
                  setModel(item.id);
                  setPickerOpen(false);
                }}
              >
                <b>{item.name}</b>
                <small>{item.cost === "—" ? "Unknown" : item.cost}</small>
              </button>
            ))}
          </div>
        )}

        <label>References</label>
        <div className="zy-ref-grid">
          {kind === "video" ? (
            <>
              <button type="button" disabled><ImageIcon size={16} />Start image</button>
              <button type="button" disabled><ImageIcon size={16} />End image</button>
              <button type="button" disabled><Film size={16} />Motion</button>
              <button type="button" disabled><Plus size={16} />Add</button>
            </>
          ) : (
            <>
              <button type="button" disabled>Style</button>
              <button type="button" disabled>Character</button>
              <button type="button" disabled><Plus size={16} />Add</button>
            </>
          )}
        </div>

        <label>{kind === "video" ? "Shot" : "Prompt"}</label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={kind === "video" ? "Reference your video or images using @image 1" : "Describe your image — @ to add a reference"}
          rows={6}
        />

        <div className="zy-studio-meta">
          {kind === "video" ? (
            <>
              <span>720</span>
              <span>3s</span>
              <span>{aspect}</span>
              <span><MicOff size={12} /> Off</span>
            </>
          ) : (
            <>
              <span>{count}×</span>
              <span>{aspect}</span>
            </>
          )}
        </div>

        <div className="zy-aspect-row">
          {(kind === "video" ? ["9:16", "16:9", "1:1"] : ["1:1", "3:4", "4:5", "9:16", "16:9"]).map((item) => (
            <button key={item} type="button" className={aspect === item ? "is-active" : ""} onClick={() => setAspect(item)}>
              {item}
            </button>
          ))}
          {kind === "image" && (
            <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
              {[1, 2, 3, 4].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
        </div>

        <button type="button" className="zy-generate" disabled>
          Generate
          <small>Connect fal in Settings before a real render</small>
        </button>
      </aside>

      <section className="zy-studio-stage">
        <header>
          <b>Getting started</b>
          <span>Tutorials stay visible. No fake renders are shown as yours.</span>
        </header>
        <div className={`zy-hero-card is-${kind}`}>
          <button type="button" className="zy-play" aria-label="Play tutorial">▶</button>
          <div>
            <small>Tutorial</small>
            <h2>{kind === "image" ? "Generate an image" : "Generate a video"}</h2>
          </div>
        </div>
        <div className="zy-tutorial-row">
          {(kind === "image" ? IMAGE_TUTORIALS : VIDEO_TUTORIALS).map((title) => (
            <article key={title}>
              <div />
              <b>{title}</b>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
