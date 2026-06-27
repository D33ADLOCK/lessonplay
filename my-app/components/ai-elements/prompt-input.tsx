"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPTED_ATTACHMENT_INPUT_TYPES,
  validateAttachmentFile,
} from "@/lib/client/upload-attachment";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "ai";
import {
  ArrowUpIcon,
  FileIcon,
  Loader2Icon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from "react";
import { Children, useCallback, useRef } from "react";

// SessionStorage utilities for prompt persistence
const PROMPT_STORAGE_KEY = "lessonplay-prompt-data";
const LEGACY_PROMPT_STORAGE_KEY = "v0-prompt-data";

export interface StoredPromptData {
  message: string;
}

export const savePromptToStorage = (message: string) => {
  try {
    const data: StoredPromptData = {
      message,
    };
    sessionStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save prompt to sessionStorage:", error);
  }
};

export const loadPromptFromStorage = (): StoredPromptData | null => {
  try {
    const stored =
      sessionStorage.getItem(PROMPT_STORAGE_KEY) ??
      sessionStorage.getItem(LEGACY_PROMPT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as { message?: unknown };
      if (typeof data.message !== "string") {
        return null;
      }

      const promptData: StoredPromptData = { message: data.message };
      sessionStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(promptData));
      sessionStorage.removeItem(LEGACY_PROMPT_STORAGE_KEY);
      return promptData;
    }
  } catch (error) {
    console.warn("Failed to load prompt from sessionStorage:", error);
  }
  return null;
};

export const clearPromptFromStorage = () => {
  try {
    sessionStorage.removeItem(PROMPT_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_PROMPT_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear prompt from sessionStorage:", error);
  }
};

// Dedicated, one-shot handoff key for the home -> detail first prompt
// (Approach X). Kept separate from the draft key above so the detail page's
// input restore and the auto-send never read the same value twice.
const INITIAL_PROMPT_KEY = "lessonplay-initial-prompt";
const LEGACY_INITIAL_PROMPT_KEY = "v0-initial-prompt";

export type InitialPromptData = {
  text: string;
  attachmentIds: string[];
  attachments?: MessageAttachmentMetadata[];
};

export type MessageAttachmentMetadata = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export const saveInitialPrompt = (
  chatId: string,
  prompt: string | InitialPromptData,
) => {
  try {
    const data =
      typeof prompt === "string"
        ? { chatId, text: prompt, attachmentIds: [] }
        : { chatId, ...prompt };

    sessionStorage.setItem(
      INITIAL_PROMPT_KEY,
      JSON.stringify(data),
    );
  } catch (error) {
    console.warn("Failed to save initial prompt to sessionStorage:", error);
  }
};

/**
 * Reads and clears the stashed first prompt, but only if it was stashed for
 * this exact chat id. Returns null otherwise. Removing the key makes it a
 * one-shot, so a double-invoked effect can't send the message twice.
 */
export const takeInitialPrompt = (chatId: string): InitialPromptData | null => {
  try {
    const storageKey = sessionStorage.getItem(INITIAL_PROMPT_KEY)
      ? INITIAL_PROMPT_KEY
      : LEGACY_INITIAL_PROMPT_KEY;
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }
    const data = JSON.parse(stored) as {
      chatId?: string;
      text?: string;
      attachmentIds?: unknown;
      attachments?: unknown;
    };
    if (data.chatId !== chatId || typeof data.text !== "string") {
      return null;
    }
    sessionStorage.removeItem(storageKey);
    return {
      text: data.text,
      attachmentIds: Array.isArray(data.attachmentIds)
        ? data.attachmentIds.filter((id): id is string => typeof id === "string")
        : [],
      attachments: Array.isArray(data.attachments)
        ? data.attachments.filter(
            (attachment): attachment is MessageAttachmentMetadata =>
              typeof attachment === "object" &&
              attachment !== null &&
              typeof (attachment as MessageAttachmentMetadata).id === "string" &&
              typeof (attachment as MessageAttachmentMetadata).fileName ===
                "string" &&
              typeof (attachment as MessageAttachmentMetadata).contentType ===
                "string" &&
              typeof (attachment as MessageAttachmentMetadata).sizeBytes ===
                "number",
          )
        : [],
    };
  } catch (error) {
    console.warn("Failed to read initial prompt from sessionStorage:", error);
    return null;
  }
};

function getValidAttachmentFiles(files: File[]) {
  const validFiles: File[] = [];

  for (const file of files) {
    const validation = validateAttachmentFile(file);

    if (validation.ok) {
      validFiles.push(validation.file);
    } else {
      console.warn(`Skipped attachment "${file.name}": ${validation.error}`);
    }
  }

  return validFiles;
}

export type PromptInputProps = HTMLAttributes<HTMLFormElement> & {
  onAttachmentDrop?: (files: File[]) => void;
  isDragOver?: boolean;
};

export const PromptInput = ({
  className,
  onAttachmentDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: PromptInputProps) => {
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDragOver?.(e);
    },
    [onDragOver],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDragLeave?.(e);
    },
    [onDragLeave],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = getValidAttachmentFiles(Array.from(e.dataTransfer.files));

      if (files.length > 0) {
        onAttachmentDrop?.(files);
      }

      onDrop?.(e);
    },
    [onAttachmentDrop, onDrop],
  );

  return (
    <form
      className={cn(
        "w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm transition-colors",
        isDragOver && "border-primary bg-primary/5",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}
    />
  );
};

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = "What would you like to know?",
  minHeight = 48,
  maxHeight = 164,
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      // Don't submit if IME composition is in progress
      if (e.nativeEvent.isComposing) {
        return;
      }

      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <Textarea
      className={cn(
        "w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0",
        "field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent",
        "focus-visible:ring-0",
        className,
      )}
      name="message"
      onChange={(e) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn("flex items-center justify-between p-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      "flex items-center gap-1",
      "[&_button:first-child]:rounded-bl-xl",
      className,
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? "default" : "icon";

  return (
    <Button
      className={cn(
        "shrink-0 gap-1.5 rounded-lg",
        variant === "ghost" && "text-muted-foreground",
        newSize === "default" && "px-3",
        className,
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <ArrowUpIcon className="size-4" />;

  if (status === "submitted") {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <Button
      className={cn("gap-1.5 rounded-lg", className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className,
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);

export type PromptInputAttachmentButtonProps = ComponentProps<typeof Button> & {
  onAttachmentSelect?: (files: File[]) => void;
};

export const PromptInputAttachmentButton = ({
  className,
  onAttachmentSelect,
  ...props
}: PromptInputAttachmentButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = getValidAttachmentFiles(Array.from(e.target.files || []));

      if (files.length > 0) {
        onAttachmentSelect?.(files);
      }

      // Reset the input so the same file can be selected again
      if (e.target) {
        e.target.value = "";
      }
    },
    [onAttachmentSelect],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_ATTACHMENT_INPUT_TYPES}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <PromptInputButton
        className={cn(className)}
        onClick={handleClick}
        {...props}
      >
        <FileIcon className="size-4" />
      </PromptInputButton>
    </>
  );
};

export type PromptAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: "uploading" | "uploaded" | "failed";
  attachmentId?: string;
  previewUrl?: string;
  error?: string;
};

function isImagePromptAttachment(attachment: PromptAttachment) {
  return attachment.contentType.startsWith("image/");
}

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type PromptInputAttachmentPreviewProps = {
  attachments: PromptAttachment[];
  onRemove?: (id: string) => void;
  className?: string;
};

export const PromptInputAttachmentPreview = ({
  attachments,
  onRemove,
  className,
}: PromptInputAttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 p-2", className)}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={cn(
            "relative group w-36 rounded-lg overflow-hidden border bg-muted",
            attachment.status === "failed" && "border-destructive",
          )}
        >
          <div className="flex gap-2 p-2">
            {isImagePromptAttachment(attachment) && attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.fileName}
                className="size-10 rounded object-cover"
              />
            ) : (
              <div className="size-10 flex shrink-0 items-center justify-center rounded bg-background text-muted-foreground">
                <FileIcon className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">
                {attachment.fileName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {attachment.status === "uploading"
                  ? "Uploading..."
                  : attachment.status === "failed"
                    ? "Upload failed"
                    : formatAttachmentSize(attachment.sizeBytes)}
              </div>
            </div>
          </div>
          {attachment.error && (
            <div className="px-2 pb-2 text-[11px] text-destructive">
              {attachment.error}
            </div>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(attachment.id)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
