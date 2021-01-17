// ================================================================================
//  Frostybot Unit Tests: Helper Functions (mod.utils.js)
// ================================================================================

// Load all modules

const core_test = require('../core/core.test');
const test = new core_test();

// Load Unit Test Modules

var chai = require('chai');
var expect = chai.expect

// Unit Test Definitions


describe(test.title('Helper Functions (mod.utils.js)'), function() {

    // is_json()

    describe(test.function('is_json'), function() {
        it('should return true if value is JSON', function() {
            var val = JSON.stringify({a: 1, b: 2, c: 3 })
            expect(test.utils.is_json(val)).to.equal(true);
        });
        it('should return false if value is not JSON', function() {
            var val = "This is a string";
            expect(test.utils.is_json(val)).to.equal(false);
        });
    });

    // is_string()

    describe(test.function('is_string'), function() {
        it('should return true if value is a string', function() {
            var val = "This is a string";
            expect(test.utils.is_string(val)).to.equal(true);
        });
        it('should return false if value is an object', function() {
            var val = {a: 1, b: 2, c: 3 };
            expect(test.utils.is_string(val)).to.equal(false);
        });
        it('should return false if value is an array', function() {
            var val = [1, 2, 3];
            expect(test.utils.is_string(val)).to.equal(false);
        });
        it('should return false if value is boolean', function() {
            var val = false;
            expect(test.utils.is_string(val)).to.equal(false);
        });
        it('should return false if value is null', function() {
            var val = null;
            expect(test.utils.is_string(val)).to.equal(false);
        });
        it('should return false if value is undefined', function() {
            var val = undefined;
            expect(test.utils.is_string(val)).to.equal(false);
        });
    });

    // is_bool()

    describe(test.function('is_bool'), function() {
        it('should return true if value is boolean', function() {
            var val = true;
            expect(test.utils.is_bool(val)).to.equal(true);
        });
        it('should return false if value is not boolean', function() {
            var val = "This is a string";
            expect(test.utils.is_bool(val)).to.equal(false);
        });
    });

    // is_numeric()

    describe(test.function('is_numeric'), function() {
        it('should return true if value is numeric', function() {
            var val = 123;
            expect(test.utils.is_numeric(val)).to.equal(true);
        });
        it('should return false if value is not numeric', function() {
            var val = "This is a string";
            expect(test.utils.is_numeric(val)).to.equal(false);
        });
    });

    // is_true()

    describe(test.function('is_true'), function() {
        it('should return true if value is true', function() {
            var val = true;
            expect(test.utils.is_true(val)).to.equal(true);
        });
        it('should return false if value is not true', function() {
            var val = "This is a string";
            expect(test.utils.is_true(val)).to.equal(false);
        });
    });

    // is_false()

    describe(test.function('is_false'), function() {
        it('should return true if value is false', function() {
            var val = false;
            expect(test.utils.is_false(val)).to.equal(true);
        });
        it('should return false if value is not false', function() {
            var val = "This is a string";
            expect(test.utils.is_false(val)).to.equal(false);
        });
    });

    // is_object()

    describe(test.function('is_object'), function() {
        it('should return true if value is an object', function() {
            var val = {a: 1, b: 2, c: 3 };
            expect(test.utils.is_object(val)).to.equal(true);
        });
        it('should return false if value is not an object', function() {
            var val = "This is a string";
            expect(test.utils.is_object(val)).to.equal(false);
        });
    });

    // is_array()

    describe(test.function('is_array'), function() {
        it('should return true if value is an array', function() {
            var val = [1, 2, 3];
            expect(test.utils.is_array(val)).to.equal(true);
        });
        it('should return false if value is not an array', function() {
            var val = "This is a string";
            expect(test.utils.is_array(val)).to.equal(false);
        });
    });

    // is_empty()

    describe(test.function('is_empty'), function() {
        it('should return true if value is null', function() {
            var val = null;
            expect(test.utils.is_empty(val)).to.equal(true);
        });
        it('should return true if value is an empty string', function() {
            var val = "";
            expect(test.utils.is_empty(val)).to.equal(true);
        });
        it('should return true if value is an empty object', function() {
            var val = {};
            expect(test.utils.is_empty(val)).to.equal(true);
        });
        it('should return true if value is an empty array', function() {
            var val = [];
            expect(test.utils.is_empty(val)).to.equal(true);
        });
        it('should return false if value is not null', function() {
            var val = 0;
            expect(test.utils.is_empty(val)).to.equal(false);
        });
        it('should return false if value is not an empty string', function() {
            var val = "This is a string";
            expect(test.utils.is_empty(val)).to.equal(false);
        });
        it('should return false if value is not an empty object', function() {
            var val = {a: 1, b: 2, c: 3 };
            expect(test.utils.is_empty(val)).to.equal(false);
        });
        it('should return false if value is not an empty array', function() {
            var val = [1, 2, 3];
            expect(test.utils.is_empty(val)).to.equal(false);
        });
    });

    // is_ip()

    describe(test.function('is_ip'), function() {
        it('should return true if value is a valid IPv4 address', function() {
            var val = '192.168.1.1';
            expect(test.utils.is_ip(val)).to.equal(true);
        });
        it('should return true if value is a valid IPv6 address', function() {
            var val = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
            expect(test.utils.is_ip(val)).to.equal(true);
        });
        it('should return false if value is not a valid IPv4 address', function() {
            var val = "257.1.1.1";
            expect(test.utils.is_ip(val)).to.equal(false);
        });
        it('should return false if value is not a valid IPv6 address', function() {
            var val = "h001:0db8:85a3:0000:0000:8a2e:0370:7334";
            expect(test.utils.is_ip(val)).to.equal(false);
        });
    });

    // force_array()

    describe(test.function('force_array'), function() {
        it('should return the same array if value is an array', function() {
            var val = [1, 2, 3];
            expect(test.utils.force_array(val)).to.be.an('array').that.has.length(3);
        });
        it('should return an array of length 1 if value is a string', function() {
            var val = "This is a string";
            expect(test.utils.force_array(val)).to.be.an('array').that.has.length(1);
        });
        it('should return an array of length 1 if value is an object', function() {
            var val = {a: 1, b: 2, c: 3 };
            expect(test.utils.force_array(val)).to.be.an('array').that.has.length(1);
        });
    });

    // missing_props()

    describe(test.function('missing_props'), function() {
        it('should return empty array if object is not missing any of the supplied properties', function() {
            var val = {a: 1, b: 2, c: 3};
            expect(test.utils.missing_props(val, ['a', 'b', 'c'])).to.be.an('array').that.has.length(0);
        });
        it('should return an array of properties missing from the supplied object', function() {
            var val = {a: 1, b: 2, c: 3};
            expect(test.utils.missing_props(val, ['a', 'e', 'f'])).to.be.an('array').that.has.length(2);
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.missing_props(val, ['a', 'e', 'f'])).to.equal(false);
        });
    });

    // lower_props()

    describe(test.function('lower_props'), function() {
        it('should return supplied object with lowercase properties', function() {
            var val = {A: 1, B: 2, C: 3, D: {E: 4, F: 5}};
            expect(test.utils.lower_props(val)).to.have.property('d').that.is.a('object')
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.lower_props(val)).to.equal(false);
        });
    });

    // encrypt_values()

    describe(test.function('encrypt_values'), function() {
        it('should return supplied object with specified values encrypted', async function() {
            var val = {id: 1, username: 'test', password: 'encrypt this'};
            var encrypt = await test.utils.encrypt_values(val, ['password']);
            expect(encrypt.password).to.have.property('iv')
        });
        it('should return given value if it is not an object', async function() {
            var val = [1, 2, 3];
            expect(await test.utils.encrypt_values(val)).to.equal(val);
        });
    });

    // decrypt_values()

    describe(test.function('decrypt_values'), function() {
        it('should return supplied object with specified values decrypted', async function() {
            var password = 'encrypt this';
            var val = {id: 1, username: 'test', password: password};
            var encrypt = await test.utils.encrypt_values(val, ['password']);
            var decrypt = await test.utils.decrypt_values(encrypt, ['password'])
            expect(decrypt.password).to.equal(password);
        });
        it('should return given value if it is not an object', async function() {
            var val = [1, 2, 3];
            expect(await test.utils.decrypt_values(val)).to.equal(val);
        });
    });

    // trim_values()

    describe(test.function('trim_values'), function() {
        it('should return supplied object with trimmed values', function() {
            var val = {a: '  abc  ', b: ' abc', c: 'abc ', d: 'abc'};
            var result = test.utils.trim_values(val);
            expect(result).to.include({a: 'abc', b: 'abc', c: 'abc', d: 'abc'});
        });
        it('should return given value if it is not an object', async function() {
            var val = [1, 2, 3];
            expect(await test.utils.trim_values(val)).to.equal(val);
        });
    });

    // remove_props()

    describe(test.function('remove_props'), function() {
        it('should return supplied object with given properties removed', function() {
            var val = {a: 'abc', b: 'abc', c: 'abc', d: 'abc'};
            var result = test.utils.remove_props(val, ['b', 'd']);
            expect(result).to.not.include({b: 'abc', d: 'abc'});
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.remove_props(val, ['b', 'd'])).to.equal(false);
        });
    });

    // remove_values()

    describe(test.function('remove_values'), function() {
        it('should return supplied object with given values removed', function() {
            var val = {a: 'abc', b: '123', c: 'abc', d: '123'};
            var result = test.utils.remove_values(val, ['123']);
            expect(result).to.not.include({b: '123', d: '123'});
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.remove_values(val, ['123'])).to.equal(false);
        });
    });

    // clean_object()

    describe(test.function('clean_object'), function() {
        it('should return supplied object with given properties lowercased and values trimmed', function() {
            var val = {A: ' abc ', b: ' 123', C: 'abc ', d: '123'};
            var result = test.utils.clean_object(val);
            expect(result).to.include({a: 'abc', b: '123', c: 'abc', d: '123'});
        });
        it('should return given value if it is not an object', async function() {
            var val = [1, 2, 3];
            expect(await test.utils.clean_object(val)).to.equal(val);
        });
    });
    
    // censor_props()

    describe(test.function('censor_props'), function() {
        it('should return supplied object with given properties censored', function() {
            var val = {a: 'abc', b: '123', c: 'abc', d: '123'};
            var result = test.utils.censor_props(val, ['b', 'd']);
            expect(result).to.include({a: 'abc', b: '**********', c: 'abc', d: '**********'});
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.censor_props(val, ['a'])).to.equal(false);
        });
    });

    // filter_objects()

    describe(test.function('filter_objects'), function() {
        it('should return supplied array of objects filtered by given property values', function() {
            var val = [
                        {a: 'abc', b: '123', c: 'abc', d: '123'},
                        {a: 'def', b: '456', c: 'def', d: '456'},
                        {a: 'ghi', b: '123', c: 'ghi', d: '123'},
                        {a: 'jkl', b: '456', c: 'jkl', d: '456'},
            ];
            var result = test.utils.filter_objects(val, {b: 123});
            expect(result).to.be.an.instanceof(Array).and.to.have.lengthOf(2);
        });
        it('should return false if supplied value is not an array', function() {
            var val = {a: 'abc', b: '123', c: 'abc', d: '123'};
            expect(test.utils.filter_objects(val, {b: 123})).to.equal(false);
        });
    });

    // extract_props()

    describe(test.function('extract_props'), function() {
        it('should return array of values with the given keys from the supplied object', function() {
            var val = {a: 'abc', b: '123', c: 'abc', d: '123'};
            var result = test.utils.extract_props(val, ['b', 'd']);
            expect(result).to.be.an.instanceof(Array).and.to.have.lengthOf(2);
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.extract_props(val, ['a'])).to.equal(false);
        });
    });

    // base_dir()

    describe(test.function('base_dir'), function() {
        it('should return string containing "/" and with length more than 5', function() {
            expect(test.utils.base_dir()).to.have.string('/').and.to.have.lengthOf.above(5);
        });
    });

    // num_decimals()

    describe(test.function('num_decimals'), function() {
        it('0.001 should return integer 3', function() {
            expect(test.utils.num_decimals(0.001)).to.equal(3);
        });
        it('-0.1 should return integer 1', function() {
            expect(test.utils.num_decimals(-0.1)).to.equal(1);
        });
        it('5 should return integer 0', function() {
            expect(test.utils.num_decimals(5)).to.equal(0);
        });
        it('-6 should return integer 0', function() {
            expect(test.utils.num_decimals(-6)).to.equal(0);
        });
        it('"5.67" should return integer 2', function() {
            expect(test.utils.num_decimals('5.67')).to.equal(2);
        });
        it('should return false if value is not a number', function() {
            expect(test.utils.num_decimals('abc')).to.equal(false);
        });
    });

    // serialize_object()

    describe(test.function('serialize_object'), function() {
        it('should return a serialized string representation of the supplied object', function() {
            var val = {a: 'abc', b: '123', c: {d: 'abc', e: '123'}};
            var result = test.utils.serialize_object(val);
            expect(result).to.equal('{a: abc, b: 123, c: {d: abc, e: 123}}');
        });
        it('should return false if supplied value is not an object', function() {
            var val = [1, 2, 3];
            expect(test.utils.serialize_object(val)).to.equal(false);
        });
    });

    // serialize_array()

    describe(test.function('serialize_array'), function() {
        it('should return a serialized string representation of the supplied array', function() {
            var val = ['abc', '123', 'def', '456'];
            var result = test.utils.serialize_array(val);
            expect(result).to.equal('[abc, 123, def, 456]');
        });
        it('should return false if supplied value is not an array', function() {
            var val = {a: 'abc', b: '123', c: {d: 'abc', e: '123'}};
            expect(test.utils.serialize_array(val)).to.equal(false);
        });
    });

    // serialize()

    describe(test.function('serialize'), function() {
        it('should return a serialized string representation of the supplied object', function() {
            var val = {a: 'abc', b: '123', c: {d: 'abc', e: '123'}};
            var result = test.utils.serialize(val);
            expect(result).to.equal('{a: abc, b: 123, c: {d: abc, e: 123}}');
        });
        it('should return a serialized string representation of the supplied array', function() {
            var val = ['abc', '123', 'def', '456'];
            var result = test.utils.serialize(val);
            expect(result).to.equal('[abc, 123, def, 456]');
        });
        it('should return a serialized string representation of the supplied string', function() {
            var val = "Test String";
            var result = test.utils.serialize(val);
            expect(result).to.equal('Test String');
        });
        it('should return a serialized string representation of the supplied number', function() {
            var val = 123.45;
            var result = test.utils.serialize(val);
            expect(result).to.equal('123.45');
        });
        it('should return false if supplied value is not an object, array, string or number', function() {
            var val = false;
            expect(test.utils.serialize(val)).to.equal(false);
        });
    });


    // uppercase_values()

    describe(test.function('uppercase_values'), function() {
        it('should return object with all values uppercased if no filter supplied', function() {
            var val = {a: 'abc', b: '123', c: 'def', d: '123', e: 'ghi', f: {g: 'jkl', h: 456, i: 'mno'}};
            var result = test.utils.uppercase_values(val);
            expect(result).to.include({a: 'ABC', b: '123', c: 'DEF', d: '123', e: 'GHI'}).and.to.have.property('f').that.includes({g: 'JKL', h: 456, i: 'MNO'});
        });
        it('should return object with given values uppercased if filter supplied', function() {
            var val = {a: 'abc', b: '123', c: 'def', d: '123', e: 'ghi', f: {g: 'jkl', h: 456, i: 'mno'}};
            var result = test.utils.uppercase_values(val, ['a', 'e', 'i']);
            expect(result).to.include({a: 'ABC', b: '123', c: 'def', d: '123', e: 'GHI'}).and.to.have.property('f').that.includes({g: 'jkl', h: 456, i: 'MNO'});
        });
        it('should just return given value if it is not an object', function() {
            var str = "This is a string";
            var result = test.utils.uppercase_values(str);
            expect(result).to.equal(str);
        });

    });

    // lowercase_values()

    describe(test.function('lowercase_values'), function() {
        it('should return object with all values lowercased if no filter supplied', function() {
            var val = {a: 'ABC', b: '123', c: 'DEF', d: '123', e: 'GHI', f: {g: 'JKL', h: 456, i: 'MNO'}};
            var result = test.utils.lowercase_values(val);
            expect(result).to.include({a: 'abc', b: '123', c: 'def', d: '123', e: 'ghi'}).and.to.have.property('f').that.includes({g: 'jkl', h: 456, i: 'mno'});
        });
        it('should return object with given values lowercased if filter supplied', function() {
            var val = {a: 'ABC', b: '123', c: 'DEF', d: '123', e: 'GHI', f: {g: 'JKL', h: 456, i: 'MNO'}};
            var result = test.utils.lowercase_values(val, ['a', 'e', 'i']);
            expect(result).to.include({a: 'abc', b: '123', c: 'DEF', d: '123', e: 'ghi'}).and.to.have.property('f').that.includes({g: 'JKL', h: 456, i: 'mno'});
        });
        it('should just return given value if it is not an object', function() {
            var str = "This is a string";
            var result = test.utils.lowercase_values(str);
            expect(result).to.equal(str);
        });

    });

    // uc_first()

    describe(test.function('uc_first'), function() {
        it('should return the provided string with the first word capitalized', function() {
            var val = 'abc def ghi';
            var result = test.utils.uc_first(val);
            expect(result).to.equal('Abc def ghi');
        });
        it('should return false if supplied value is not a string', function() {
            var val = 123;
            expect(test.utils.uc_first(val)).to.equal(false);
        });
    });

    // uc_words()

    describe(test.function('uc_words'), function() {
        it('should return the provided string with all words capitalized', function() {
            var val = 'abc def ghi';
            var result = test.utils.uc_words(val);
            expect(result).to.equal('Abc Def Ghi');
        });
        it('should return false if supplied value is not a string', function() {
            var val = 123;
            expect(test.utils.uc_words(val)).to.equal(false);
        });
    });

    // validator()

    describe(test.function('validator'), function() {
        it('should return lowercased params if required schema property exists', function() {
            var params = { test1: 'ABC', test2: 123 }
            var schema = { test1: { required: 'string', format: 'lowercase' }}    
            var result = test.utils.validator(params, schema); 
            expect(result).to.include({test1: 'abc'});
        });
        it('should return params if required schema property contains one of a specified list', function() {
            var params = { test1: 'ABC', test2: 123 }
            var schema = { test1: { required: 'string', format: 'lowercase', oneof: ['abc', '123'] }}    
            var result = test.utils.validator(params, schema); 
            expect(result).to.include({test1: 'abc'});
        });
        it('should return lowercased params if optional schema property exists', function() {
            var params = { test1: 'ABC', test2: 123 }
            var schema = { test1: { optional: 'string', format: 'lowercase' }}    
            var result = test.utils.validator(params, schema); 
            expect(result).to.include({test1: 'abc'});
        });
        it('should return lowercased params if optional schema property does not exist', function() {
            var params = { test2: 123 }
            var schema = { test1: { optional: 'string', format: 'lowercase' }}    
            var result = test.utils.validator(params, schema); 
            expect(result).to.include({test2: 123});
        });
        it('should return false if required schema property does not exist', function() {
            var params = { test1: 'ABC', test2: 123 }
            var schema = { othername: { required: 'string', format: 'lowercase' }}    
            var result = test.utils.validator(params, schema); 
            expect(result).to.equal(false);
        });
        it('should return false if required schema property is not one of a specified list', function() {
            var params = { test1: 'ABC', test2: 123 }
            var schema = { test1: { required: 'string', format: 'lowercase', oneof: ['def', '123'] }}    
            var result = test.utils.validator(params, schema); 
            expect(result).to.equal(false);
        });
    });

});
