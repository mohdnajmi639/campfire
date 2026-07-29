"use client";

import { UploadDropzone } from "@uploadthing/react";
import Image from "next/image";
import { FileIcon, X } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "serverImage" | "messageFile" | "userImage";
}

export function FileUpload({ onChange, value, endpoint }: FileUploadProps) {
  const fileType = value?.split(".").pop();

  if (value && fileType !== "pdf") {
    const isMessageFile = endpoint === "messageFile";
    return (
      <div className={isMessageFile ? "relative h-48 w-full max-w-[240px] group mt-2" : "relative h-20 w-20 group"}>
        <Image
          fill
          src={value}
          alt="Upload"
          className={isMessageFile ? "rounded-md object-cover" : "rounded-full object-cover"}
        />
        <button
          onClick={() => onChange("")}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition-transform hover:scale-110 opacity-0 group-hover:opacity-100"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value && fileType === "pdf") {
    return (
      <div className="relative flex items-center gap-2 rounded-md bg-discord-darker p-3 w-full">
        <FileIcon className="h-10 w-10 fill-discord-blurple/20 stroke-discord-blurple" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-discord-link hover:underline"
        >
          PDF Document
        </a>
        <button
          onClick={() => onChange("")}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition-transform hover:scale-110"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone<OurFileRouter, "serverImage" | "messageFile" | "userImage">
      endpoint={endpoint}
      config={{ mode: "auto" }}
      onClientUploadComplete={(res: any) => {
        onChange(res?.[0].ufsUrl);
      }}
      onUploadError={(error: Error) => {
        console.error(error);
      }}
      className="w-full border-dashed border-2 border-discord-active bg-discord-darker hover:bg-[#18191c] transition-colors ut-label:text-discord-text ut-allowed-content:text-discord-muted ut-button:bg-discord-blurple ut-button:hover:bg-discord-blurple/80"
    />
  );
}
