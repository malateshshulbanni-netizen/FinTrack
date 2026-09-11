import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended GCM IV size
const KEY_LENGTH = 32; // 32 bytes = 256 bits

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error('ERROR: ENCRYPTION_KEY is not configured in .env file');
  console.error('Please add ENCRYPTION_KEY to your .env file');
  console.error('Generate one using: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// Store ENCRYPTION_KEY as a 64-character hexadecimal string.
if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
  throw new Error(
    'ENCRYPTION_KEY must be a 64-character hexadecimal string. ' +
    'Generate one using: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
  );
}

const KEY = Buffer.from(ENCRYPTION_KEY, 'hex');

if (KEY.length !== KEY_LENGTH) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
}

/**
 * Encrypt a value using AES-256-GCM.
 * 
 * Stored format: iv:authTag:ciphertext
 * 
 * This is the most secure encryption method:
 * - AES-256 (military-grade encryption)
 * - GCM mode (authenticated encryption)
 * - Unique random IV for every encryption
 * - Authentication tag prevents tampering
 */
export const encryptAmount = (amount) => {
  if (amount === null || amount === undefined) {
    return null;
  }

  const plaintext = String(amount);

  // Generate unique random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    KEY,
    iv
  );

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get authentication tag for integrity verification
  const authTag = cipher.getAuthTag();

  // Return combined format: iv:authTag:ciphertext
  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
};

/**
 * Decrypt an AES-256-GCM encrypted value.
 * 
 * Returns null if decryption fails (prevents exposing invalid data)
 */
export const decryptAmount = (encryptedAmount) => {
  if (!encryptedAmount) {
    return null;
  }

  try {
    const parts = encryptedAmount.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    if (authTag.length !== 16) {
      throw new Error('Invalid authentication tag length');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      iv
    );

    // Set authentication tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    const plaintext = decrypted.toString('utf8');

    const amount = Number(plaintext);

    if (!Number.isFinite(amount)) {
      throw new Error('Invalid decrypted amount');
    }

    return amount;
  } catch (error) {
    // Log error but don't expose any data
    console.error('Decryption failed:', error.message);
    
    // Return null to prevent exposing invalid data
    return null;
  }
};

/**
 * Decrypt amount safely (returns null if fails)
 */
export const decryptAmountSafe = (encryptedAmount) => {
  try {
    return decryptAmount(encryptedAmount);
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
};

/**
 * Encrypt amounts in transactions array
 */
export const encryptAmounts = (transactions) => {
  return transactions.map((transaction) => ({
    ...transaction._doc,
    amount: encryptAmount(transaction.amountOriginal || transaction.amount),
  }));
};

/**
 * Decrypt amounts in transactions array
 */
export const decryptAmounts = (transactions) => {
  return transactions.map((transaction) => {
    const decryptedAmount = decryptAmount(transaction.amount);
    return {
      ...transaction._doc,
      amount: decryptedAmount,
      amountOriginal: decryptedAmount // Set original to decrypted value
    };
  });
};