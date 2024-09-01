import RisusActorBase from './base-actor.mjs';

export default class RisusCharacter extends RisusActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'RISUS.Actor.Character',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.hook = new fields.HTMLField();
    schema.tale = new fields.HTMLField();

    return schema;
  }

  prepareDerivedData() {
  }

  getRollData() {
    const data = {};

    return data;
  }
}
