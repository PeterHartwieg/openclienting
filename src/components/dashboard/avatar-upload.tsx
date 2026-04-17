"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { uploadAvatar, removeAvatar } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  fallbackInitial: string;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp";

export function AvatarUpload({
  currentAvatarUrl,
  fallbackInitial,
}: AvatarUploadProps) {
  const t = useTranslations("account.avatar");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError(t("errorTooLarge"));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("errorInvalidType"));
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAvatar(formData);
    setUploading(false);

    if (result.success) {
      setPreview(result.avatarUrl);
      router.refresh();
    } else {
      setError(result.error);
      setPreview(currentAvatarUrl);
    }
  }

  function handleRemove() {
    setError("");
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.success) {
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {preview ? (
          <Image
            src={preview}
            alt={t("altText")}
            width={72}
            height={72}
            unoptimized
            className="h-18 w-18 rounded-full object-cover border"
            style={{ height: 72, width: 72 }}
          />
        ) : (
          <div className="h-[72px] w-[72px] rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-medium uppercase">
            {fallbackInitial || "?"}
          </div>
        )}
        <div className="space-y-2">
          <label className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50">
            {uploading
              ? t("uploading")
              : preview
              ? t("changeAvatar")
              : t("uploadAvatar")}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              disabled={uploading || isPending}
              className="hidden"
            />
          </label>
          {preview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isPending || uploading}
            >
              {isPending ? t("removing") : t("remove")}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {t("hint")}
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
