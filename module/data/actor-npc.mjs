import RisusActorBase from './base-actor.mjs';

export default class RisusNpc extends RisusActorBase {
    static LOCALIZATION_PREFIXES = [
        ...super.LOCALIZATION_PREFIXES,
        'RISUS.Actor.Npc',
    ];

    static defineSchema() {
        return super.defineSchema();
    }

    prepareDerivedData() {
    }

    getRollData() {
        return {};
    }
}