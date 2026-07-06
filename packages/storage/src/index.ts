import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * `@diafram/storage` — object storage behind one port.
 *
 * The worker writes rendered MP4s (and later SVG assets) through `StoragePort`,
 * so it doesn't care whether they land on the local filesystem (dev) or
 * Cloudflare R2 (prod). Selected by `STORAGE_BACKEND`.
 */
export interface StoragePort {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
}

/** Local filesystem storage — for development and single-node runs. */
export class LocalStorage implements StoragePort {
  constructor(private readonly baseDir: string) {}

  async put(key: string, body: Buffer): Promise<void> {
    const path = join(this.baseDir, key);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }

  async get(key: string): Promise<Buffer> {
    return readFileSync(join(this.baseDir, key));
  }
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string;
}

/** Cloudflare R2 (S3-compatible) storage — for production. */
export class R2Storage implements StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint ?? `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!res.Body) throw new Error(`Storage object not found: ${key}`);
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}

/** Build the configured storage backend from the environment. */
export function createStorage(): StoragePort {
  if (process.env.STORAGE_BACKEND === "r2") {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT } =
      process.env;
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
      throw new Error("STORAGE_BACKEND=r2 requires R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET");
    }
    return new R2Storage({
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      endpoint: R2_ENDPOINT,
    });
  }
  return new LocalStorage(process.env.STORAGE_DIR ?? join(process.cwd(), ".storage"));
}
