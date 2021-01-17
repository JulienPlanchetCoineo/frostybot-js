// ================================================================================
//  Frostybot Unit Tests: Config Module (mod.config.js)
// ================================================================================

// Load all modules

const core_test = require('../core/core.test');
const test = new core_test();

// Load Unit Test Modules

var chai = require('chai');
var expect = chai.expect

// Unit Test Definitions


describe(test.title('Config Module (mod.config.js)'), function() {

    // get()

    describe(test.function('get'), function() {
        it('should return false if setting unconfigured', async function() {
            await test.config.delete({key: 'dummy:unittest'});
            var val = await test.config.get({key: 'dummy:unittest'});
            expect(val).to.equal(false);
        });
        it('should return false if setting key invalid', async function() {
            var val = await test.config.get({key: 'invalidkey'});
            expect(val).to.equal(false);
        });
        it('should return configuration setting if configured', async function() {
            if (await test.config.set({key: 'dummy:unittest', value: "This is a string"}))
                var val = await test.config.get({key: 'dummy:unittest'});
            else
                var val = 'Failed to set';
            expect(val).to.equal("This is a string");
        });
    });

    // set()

    describe(test.function('set'), function() {
        it('should return false if setting key invalid', async function() {
            var val = await test.config.set({key: 'invalidkey', value: '123'});
            expect(val).to.equal(false);
        });
        it('should return true if configuration setting successfully configured', async function() {
            var val = await test.config.set({key: 'dummy:unittest', value: "This is a string"});
            await test.config.delete({key: 'dummy:unittest'});
            expect(val).to.equal(true);
        });
    });


});
