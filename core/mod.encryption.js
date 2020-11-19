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


    // Get UUID

    md5_uuid() {
        var key = this.settings.get('core', 'uuid');
        if (key === null) {
            key = uuidv4()
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

    encrypt(str) {
        if (this.is_encrypted(str))
            return str
        var uuid = this.md5_uuid();
        if (uuid !== false) {
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

    decrypt(hash) {
        if (!this.is_encrypted(hash))
            return hash
        var uuid = this.md5_uuid();
        if (uuid !== false) {
            const decipher = crypto.createDecipheriv(this.algorithm, uuid, Buffer.from(hash.iv, 'hex'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrypted.toString();
        }
        return this.output.error('decryption_failed')
    }


}