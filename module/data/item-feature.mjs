import RisusItemBase from './base-item.mjs';

export default class RisusFeature extends RisusItemBase {
    static LOCALIZATION_PREFIXES = [
        'RISUS.Item.base',
        'RISUS.Item.Feature',
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = {required: true, nullable: false, integer: true};
        const schema = super.defineSchema();

        schema.quantity = new fields.NumberField({
            ...requiredInteger,
            initial: 1,
            min: 1,
        });
        schema.weight = new fields.NumberField({
            required: true,
            nullable: false,
            initial: 0,
            min: 0,
        });

        // Break down roll formula into three independent fields
        schema.roll = new fields.NumberField({
            ...requiredInteger,
            initial: 1,
            min: 1
        });

        schema.formula = new fields.StringField({blank: true});

        return schema;
    }

    prepareDerivedData() {
        // Build the formula dynamically using string interpolation
        const roll = this.roll;

        this.formula = `${roll}d6x6`;
    }
}
