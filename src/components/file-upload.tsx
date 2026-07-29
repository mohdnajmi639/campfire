"use client";

import { UploadDropzone } from "@uploadthing/react";
import Image from "next/image";
import { FileIcon, X } from "lucide-react";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "serverImage" | "messageFile";
}

export function FileUpload({ onChange, value, endpoint }: FileUploadProps) {
  const fileType = value?.split(".").pop();

  if (value && fileType !== "pdf") {
    return (
      <div className="relative h-20 w-20">
        <Image
          fill
          src={value}
          alt="Upload"
          className="rounded-full object-cover"
        />
        <button
          onClick={() => onChange("")}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-discord-red text-white shadow-md transition-transform hover:scale-110"
          type="button"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  if (value && fileType === "pdf") {
    return (
      <div className="relative flex items-center gap-2 rounded-md bg-discord-darker p-2">
        <FileIcon className="h-10 w-10 fill-campfire-orange/10 stroke-campfire-orange" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-campfire-orange hover:underline"
        >
          PDF File
        </a>
        <button
          onClick={() => onChange("")}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-discord-red text-white shadow-md"
          type="button"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        onChange(res?.[0].ufsUrl);
      }}
      onUploadError={(error: Error) => {
        console.error(error);
      }}
      className="border-dashed border-2 border-discord-active bg-discord-darker ut-label:text-discord-muted ut-allowed-content:text-discord-muted ut-button:bg-campfire-orange ut-button:hover:bg-campfire-ember"
    />
  );
}
