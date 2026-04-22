import { google, drive_v3 } from "googleapis";

const ROOT_FOLDER_IDS = [
  "FOLDER_ID_REDACTED",
  "FOLDER_ID_REDACTED",
];

const IR_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.google-apps.presentation",
];

const MAX_DEPTH = 5;
const MAX_SEARCH_DEPTH = 6;

export type IrFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  viewLink: string;
  downloadLink: string;
};

function getDrive() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  const key = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

function escapeForQuery(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findCompanyFolders(
  drive: drive_v3.Drive,
  companyName: string
): Promise<drive_v3.Schema$File[]> {
  const escaped = escapeForQuery(companyName);
  const matches: drive_v3.Schema$File[] = [];
  const seenIds = new Set<string>();

  async function walk(folderId: string, depth: number) {
    if (depth > MAX_SEARCH_DEPTH) return;

    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      pageSize: 500,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const folders = res.data.files ?? [];
    const subWalks: Promise<void>[] = [];

    for (const f of folders) {
      if (!f.id || !f.name) continue;
      if (f.name.includes(companyName) && !seenIds.has(f.id)) {
        seenIds.add(f.id);
        matches.push(f);
      } else {
        subWalks.push(walk(f.id, depth + 1));
      }
    }

    await Promise.all(subWalks);
  }

  // Also try a direct name-contains search in case Drive indexes it
  try {
    const direct = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name contains '${escaped}' and trashed=false`,
      fields: "files(id, name, parents)",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of direct.data.files ?? []) {
      if (f.id && !seenIds.has(f.id)) {
        seenIds.add(f.id);
        matches.push(f);
      }
    }
  } catch {
    // ignore; fall back to walk
  }

  await Promise.all(ROOT_FOLDER_IDS.map((r) => walk(r, 0)));

  return matches;
}

async function collectIrFiles(
  drive: drive_v3.Drive,
  folderId: string,
  depth: number
): Promise<drive_v3.Schema$File[]> {
  if (depth > MAX_DEPTH) return [];

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, modifiedTime)",
    pageSize: 200,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = res.data.files ?? [];
  const results: drive_v3.Schema$File[] = [];

  for (const f of files) {
    if (f.mimeType === "application/vnd.google-apps.folder") {
      const nested = await collectIrFiles(drive, f.id!, depth + 1);
      results.push(...nested);
    } else if (f.mimeType && IR_MIME_TYPES.includes(f.mimeType)) {
      results.push(f);
    }
  }

  return results;
}

export async function getIrFiles(companyName: string): Promise<IrFile[]> {
  if (!companyName.trim()) return [];

  const drive = getDrive();
  const folders = await findCompanyFolders(drive, companyName);
  if (folders.length === 0) return [];

  const all: drive_v3.Schema$File[] = [];
  for (const folder of folders) {
    const files = await collectIrFiles(drive, folder.id!, 0);
    all.push(...files);
  }

  const seen = new Set<string>();
  const deduped = all.filter((f) => {
    if (!f.id || seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  deduped.sort((a, b) => {
    const ta = a.modifiedTime ?? "";
    const tb = b.modifiedTime ?? "";
    return tb.localeCompare(ta);
  });

  return deduped.map((f) => ({
    id: f.id!,
    name: f.name ?? "(이름 없음)",
    mimeType: f.mimeType ?? "",
    modifiedTime: f.modifiedTime ?? undefined,
    viewLink: `https://drive.google.com/file/d/${f.id}/view`,
    downloadLink: `https://drive.google.com/uc?export=download&id=${f.id}`,
  }));
}
