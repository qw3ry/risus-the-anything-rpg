export class EntitySheetHelper {

    static getAttributeData(data) {

        // Determine attribute type.
        for (let attr of Object.values(data.system.attributes)) {
            if (attr.dtype) {
                attr.isCheckbox = attr.dtype === "Boolean";
                attr.isResource = attr.dtype === "Resource";
                attr.isCliche = attr.dtype === "Cliche";
                attr.isFormula = attr.dtype === "Formula";
            }
        }

        // Sort the remaining attributes.
        const keys = Object.keys(data.system.attributes);
        keys.sort((a, b) => a.localeCompare(b));
    }

    /* -------------------------------------------- */

    /** @override */
    static onSubmit(event) {
        // Closing the form/sheet will also trigger a submit, so only evaluate if this is an event.
        if (event.currentTarget) {
            // Exit early if this isn't a named attribute.
            if ((event.currentTarget.tagName.toLowerCase() === 'input') && !event.currentTarget.hasAttribute('name')) {
                return false;
            }

            let attr = false;
            // If this is the attribute key, we need to make a note of it so that we can restore focus when its recreated.
            const el = event.currentTarget;
            if (el.classList.contains("attribute-key")) {
                let val = el.value;
                let oldVal = el.closest(".attribute").dataset.attribute;
                let attrError = false;
                // Prevent attributes that already exist as groups.
                let groups = document.querySelectorAll('.group-key');
                for (let i = 0; i < groups.length; i++) {
                    if (groups[i].value === val) {
                        ui.notifications.error(game.i18n.localize("SIMPLE.NotifyAttrDuplicate") + ` (${val})`);
                        el.value = oldVal;
                        attrError = true;
                        break;
                    }
                }
                // Handle value and name replacement otherwise.
                if (!attrError) {
                    oldVal = oldVal.includes('.') ? oldVal.split('.')[1] : oldVal;
                    attr = $(el).attr('name').replace(oldVal, val);
                }
            }

            // Return the attribute key if set, or true to confirm the submission should be triggered.
            return attr ? attr : true;
        }
    }

    /* -------------------------------------------- */

    /**
     * Listen for click events on an attribute control to modify the composition of attributes in the sheet
     * @param {MouseEvent} event    The originating left click event
     */
    static async onClickAttributeControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const action = a.dataset.action;
        switch (action) {
            case "create":
                return EntitySheetHelper.createAttribute(event, this);
            case "delete":
                return EntitySheetHelper.deleteAttribute(event, this);
        }
    }

    /* -------------------------------------------- */

    /**
     * Listen for the roll button on attributes.
     * @param {MouseEvent} event    The originating left click event
     */
    static onAttributeRoll(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const label = button.attributes["data-label"].value ?? button.closest(".attribute").querySelector(".attribute-label")?.value;
        const chatLabel = label ?? button.parentElement.querySelector(".attribute-key").value;

        // Use the actor for rollData so that formulas are always in reference to the parent actor.
        const rollData = this.actor.getRollData();
        let formula = button.attributes["data-roll"].value; //button.closest(".attribute").querySelector(".attribute-value")?.value;

        // If there's a formula, attempt to roll it.
        if (formula) {
            // Create the roll and the corresponding message
            let r = new Roll(formula, rollData);
            return r.toMessage({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: `${chatLabel}`
            });
        }
    }

    static async onAttributeDecrease(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const key = button.attributes["data-key"].value;
        const value = this.actor.system.attributes[key].value - 1;
        const update = {}
        update[`system.attributes.${key}.value`] = value;
        await this.actor.update(update);
    }

    static async onAttributeReset(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const key = button.attributes["data-key"].value;
        const value = this.actor.system.attributes[key].max;
        const update = {}
        update[`system.attributes.${key}.value`] = value;
        await this.actor.update(update);
    }

    /* -------------------------------------------- */

    /**
     * Return HTML for a new attribute to be applied to the form for submission.
     *
     * @param {Object} items  Keyed object where each item has a "type" and "value" property.
     * @param {string} index  Numeric index or key of the new attribute.
     *
     * @returns {string} Html string.
     */
    static getAttributeHtml(items, index) {
        // Initialize the HTML.
        let result = '<div style="display: none;">';
        // Iterate over the supplied keys and build their inputs (including whether they need a group key).
        for (let [key, item] of Object.entries(items)) {
            result = result + `<input type="${item.type}" name="system.attributes.attr${index}.${key}" value="${item.value}"/>`;
        }
        // Close the HTML and return.
        return result + '</div>';
    }

    /* -------------------------------------------- */

    /**
     * Create new attributes.
     * @param {MouseEvent} event    The originating left click event
     * @param {Object} app          The form application object.
     * @private
     */
    static async createAttribute(event, app) {
        const a = event.currentTarget;
        let dtype = a.dataset.dtype;
        const attrs = app.object.system.attributes;
        const form = app.form;

        // Determine the new attribute key for ungrouped attributes.
        let objKeys = Object.keys(attrs);
        let nk = Object.keys(attrs).length + 1;
        let newValue = `attr${nk}`;
        let newKey = document.createElement("div");
        while (objKeys.includes(newValue)) {
            ++nk;
            newValue = `attr${nk}`;
        }

        // Build options for construction HTML inputs.
        let htmlItems = {
            key: {
                type: "text",
                value: newValue
            }
        };
        // Choose a default dtype based on the last attribute, fall back to "Cliche".
        if (!dtype) {
            let lastAttr = document.querySelector('.attributes > .attributes-group .attribute:last-child .attribute-dtype')?.value;
            dtype = lastAttr ? lastAttr : "Cliche";
            htmlItems.dtype = {
                type: "hidden",
                value: dtype
            };
        }

        // Build the form elements used to create the new grouped attribute.
        newKey.innerHTML = EntitySheetHelper.getAttributeHtml(htmlItems, nk);

        // Append the form element and submit the form.
        newKey = newKey.children[0];
        form.appendChild(newKey);
        await app._onSubmit(event);
    }

    /**
     * Delete an attribute.
     * @param {MouseEvent} event    The originating left click event
     * @param {Object} app          The form application object.
     * @private
     */
    static async deleteAttribute(event, app) {
        const a = event.currentTarget;
        const li = a.closest(".attribute");
        if (li) {
            li.parentElement.removeChild(li);
            await app._onSubmit(event);
        }
    }

    /* -------------------------------------------- */

    /**
     * Update attributes when updating an actor object.
     * @param {object} formData       The form data object to modify keys and values for.
     * @param {Document} document     The Actor or Item document within which attributes are being updated
     * @returns {object}              The updated formData object.
     */
    static updateAttributes(formData, document) {
        // Handle the free-form attributes list
        const formAttrs = foundry.utils.expandObject(formData)?.system?.attributes || {};
        const attributes = Object.values(formAttrs).reduce((obj, v) => {
            const k = this.cleanKey(v["key"].trim());
            delete v["key"];
            obj[k] = v;
            return obj;
        }, {});

        // Remove attributes which are no longer used
        for (let k of Object.keys(document.system.attributes)) {
            if (!attributes.hasOwnProperty(k)) attributes[`-=${k}`] = null;
        }

        // Re-combine formData
        formData = Object.entries(formData).filter(e => !e[0].startsWith("system.attributes")).reduce((obj, e) => {
            obj[e[0]] = e[1];
            return obj;
        }, {_id: document.id, "system.attributes": attributes});

        return formData;
    }

    /* -------------------------------------------- */

    /**
     * @see ClientDocumentMixin.createDialog
     */
    static async createDialog(data = {}, options = {}) {

        // Collect data
        const documentName = this.metadata.name;
        const folders = game.folders.filter(f => (f.type === documentName) && f.displayed);
        const label = game.i18n.localize(this.metadata.label);
        const title = game.i18n.format("DOCUMENT.Create", {type: label});

        // Identify the template Actor types
        const collection = game.collections.get(this.documentName);
        const templates = collection.filter(a => a.getFlag("risus-the-anything-rpg", "isTemplate"));
        const defaultType = this.TYPES.filter(t => t !== CONST.BASE_DOCUMENT_TYPE)[0] ?? CONST.BASE_DOCUMENT_TYPE;
        const types = {
            [defaultType]: game.i18n.localize("SIMPLE.NoTemplate")
        }
        for (let a of templates) {
            types[a.id] = a.name;
        }

        // Render the document creation form
        const template = "templates/sidebar/document-create.html";
        const html = await renderTemplate(template, {
            name: data.name || game.i18n.format("DOCUMENT.New", {type: label}),
            folder: data.folder,
            folders: folders,
            hasFolders: folders.length > 1,
            type: data.type || templates[0]?.id || "",
            types: types,
            hasTypes: true
        });

        // Render the confirmation dialog window
        return Dialog.prompt({
            title: title,
            content: html,
            label: title,
            callback: html => {

                // Get the form data
                const form = html[0].querySelector("form");
                const fd = new FormDataExtended(form);
                let createData = fd.object;

                // Merge with template data
                const template = collection.get(form.type.value);
                if (template) {
                    createData = foundry.utils.mergeObject(template.toObject(), createData);
                    createData.type = template.type;
                    delete createData.flags["risus-the-anything-rpg"].isTemplate;
                }

                // Merge provided override data
                createData = foundry.utils.mergeObject(createData, data, {inplace: false});
                return this.create(createData, {renderSheet: true});
            },
            rejectClose: false,
            options: options
        });
    }

    /* -------------------------------------------- */

    /**
     * Ensure the resource values are within the specified min and max.
     * @param {object} attrs  The Document's attributes.
     */
    static clampResourceValues(attrs) {
        const flat = foundry.utils.flattenObject(attrs);
        for (const [attr, value] of Object.entries(flat)) {
            const parts = attr.split(".");
            if (parts.pop() !== "value") continue;
            const current = foundry.utils.getProperty(attrs, parts.join("."));
            if (current?.dtype !== "Resource") continue;
            foundry.utils.setProperty(attrs, attr, Math.clamped(value, current.min || 0, current.max || 0));
        }
    }

    /* -------------------------------------------- */

    /**
     * Clean an attribute key, emitting an error if it contained invalid characters.
     * @param {string} key  The key to clean.
     * @returns {string}
     */
    static cleanKey(key) {
        const clean = key.replace(/[\s.]/g, "");
        if (clean !== key) ui.notifications.error("SIMPLE.NotifyAttrInvalid", {localize: true});
        return clean;
    }
}
