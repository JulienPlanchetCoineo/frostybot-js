// Frostybot Module Base Class

module.exports = class frostybot_module_base {

    // Constructor

    constructor() {
    }

    // Create Module Mappings

    module_maps() {
        const modname = this.constructor.name.replace('frostybot_','').replace('_module','')
        Object.keys(global.frostybot._modules_).forEach(module => {
            if (!['core', modname].includes(module)) {
                this[module] = global.frostybot._modules_[module];
            }
        })
    }

    // Create a module link

    link(module) {
        this[module] = global.frostybot._modules_[module];
    }


}