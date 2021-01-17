// Encryption/Decryption Subsystem

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
md5 = require('md5');
const frostybot_module = require('./mod.base')

module.exports = class frostybot_encryption_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Initialize

    initialize() {
        this.algorithm = 'aes-256-ctr';
    }


    // Generate a UUID

    new_uuid() {
        return uuidv4();
    }


    // Get Core UUID

    async core_uuid() {
        var key = await this.settings.get('core', 'uuid');
        if ([null, undefined].includes(key)) {
            key = this.new_uuid();
            if (this.settings.set('core', 'uuid', key)) {
                return md5(key)
            }
            return false
        }
        return md5(key)
    }


    // Check is value is encrypted

    is_encrypted(val) {
        return (this.utils.is_object(val) && val.hasOwnProperty('iv') && val.hasOwnProperty('content')) ? true : false
    }


    // Encrypt a String

    async encrypt(str, uuid = null) {
        if (this.is_encrypted(str))
            return str;
        if (uuid == null)
            var uuid = await this.core_uuid();
        if (![32, 36].includes(uuid.length)) 
            return false;
        if (uuid.length == 36)
            var uuid = md5(uuid);
        if (uuid !== false) {
            if (uuid.length == 36)
                var uuid = md5(uuid);
            var iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, uuid, iv);
            const encrypted = Buffer.concat([cipher.update(str), cipher.final()]);
            return {
                iv: iv.toString('hex'),
                content: encrypted.toString('hex')
            };
        }
        return this.output.error('encryption_failed')
    }


    // Decrypt a String

    async decrypt(hash, uuid = null) {
        if (!this.is_encrypted(hash))
            return hash;
        if (uuid == null)
            var uuid = await this.core_uuid();
        if (![32, 36].includes(uuid.length)) 
            return false;
        if (uuid.length == 36)
            var uuid = md5(uuid);
        if (hash.iv.length != 32)
            return false;
        if (uuid !== false) {
            const decipher = crypto.createDecipheriv(this.algorithm, uuid, Buffer.from(hash.iv, 'hex'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrypted.toString();
        }
        return this.output.error('decryption_failed')
    }


}