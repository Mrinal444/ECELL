import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createDatabaseBackup(): Promise<{
  success: boolean;
  filename: string;
  filepath: string;
  sizeBytes: number;
  error?: string;
}> {
  let dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  if (!fs.existsSync(dbPath)) {
    dbPath = path.resolve(process.cwd(), "dev.db");
  }
  const backupDir = path.resolve(process.cwd(), "backups");

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const filename = `ecell-crm-backup-${timestamp}.db`;
  const targetPath = path.join(backupDir, filename);

  try {
    fs.copyFileSync(dbPath, targetPath);
    const stats = fs.statSync(targetPath);

    await prisma.backupLog.create({
      data: {
        filename,
        sizeBytes: stats.size,
        status: "SUCCESS",
      },
    });

    // Prune backups older than 30 files
    const existingBackups = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".db"))
      .sort()
      .reverse();

    if (existingBackups.length > 30) {
      for (const oldFile of existingBackups.slice(30)) {
        try {
          fs.unlinkSync(path.join(backupDir, oldFile));
        } catch {
          // ignore
        }
      }
    }

    return {
      success: true,
      filename,
      filepath: targetPath,
      sizeBytes: stats.size,
    };
  } catch (error: any) {
    await prisma.backupLog.create({
      data: {
        filename,
        sizeBytes: 0,
        status: `FAILED: ${error?.message || "Unknown error"}`,
      },
    });
    throw error;
  }
}

async function runCli() {
  console.log("📦 Starting SQLite DB Backup...");
  try {
    const result = await createDatabaseBackup();
    console.log(`✅ Backup created successfully: ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
    console.log(`📍 Saved to: ${result.filepath}`);
  } catch (e) {
    console.error("❌ Backup failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runCli();
}
