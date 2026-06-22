import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

async function ensureUploadsDir() {
  const uploadsPath = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.promises.mkdir(uploadsPath, { recursive: true });
  } catch (e) {
    // ignore
  }
  return uploadsPath;
}

function isSubscribedUser(user: any, profile: any) {
  if (!user && !profile) return false;
  if (user?.plan === "pro" || user?.app_metadata?.plan === "pro") return true;
  if (profile?.plan === "pro" || profile?.subscription === "pro") return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content-type; must be multipart/form-data" }, { status: 400 });
    }

    const form = await request.formData();
    const userRaw = form.get("user") as string | null;
    const user = userRaw ? JSON.parse(userRaw) : null;
    const profileRaw = form.get("profile") as string | null;
    const profile = profileRaw ? JSON.parse(profileRaw) : null;

    const file = form.get("file") as any;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const subscribed = isSubscribedUser(user, profile);
    const limit = subscribed ? 15 * 1024 * 1024 : 5 * 1024 * 1024; // bytes

    const size = file.size ?? null;
    if (size && size > limit) {
      return NextResponse.json({ error: `File too large. Limit is ${subscribed ? '15MB' : '5MB'}` }, { status: 413 });
    }

    const uploadsPath = await ensureUploadsDir();
    const filename = `${Date.now()}_${(file.name || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const destPath = path.join(uploadsPath, filename);

    // Read file into buffer and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(destPath, buffer);

    const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/uploads/${filename}`;

    return NextResponse.json({ ok: true, file: { id: filename, name: file.name, size: size, type: file.type, url: publicUrl } });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
