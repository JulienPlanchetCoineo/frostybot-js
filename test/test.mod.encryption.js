// ================================================================================
//  Frostybot Unit Tests: Encryption Module (mod.encryption.js)
// ================================================================================

// Load all modules

const core_test = require('../core/core.test');
const test = new core_test();

// Load Unit Test Modules

var chai = require('chai');
var expect = chai.expect

// Unit Test Definitions


describe(test.title('Encryption Module (mod.encryption.js)'), function() {

    // new_uuid()

    describe(test.function('new_uuid'), function() {
        it('should return a UUID string of length 36', function() {
            var val = test.encryption.new_uuid();
            expect(val).to.be.a('string').that.has.length(36);
        });
    });

    // core_uuid()

    describe(test.function('core_uuid'), function() {
        it('should return an UUID string of length 36', async function() {
            var val = await test.encryption.core_uuid();
            expect(val).to.be.a('string').that.has.length(36);
        });
    });

    // is_encrypted()

    describe(test.function('is_encrypted'), function() {
        it('should return true if value is encrypted', function() {
            var enc = {iv: "3a46b094501b116fa7735a4f75adf4ae", content: "e4f84356e2e56975deff14e8014591c08de73b8ad1386a50df84bd34e7c695ee419c140b2c97d7ab49529dba2ad2a92ca8970d11d10d8ec4d8b190025b1e64ff"};
            var val = test.encryption.is_encrypted(enc);
            expect(val).to.equal(true);
        });
        it('should return false if value is not encrypted', function() {
            var str = 'Unencrypted string';
            var val = test.encryption.is_encrypted(str);
            expect(val).to.equal(false);
        });
    });

    // encrypt()

    describe(test.function('encrypt'), function() {
        it('should return an encryption object when given a string and no uuid (use core uuid)', async function() {
            var val = await test.encryption.encrypt('This is a string');
            expect(val).to.be.an('object').and.to.have.property('iv').that.is.a('string').that.has.length(32)
        });
        it('should return an encryption object when given a string and a uuid', async function() {
            var uuid = test.encryption.new_uuid();
            var val = await test.encryption.encrypt('This is a string', uuid);
            expect(val).to.be.an('object').and.to.have.property('iv').that.is.a('string').that.has.length(32)
        });
        it('should return false if uuid is not valid (length not 32 or 36)', async function() {
            var uuid = 'not a valid uuid';
            var val = await test.encryption.encrypt('This is a string', uuid);
            expect(val).to.equal(false);
        });
    });

    // decrypt()

    describe(test.function('decrypt'), function() {
        it('should return a string when given an encrypted object and uuid', async function() {
            var enc = {iv: "3a46b094501b116fa7735a4f75adf4ae", content: "e4f84356e2e56975deff14e8014591c08de73b8ad1386a50df84bd34e7c695ee419c140b2c97d7ab49529dba2ad2a92ca8970d11d10d8ec4d8b190025b1e64ff"};
            var uuid = "bf2e01aa-cf4e-437b-b52c-f3ec765e900e";
            var val = await test.encryption.decrypt(enc, uuid);
            expect(val).to.equal('dFIsNPn0PO6oJKJqMcQFHTxlP4z9l2pj7VnTCK8wx9VnlmB3CCZOhheZMgEzqZAI')
        });
        it('should return the same value if given an unencrypted value', async function() {
            var str = 'Unencrypted string';
            var val = await test.encryption.decrypt(str);
            expect(val).to.equal(str);
        });
        it('should return garbage if decryption fails', async function() {
            var enc = {iv: "3a46b094501b116fa7735a4f75adf4AA", content: "e4f84356e2e56975deff14e8014591c08de73b8ad1386a50df84bd34e7c695ee419c140b2c97d7ab49529dba2ad2a92ca8970d11d10d8ec4d8b190025b1e64ff"};
            var uuid = "bf2e01aa-cf4e-437b-b52c-f3ec765e9AAA";
            var val = await test.encryption.decrypt(enc, uuid);
            expect(val).not.to.equal('dFIsNPn0PO6oJKJqMcQFHTxlP4z9l2pj7VnTCK8wx9VnlmB3CCZOhheZMgEzqZAI')
        });
        it('should return false if IV length is not 32', async function() {
            var enc = {iv: "3a46b094501b116fa7735a4f75adf4a", content: "e4f84356e2e56975deff14e8014591c08de73b8ad1386a50df84bd34e7c695ee419c140b2c97d7ab49529dba2ad2a92ca8970d11d10d8ec4d8b190025b1e64ff"};
            var uuid = "bf2e01aa-cf4e-437b-b52c-f3ec765e900e";
            var val = await test.encryption.decrypt(enc, uuid);
            expect(val).to.equal(false)
        });
    });



});
