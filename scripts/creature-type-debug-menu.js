import { FLAGS, NAME } from "./config.js";
import { getCreatureTypeDebugInfo } from "./creature-type.js";
import { Utils } from "./utils.js";

export class CreatureTypeDebugMenu extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "hide-npc-names-creature-type-debug",
            title: game.i18n.localize("HNN.Settings.CreatureTypeDebugN"),
            template: "modules/hide-npc-names/templates/creature-type-debug.hbs",
            width: 560,
            height: "auto",
            resizable: true,
            closeOnSubmit: false
        });
    }

    getData() {
        const selectedTokens = canvas?.tokens?.controlled ?? [];
        const token = selectedTokens.length === 1 ? selectedTokens[0] : null;
        const actor = token?.actor ?? null;
        const details = actor ? getCreatureTypeDebugInfo(actor) : null;
        const baseActor = actor ? Utils.getBaseActor(actor) : null;
        const actorReplacementOverride = baseActor
            ? Utils.getModuleFlag(baseActor, FLAGS.replacementNameOverride)
            : null;

        return {
            systemId: game.system.id,
            systemVersion: game.system.version ?? game.system.version ?? "",
            moduleVersion: game.modules.get(NAME)?.version ?? "",
            selectedTokenCount: selectedTokens.length,
            hasActor: Boolean(actor),
            actorName: actor?.name ?? "",
            actorType: actor?.type ?? "",
            tokenName: token?.name ?? "",
            pathOverride: details?.pathOverride || game.i18n.localize("HNN.Diagnostics.Blank"),
            effectivePath: details?.effectivePath || game.i18n.localize("HNN.Diagnostics.None"),
            rawValue: formatDebugValue(details?.rawValue),
            typeKey: details?.typeKey || game.i18n.localize("HNN.Diagnostics.None"),
            creatureType: details?.creatureType || game.i18n.localize("HNN.Diagnostics.None"),
            exampleReplacement: details?.exampleReplacement ?? "Unknown Creature",
            actorReplacementOverride: actorReplacementOverride ?? game.i18n.localize("HNN.Diagnostics.NotSet"),
            error: details?.error ?? ""
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find("button[name='close']").on("click", () => this.close());
    }
}

function formatDebugValue(value) {
    if (value === undefined) return game.i18n.localize("HNN.Diagnostics.Undefined");
    if (value === null) return game.i18n.localize("HNN.Diagnostics.Null");
    if (typeof value === "string") return value;

    try {
        const serialized = JSON.stringify(value);
        return serialized.length > 300 ? serialized.slice(0, 297) + "..." : serialized;
    } catch {
        return String(value);
    }
}
