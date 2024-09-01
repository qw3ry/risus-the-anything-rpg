import RisusItemBase from './base-item.mjs';

export default class RisusCliche extends RisusItemBase {
    static LOCALIZATION_PREFIXES = [
        'RISUS.Item.base',
        'RISUS.Item.Cliche',
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = {required: true, nullable: false, integer: true};
        const schema = super.defineSchema();

        // Break down roll formula into three independent fields
        schema.roll = new fields.NumberField({
            ...requiredInteger,
            initial: 1,
            min: 1,
        });

        schema.formula = new fields.StringField({blank: true});

        return schema;
    }

    prepareDerivedData() {
        // Build the formula dynamically using string interpolation
        this.formula = `${(this.roll)}d6x6`;
    }
}
