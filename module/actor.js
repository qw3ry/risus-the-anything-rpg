import {EntitySheetHelper} from "./helper.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class SimpleActor extends Actor {

    /** @inheritdoc */
    prepareDerivedData() {
        super.prepareDerivedData();
        this.system.attributes = this.system.attributes || {};
        EntitySheetHelper.clampResourceValues(this.system.attributes);
    }

    /* -------------------------------------------- */

    /** @override */
    static async createDialog(data = {}, options = {}) {
        return EntitySheetHelper.createDialog.call(this, data, options);
    }

    /* -------------------------------------------- */

    /**
     * Is this Actor used as a template for other Actors?
     * @type {boolean}
     */
    get isTemplate() {
        return !!this.getFlag("risus-the-anything-rpg", "isTemplate");
    }

    /* -------------------------------------------- */
    /*  Roll Data Preparation                       */

    /* -------------------------------------------- */

    /** @inheritdoc */
    getRollData() {

        // Copy the actor's system data
        const data = this.toObject(false).system;
        const shorthand = game.settings.get("risus-the-anything-rpg", "macroShorthand");
        const formulaAttributes = [];
        const clicheAttributes = [];

        // Handle formula attributes when the short syntax is disabled.
        this._applyShorthand(data, formulaAttributes, clicheAttributes, shorthand);

        // Evaluate formula attributes after all other attributes have been handled, including items.
        this._applyFormulaReplacements(data, formulaAttributes, clicheAttributes, shorthand);

        // Remove the attributes if necessary.
        if (!!shorthand) {
            delete data.attributes;
            delete data.attr;
        }
        return data;
    }

    /* -------------------------------------------- */

    /**
     * Apply shorthand syntax to actor roll data.
     * @param {Object} data The actor's data object.
     * @param {Array} formulaAttributes Array of attributes that are derived formulas.
     * @param {Array} clicheAttributes Array of attributes that are cliches.
     * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
     */
    _applyShorthand(data, formulaAttributes, clicheAttributes, shorthand) {
        // Handle formula attributes when the short syntax is disabled.
        for (let [k, v] of Object.entries(data.attributes || {})) {
            // Make an array of formula attributes for later reference.
            if (v.dtype === "Formula") formulaAttributes.push(k);
            else if (v.dtype === "Cliche") clicheAttributes.push(k);
            // Add shortened version of the attributes.
            if (!!shorthand) {
                if (!(k in data)) {
                    data[k] = v.value;
                }
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Apply replacements for derived formula attributes.
     * @param {Object} data The actor's data object.
     * @param {Array} formulaAttributes Array of attributes that are derived formulas.
     * @param {Array} clicheAttributes Array of attributes that are cliches.
     * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
     */
    _applyFormulaReplacements(data, formulaAttributes, clicheAttributes, shorthand) {
        // Evaluate formula attributes after all other attributes have been handled, including items.
        for (let k of formulaAttributes) {
            data.attributes[k].value = Roll.replaceFormulaData(String(data.attributes[k].value), data);

            // Duplicate values to shorthand.
            if (!!shorthand) {
                data[k] = data.attributes[k].value;
            }
        }
        // Evaluate formula attributes after all other attributes have been handled, including items.
        for (let k of clicheAttributes) {
            data.attributes[k].value = String(data.attributes[k].value + "d6x");

            // Duplicate values to shorthand.
            if (!!shorthand) {
                data[k] = data.attributes[k].value;
            }
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
        const current = foundry.utils.getProperty(this.system, attribute);
        if (!isBar || !isDelta || (current?.dtype !== "Resource")) {
            return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
        }
        const updates = {[`system.${attribute}.value`]: Math.clamped(current.value + value, current.min, current.max)};
        const allowed = Hooks.call("modifyTokenAttribute", {attribute, value, isDelta, isBar}, updates);
        return allowed !== false ? this.update(updates) : this;
    }
}
