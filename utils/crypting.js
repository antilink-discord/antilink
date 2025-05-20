import crypto from 'crypto';
import "dotenv/config";

const key = crypto.createHash('sha256').update(process.env.SECRET).digest();
const algorithm = 'aes-256-gcm';
const ivLength = 16;

export function encrypt(text) {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();


    return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}

export function decrypt(encryptedText) {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Неправильний формат зашифрованого тексту');

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}