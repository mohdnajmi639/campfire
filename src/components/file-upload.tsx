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
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition-transform hover:scale-110"
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
      appearance={{
        container:
          "w-full border-2 border-dashed border-[#2b2d31] bg-[#1e1f22]/50 hover:bg-[#1e1f22] hover:border-campfire-blue/50 transition-all duration-300 rounded-xl p-8 cursor-pointer group outline-none",
        label:
          "text-white/90 font-medium text-base group-hover:text-campfire-blue transition-colors",
        allowedContent: "text-discord-muted text-xs font-medium mt-2",
        uploadIcon:
          "text-discord-muted/80 w-12 h-12 mb-4 group-hover:text-campfire-blue transition-colors",
      }}
      className="ut-button:bg-campfire-blue ut-button:text-white ut-button:font-semibold ut-button:text-sm ut-button:hover:bg-campfire-blue/90 ut-button:px-5 ut-button:py-2.5 ut-button:rounded-md ut-button:shadow-md ut-button:shadow-campfire-blue/20"
      content={{
        label: endpoint === "messageFile" ? "Choose a file or drag & drop" : "Click to upload image",
      }}
    />
  );
}
