import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Generate a secure encryption key for message encryption
 * Run this script once to generate your MESSAGE_ENCRYPTION_KEY
 */

function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

function main() {
  console.log('\n🔐 Generating Message Encryption Key...\n');
  
  const encryptionKey = generateEncryptionKey();
  
  console.log('✅ Generated encryption key:\n');
  console.log(`MESSAGE_ENCRYPTION_KEY=${encryptionKey}\n`);
  
  // Try to update .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  const envKey = `\n# Message Encryption Key (AES-256-GCM)\nMESSAGE_ENCRYPTION_KEY=${encryptionKey}\n`;
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('MESSAGE_ENCRYPTION_KEY=')) {
        console.log('⚠️  MESSAGE_ENCRYPTION_KEY already exists in .env.local');
        console.log('   If you want to rotate keys, manually replace it.\n');
      } else {
        fs.appendFileSync(envPath, envKey);
        console.log('✅ Added MESSAGE_ENCRYPTION_KEY to .env.local\n');
      }
    } else {
      fs.writeFileSync(envPath, envKey);
      console.log('✅ Created .env.local with MESSAGE_ENCRYPTION_KEY\n');
    }
  } catch (error) {
    console.log('⚠️  Could not write to .env.local automatically');
    console.log('   Please add the key manually to your .env.local file\n');
  }
  
  console.log('📝 Next steps:');
  console.log('   1. Ensure MESSAGE_ENCRYPTION_KEY is in your .env.local file');
  console.log('   2. Restart your Next.js development server');
  console.log('   3. All new messages will be encrypted automatically');
  console.log('   4. NEVER commit this key to version control!');
  console.log('   5. Use different keys for development and production\n');
  
  console.log('⚠️  IMPORTANT: Once messages are encrypted with this key,');
  console.log('   changing the key will make old messages unreadable!\n');
}

main();
