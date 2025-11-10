import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment variable
 * In production, store this in a secure environment variable
 * Generate with: openssl rand -base64 32
 */
function getEncryptionKey(): Buffer {
  const key = process.env.MESSAGE_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('MESSAGE_ENCRYPTION_KEY environment variable is not set');
  }
  
  // Convert base64 key to buffer
  return Buffer.from(key, 'base64');
}

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt a message using AES-256-GCM
 * Returns encrypted data in format: salt:iv:authTag:encryptedData (all base64)
 */
export function encryptMessage(plaintext: string): string {
  try {
    const masterKey = getEncryptionKey();
    
    // Generate random salt for key derivation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive encryption key from master key
    const key = deriveKey(masterKey, salt);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the message
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt, iv, authTag, and encrypted data
    // Format: salt:iv:authTag:encryptedData
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');
    
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using AES-256-GCM
 * Expects encrypted data in format: salt:iv:authTag:encryptedData (all base64)
 */
export function decryptMessage(encryptedData: string): string {
  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltB64, ivB64, authTagB64, encrypted] = parts;
    
    // Convert from base64
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    
    const masterKey = getEncryptionKey();
    
    // Derive the same key using the stored salt
    const key = deriveKey(masterKey, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the message
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Hash a string using SHA-256 (one-way)
 * Useful for verification, but NOT for encryption
 */
export function hashString(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    const key = process.env.MESSAGE_ENCRYPTION_KEY;
    return !!key && Buffer.from(key, 'base64').length === 32;
  } catch {
    return false;
  }
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once and store the result in your .env file
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
