import type { Workspace } from "@/lib/workspace";
import type { Node, Edge } from "@xyflow/react";

export type ProjectStatus = "not-started" | "in-progress" | "review" | "done";

export interface Project {
  id: string;
  title: string;
  description: string;
  workspace: Workspace;
  status: ProjectStatus;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  projectId?: string;
  workspace?: Workspace;
  dueDate?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  workspace?: Workspace;
  createdAt: string;
  updatedAt: string;
}

export type AssetType = "image" | "video" | "document";

export interface Asset {
  id: string;
  filename: string;
  type: AssetType;
  workspace?: Workspace;
  url: string;
  createdAt: string;
}

export type ActivityType = "project" | "task" | "note" | "asset" | "workflow";
export type ActivityAction = "created" | "updated" | "completed" | "deleted";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  refId: string;
  label: string;
  /** UI-only addition to the spec'd shape — lets the feed keep its two-line format. */
  detail?: string;
  timestamp: string;
}

export interface WorkflowCanvas {
  id: string;
  name: string;
  workspace?: Workspace;
  nodes: Node[];
  edges: Edge[];
  /** Templates are reusable starting points; instances are duplicated from one. */
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContentPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "threads"
  | "facebook"
  | "pinterest"
  | "email"
  | "blog";

export type ContentType = "text" | "image" | "video" | "link" | "blog" | "transcript";
export type ContentGoal = "awareness" | "saves" | "traffic" | "leads";

export type VersionStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "ready_to_post";

/**
 * Single source of truth extracted before any platform rewriting, per master
 * spec section 5 — this is what stops meaning drift across adaptations.
 */
export interface ContentAnalysis {
  core_idea: string;
  hook: string;
  key_points: string[];
  facts_to_preserve: string[];
}

export interface ContentItem {
  id: string;
  workspace?: Workspace;
  title: string;
  originalContent: string;
  contentType: ContentType;
  goal?: ContentGoal;
  audience?: string;
  cta?: string;
  analysis?: ContentAnalysis;
  status: string;
  createdAt: string;
}

/** Platform-specific fields; shape varies by platform adapter. */
export interface ContentVersionPayload {
  caption?: string;
  hashtags?: string[];
  script?: string;
  title?: string;
  body?: string;
  subject?: string;
  notes?: string;
  /** Everything needed to post by hand when no publish connector exists. */
  manualPostPack?: {
    mediaSpec?: string;
    suggestedTime?: string;
    steps?: string[];
  };
}

export interface ContentVersion {
  id: string;
  contentId: string;
  platform: ContentPlatform;
  payload: ContentVersionPayload;
  status: VersionStatus;
  approvedAt?: string;
  createdAt: string;
}

export interface ScheduledPost {
  id: string;
  versionId: string;
  scheduledFor?: string;
  status: string;
  idempotencyKey?: string;
  attempts: number;
}

export interface BrandVoiceProfileData {
  tone?: string;
  style?: string;
  hooks?: string;
  ctaStyle?: string;
  wordsToUse?: string[];
  wordsToAvoid?: string[];
  emojiRules?: string;
  hashtagRules?: string;
}

export interface BrandVoiceProfile {
  id: string;
  workspace?: Workspace;
  name: string;
  profile: BrandVoiceProfileData;
  createdAt: string;
}

export interface PublishMode {
  autoPublish: boolean;
  humanApprovalRequired: boolean;
}

/** Master spec section 6: Instagram and Facebook only. */
export type AutomationPlatform = "instagram" | "facebook";
export type AutomationStatus = "draft" | "active" | "paused";
export type AutomationResult = "sent" | "failed" | "gated_not_following";

export interface AutomationStep {
  message: string;
}

export interface AutomationFlow {
  id: string;
  platform: AutomationPlatform;
  triggerKeyword: string;
  requiresFollow: boolean;
  steps: AutomationStep[];
  status: AutomationStatus;
  createdAt: string;
}

export interface AutomationLogEntry {
  id: string;
  flowId?: string;
  contactIdentifier?: string;
  triggeredAt: string;
  result: AutomationResult;
  /** False only once a real Meta Graph API call has actually run. */
  simulated: boolean;
}

export type KnowledgeCategory =
  | "my-business"
  | "client-business"
  | "playbook"
  | "reference"
  | "design-system"
  | "template";

export type DocumentType =
  | "brand-bible"
  | "sop"
  | "brand-kit"
  | "design-dna"
  | "general";

export interface KnowledgeFolder {
  id: string;
  name: string;
  parentId?: string;
  workspace?: Workspace;
  category?: KnowledgeCategory;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  folderId?: string;
  title: string;
  content: string;
  documentType: DocumentType;
  createdAt: string;
  updatedAt: string;
}

export interface BrandKitColors {
  primary?: string;
  secondary?: string;
  neutrals?: string;
  usageNotes?: string;
}

export interface ClientBrandKit {
  id: string;
  folderId?: string;
  businessName: string;
  industry?: string;
  website?: string;
  primaryContact?: string;
  colors?: BrandKitColors;
  typography?: string;
  brandVoice?: string;
  audience?: string;
  offers?: string;
  restrictions?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowRunStatus = "draft" | "in-progress" | "completed";

export type WorkflowRunEventType =
  | "created"
  | "node-updated"
  | "approved"
  | "rejected"
  | "completed";

export interface WorkflowRunEvent {
  type: WorkflowRunEventType;
  label: string;
  at: string;
}

export interface WorkflowRun {
  id: string;
  canvasId: string;
  status: WorkflowRunStatus;
  log: WorkflowRunEvent[];
  createdAt: string;
  updatedAt: string;
}
