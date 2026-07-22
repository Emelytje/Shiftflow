import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Symmetrische versleuteling (AES-256-GCM) voor gevoelige velden "at rest",
 * zoals het 2FA-secret. De sleutel komt uit ENCRYPTION_KEY (env).
 * Formaat opgeslagen string: base64(iv).base64(authTag).base64(ciphertext)
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? 'dev-only-encryption-key-change-me';
  // Normaliseer naar exact 32 bytes via SHA-256.
  return createHash('sha256').update(raw).digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Ongeldig versleuteld formaat');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
