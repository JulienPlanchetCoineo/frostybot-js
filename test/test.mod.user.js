// ================================================================================
//  Frostybot Unit Tests: Multi-User Module (mod.user.js)
// ================================================================================

// Load all modules

const core_test = require('../core/core.test');
const test = new core_test();

// Load Unit Test Modules

var chai = require('chai');
var expect = chai.expect

// Unit Test Definitions


describe(test.title('User Module (mod.user.js)'), function() {

    // multiuser_isenabled()

    describe(test.function('multiuser_isenabled'), function() {
        it('should return true in multi-user mode is enabled', async function() {
            var save = await test.settings.set('core', 'multiuser:enabled', false);
            await test.settings.set('core', 'multiuser:enabled', true);
            var val = await test.user.multiuser_isenabled();
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(true);
        });
        it('should return false in multi-user mode is disabled', async function() {
            var save = await test.settings.set('core', 'multiuser:enabled', false);
            await test.settings.set('core', 'multiuser:enabled', false);
            var val = await test.user.multiuser_isenabled();
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(false);
        });
        
    });

    // multiuser_enable()

    describe(test.function('multiuser_enable'), function() {
        it('should return master user uuid in once multiuser mode is enabled', async function() {
            var save = await test.settings.get('core', 'multiuser:enabled', false);
            var uuid = await test.encryption.core_uuid();
            var result = await test.database.select('users', {uuid: uuid});
            if (result.length == 1) {
                var email = result[0].email;
                var password = await test.encryption.decrypt(JSON.parse(result[0].password));
            } else {
                var email = '_';
                var password = '_';
            }
            await test.settings.set('core', 'multiuser:enabled', false);
            var val = await test.user.multiuser_enable({email: email, password: password});
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(true);
        });        
    });

    // multiuser_disable()

    describe(test.function('multiuser_disable'), function() {
        it('should return true in once multiuser mode is disabled', async function() {
            var save = await test.settings.set('core', 'multiuser:enabled', false);
            await test.settings.set('core', 'multiuser:enabled', false);
            var val = await test.user.multiuser_disable();
            await test.settings.set('core', 'multiuser:enabled', save);
            expect(val).to.equal(true);
        });        
    });



});
