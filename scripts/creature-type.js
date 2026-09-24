import { Utils } from "./utils.js";

const CREATURE_TYPE_DATA_PATH_OVERRIDE = "creatureTypeDataPathOverride";
const CREATURE_TYPE_PATHS = {
    pf1: "race.system.creatureTypes.0"
};

export function registerCreatureTypeSetting() {
    Utils.registerSetting(CREATURE_TYPE_DATA_PATH_OVERRIDE, {
        name: "HNN.Settings.CreatureTypePathOverrideN",
        hint: "HNN.Settings.CreatureTypePathOverrideH",
        scope: "world",
        type: String,
        default: "",
        config: true
    });
}

export function getCreatureTypeReplacementName(actor, replacementName) {
    if (!actor || typeof replacementName !== "string") return replacementName;

    const creatureType = getCreatureTypeDetails(actor).creatureType;
    return replaceCreatureTypePlaceholder(replacementName, creatureType);
}

/**
 * Return the values used to resolve a creature type, for the GM diagnostics menu.
 * @param {Actor} actor
 */
export function getCreatureTypeDebugInfo(actor) {
    const details = getCreatureTypeDetails(actor);
    return {
        ...details,
        exampleReplacement: replaceCreatureTypePlaceholder("Unknown Creature", details.creatureType)
    };
}

function getCreatureTypeDetails(actor) {
    const details = {
        pathOverride: "",
        effectivePath: null,
        rawValue: undefined,
        typeKey: null,
        creatureType: null,
        error: null
    };

    if (!actor) return details;

    try {
        const configuredPath = Utils.getSetting(CREATURE_TYPE_DATA_PATH_OVERRIDE);
        const pathOverride = typeof configuredPath === "string" ? configuredPath.trim() : "";
        const path = pathOverride || CREATURE_TYPE_PATHS[game.system.id];
        details.pathOverride = pathOverride;
        details.effectivePath = path ?? null;
        if (!path) return details;

        let value = foundry.utils.getProperty(actor, path);
        details.rawValue = value;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            value = ["label", "name", "value"]
                .map(field => value[field])
                .find(fieldValue => typeof fieldValue === "string" && fieldValue.trim());
        }
        if (typeof value !== "string" || !value.trim()) return details;

        const type = value.trim();
        details.typeKey = type;
        if (game.system.id === "pf1") {
            const creatureTypes = globalThis.CONFIG?.PF1?.creatureTypes;
            const entry = Object.entries(creatureTypes ?? {})
                .find(([key]) => key.toLowerCase() === type.toLowerCase());
            const label = entry?.[1];
            if (typeof label === "string" && label.trim()) {
                const localizedLabel = game.i18n.localize(label.trim());
                if (typeof localizedLabel === "string" && localizedLabel.trim() && !localizedLabel.trim().startsWith("PF1.")) {
                    details.creatureType = localizedLabel.trim();
                }
                return details;
            }
            if (!pathOverride) return details;
        }

        details.creatureType = type;
        return details;
    } catch (error) {
        details.error = error?.message ?? String(error);
        return details;
    }
}

function replaceCreatureTypePlaceholder(replacementName, creatureType) {
    if (typeof replacementName !== "string" || !creatureType) return replacementName;

    const localizedPlaceholder = game.i18n.localize("HNN.Defaults.CreatureTypePlaceholder");
    for (const placeholder of [localizedPlaceholder, "Creature"]) {
        if (!placeholder || placeholder.startsWith("HNN.")) continue;

        const pattern = new RegExp("\\b" + Utils.escapeRegExp(placeholder) + "\\b", "i");
        if (pattern.test(replacementName)) {
            return replacementName.replace(pattern, creatureType);
        }
    }

    return replacementName;
}
