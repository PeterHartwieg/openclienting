"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadOrgLogo } from "@/lib/actions/organizations";

export function OrgLogoUpload({
  organizationId,
  currentLogoUrl,
}: {
  organizationId: string;
  currentLogoUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");
    if (!file) return;

    if (file.size > 512 * 1024) {
      setError("Logo must be under 512 KB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("organizationId", organizationId);
    formData.append("file", file);

    const result = await uploadOrgLogo(formData);

    setUploading(false);

    if (result.success) {
      setPreview(result.logoUrl);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {preview ? (
          <Image
            src={preview}
            alt="Organization logo"
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-lg object-cover border"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
            Logo
          </div>
        )}
        <div>
          <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
            {uploading ? "Uploading..." : preview ? "Change logo" : "Upload logo"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Max 512 KB, image files only
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
