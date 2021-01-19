// ================================================================================
//  Frostybot Unit Tests: Multi-User Module (mod.multiuser.js)
// ================================================================================

// Load all modules

const core_test = require('../core/core.test');
const test = new core_test();

// Load Unit Test Modules

var chai = require('chai');
var expect = chai.expect

// Unit Test Definitions


describe(test.title('Multi-User Module (mod.multiuser.js)'), function() {

    // is_enabled()

    describe(test.function('is_enabled'), function() {
        it('should return true in multitenancy is enabled', async function() {
            var save = await test.settings.set('core', 'multiuser:enabled', false);
            await test.settings.set('core', 'multiuser:enabled', true);
            var val = await test.multiuser.is_enabled();
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(true);
        });
        it('should return false in multitenancy is disabled', async function() {
            var save = await test.settings.set('core', 'multiuser:enabled', false);
            await test.settings.set('core', 'multiuser:enabled', false);
            var val = await test.multiuser.is_enabled();
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(false);
        });
        
    });

    // enable()

    describe(test.function('enable'), function() {
        it('should return master user uuid in once multiuser mode is enabled', async function() {
            var save = await test.settings.get('core', 'multiuser:enabled', false);
            var url = await test.settings.get('core', 'auth:url', '_');
            var clientid = await test.settings.get('core', 'auth:clientid', '_');
            var secret = await test.settings.get('core', 'auth:secret', '_');
            var uuid = await test.encryption.core_uuid();
            var result = await test.database.select('tenants', {uuid: uuid});
            var email = result.length == 1 ? result[0].email : '_';
            await test.settings.set('core', 'multiuser:enabled', false);
            var val = await test.multiuser.enable({email: email, url: url, clientid: clientid, secret: secret});
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.be.a('string').that.has.length(36);
        });        
    });

    // disable()

    describe(test.function('disable'), function() {
        it('should return true in once multiuser mode is disabled', async function() {
            var save = await test.settings.set('core', 'multiuser:enabled', false);
            await test.settings.set('core', 'multiuser:enabled', false);
            var val = await test.multiuser.disable();
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(true);
        });        
    });

    // add()

    describe(test.function('add'), function() {
        it('should return user uuid once the user is added', async function() {
            var val = await test.multiuser.add({email: 'unittest@frostybot.io'});
            expect(val).to.be.a('string').that.has.length(36);
        });        
    });

    // delete()

    describe(test.function('delete'), function() {
        it('should return true once the user is deleted', async function() {
            var uuid = await test.multiuser.add({email: 'unittest@frostybot.io'});
            var val = await test.multiuser.delete({uuid: uuid});
            expect(val).to.equal(true);
        });        
        it('should return false if user does not exist', async function() {
            var val = await test.multiuser.delete({uuid: 'noexistant'});
            expect(val).to.equal(false);
        });        
    });



});
