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

    return schema;
  }

  prepareDerivedData() {
  }

  getRollData() {
    const data = {};

    return data;
  }
}
