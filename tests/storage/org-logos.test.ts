/**
 * Suite 3 — storage upload lifecycle (Vitest)
 *
 * Tests the uploadOrgLogo server action focusing on server-side validation
 * logic (MIME type allowlist, file size limit). The Supabase client and
 * next/headers are fully mocked so no real network calls are made.
 *
 * src/lib/actions/organizations.ts lines ~200–266
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock next/headers — must be hoisted before the action import
// ---------------------------------------------------------------------------
vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/server
// We control what getUser, from().select(), storage, etc. return
// ---------------------------------------------------------------------------
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn(() => ({
  data: { publicUrl: "https://cdn.example.com/logo.png" },
}));
const mockMembershipSelect = vi.fn();
const mockOrgUpdate = vi.fn();

const mockFromFactory = (table: string) => {
  if (table === "organization_memberships") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: mockMembershipSelect,
          }),
        }),
      }),
    };
  }
  if (table === "organizations") {
    return {
      update: () => ({
        eq: mockOrgUpdate,
      }),
    };
  }
  return {};
};

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn((table: string) => mockFromFactory(table)),
  storage: {
    from: vi.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}));

// ---------------------------------------------------------------------------
// Import the action AFTER mocks are wired
// ---------------------------------------------------------------------------
import { uploadOrgLogo } from "@/lib/actions/organizations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ORG_ID = "org-uuid-1234";

function makeFormData(file: File, orgId = ORG_ID): FormData {
  const fd = new FormData();
  fd.append("organizationId", orgId);
  fd.append("file", file);
  return fd;
}

function makeFile(mimeType: string, sizeBytes: number, name = "logo.bin"): File {
  // Create a buffer of the given size filled with zeros
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type: mimeType });
}

// ---------------------------------------------------------------------------
// Setup: authenticated user + active admin membership by default
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();

  // Default: user is signed in
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-uuid-1", email: "admin@example.com" } },
    error: null,
  });

  // Default: user is an active admin of the org
  mockMembershipSelect.mockResolvedValue({
    data: { role: "admin", membership_status: "active" },
    error: null,
  });

  // Default: storage upload succeeds
  mockUpload.mockResolvedValue({ data: { path: `${ORG_ID}/logo.png` }, error: null });

  // Default: org update succeeds
  mockOrgUpdate.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("uploadOrgLogo — MIME type validation", () => {
  it("accepts image/jpeg", async () => {
    const file = makeFile("image/jpeg", 100, "logo.jpg");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(true);
  });

  it("accepts image/png", async () => {
    const file = makeFile("image/png", 100, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(true);
  });

  it("accepts image/webp", async () => {
    const file = makeFile("image/webp", 100, "logo.webp");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(true);
  });

  it("rejects image/svg+xml", async () => {
    const file = makeFile("image/svg+xml", 100, "logo.svg");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/JPEG, PNG, and WebP/i);
  });

  it("rejects image/gif", async () => {
    const file = makeFile("image/gif", 100, "logo.gif");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/JPEG, PNG, and WebP/i);
  });

  it("rejects application/pdf", async () => {
    const file = makeFile("application/pdf", 100, "logo.pdf");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/JPEG, PNG, and WebP/i);
  });
});

describe("uploadOrgLogo — filename vs content-type", () => {
  it("PNG bytes labeled .svg filename: succeeds because server validates file.type not filename", async () => {
    // file.type = image/png (the true type), filename happens to say .svg — server must use file.type
    const file = makeFile("image/png", 100, "logo.svg");
    const result = await uploadOrgLogo(makeFormData(file));
    // Server derives extension from file.type ("image/png" → "jpg"), not the filename
    expect(result.success).toBe(true);
  });

  it("SVG bytes labeled .png filename: rejected because file.type is image/svg+xml", async () => {
    // The browser sets file.type from the actual content in File constructor when type is explicit.
    // Here we explicitly pass the SVG MIME type (simulating what the browser would report for
    // an SVG file even if renamed to .png)
    const file = makeFile("image/svg+xml", 100, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/JPEG, PNG, and WebP/i);
  });
});

describe("uploadOrgLogo — file size validation", () => {
  it("file exactly at 512 KB limit: accepted", async () => {
    const file = makeFile("image/png", 512 * 1024, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(true);
  });

  it("file one byte over 512 KB: rejected", async () => {
    const file = makeFile("image/png", 512 * 1024 + 1, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/512 KB/i);
  });

  it("file at 1 MB: rejected", async () => {
    const file = makeFile("image/png", 1024 * 1024, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/512 KB/i);
  });
});

describe("uploadOrgLogo — auth and membership checks", () => {
  it("unauthenticated user: rejected before validation", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    const file = makeFile("image/png", 100, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/sign in/i);
  });

  it("authenticated non-admin member: rejected", async () => {
    mockMembershipSelect.mockResolvedValueOnce({
      data: { role: "member", membership_status: "active" },
      error: null,
    });
    const file = makeFile("image/png", 100, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/admin/i);
  });

  it("no membership row at all: rejected", async () => {
    mockMembershipSelect.mockResolvedValueOnce({
      data: null,
      error: { message: "No rows found" },
    });
    const file = makeFile("image/png", 100, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/admin/i);
  });
});

describe("uploadOrgLogo — storage error passthrough", () => {
  it("storage upload failure: propagates error message", async () => {
    mockUpload.mockResolvedValueOnce({
      data: null,
      error: { message: "Bucket not found" },
    });
    const file = makeFile("image/png", 100, "logo.png");
    const result = await uploadOrgLogo(makeFormData(file));
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toBe("Bucket not found");
  });
});
