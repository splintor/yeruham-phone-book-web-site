// From https://stackoverflow.com/a/62640781/46635
import { CipherGCM, DecipherGCM } from 'crypto'
import * as crypto from 'crypto'
import { Buffer } from 'buffer'

const ALGORITHM = {
  // GCM is an authenticated encryption mode that not only provides confidentiality but also provides integrity in a secured way
  BLOCK_CIPHER: "aes-256-gcm",
  // 128 bit auth tag is recommended for GCM
  AUTH_TAG_BYTE_LEN: 16,
  // NIST recommends 96 bits or 12 bytes IV for GCM to promote interoperability, efficiency, and simplicity of design
  IV_BYTE_LEN: 12,
  // NOTE: 256 (in algorithm name) is key size (block size for AES is always 128)
  KEY_BYTE_LEN: 32,
  // to prevent rainbow table attacks
  SALT_BYTE_LEN: 16
}

export function getKeyFromPassword(password: string) {
  return crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
}

/**
 *
 * @param {Buffer} textToEncrypt - The clear text message to be encrypted
 * @param {Buffer} key - The key to be used for encryption
 *
 * The caller of this function has the responsibility to clear
 * the Buffer after the encryption to prevent the message text
 * and the key from lingering in the memory
 */
export function encrypt(textToEncrypt: string, key: string) {
  const iv = crypto.randomBytes(ALGORITHM.IV_BYTE_LEN)
  const cipher = crypto.createCipheriv(ALGORITHM.BLOCK_CIPHER, key, iv) as CipherGCM
  const bufferToEncrypt = Buffer.from(textToEncrypt, 'utf8')
  let encryptedMessage = cipher.update(bufferToEncrypt)
  const cipherFinal = cipher.final()
  const authTag = cipher.getAuthTag()
  encryptedMessage = Buffer.concat([encryptedMessage, cipherFinal])
  return Buffer.concat([iv, encryptedMessage, authTag]).toString('base64')
}

/**
 *
 * @param {Buffer} encryptedText - Cipher text
 * @param {Buffer} key - The key to be used for decryption
 *
 * The caller of this function has the responsibility to clear
 * the Buffer after the decryption to prevent the message text
 * and the key from lingering in the memory
 */
export function decrypt(encryptedText: string, key: string) {
  const encryptedBuffer = Buffer.from(encryptedText, 'base64')
  const authTag = encryptedBuffer.slice(-16)
  const iv = encryptedBuffer.slice(0, 12)
  const encryptedMessage = encryptedBuffer.slice(12, -16)
  const decipher = crypto.createDecipheriv(ALGORITHM.BLOCK_CIPHER, key, iv) as DecipherGCM
  decipher.setAuthTag(authTag)
  const decryptedText = decipher.update(encryptedMessage)
  const decipherFinal = decipher.final()
  return Buffer.concat([decryptedText, decipherFinal]).toString('utf8')
  // return decryptedText.toString('base64')
}
