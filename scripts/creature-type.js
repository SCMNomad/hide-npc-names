import { Utils } from "./utils.js";

const CREATURE_TYPE_DATA_PATH_OVERRIDE = "creatureTypeDataPathOverride";
const CREATURE_TYPE_PATHS = {
    pf1: "race.system.creatureTypes.base.0"
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

    const creatureType = getCreatureType(actor);
    if (!creatureType) return replacementName;

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

function getCreatureType(actor) {
    try {
        const configuredPath = Utils.getSetting(CREATURE_TYPE_DATA_PATH_OVERRIDE);
        const pathOverride = typeof configuredPath === "string" ? configuredPath.trim() : "";
        const path = pathOverride || CREATURE_TYPE_PATHS[game.system.id];
        if (!path) return null;

        let value = foundry.utils.getProperty(actor, path);
        if (value && typeof value === "object" && !Array.isArray(value)) {
            value = ["label", "name", "value"]
                .map(field => value[field])
                .find(fieldValue => typeof fieldValue === "string" && fieldValue.trim());
        }
        if (typeof value !== "string" || !value.trim()) return null;

        const type = value.trim();
        if (game.system.id === "pf1") {
            const creatureTypes = globalThis.CONFIG?.PF1?.creatureTypes;
            const entry = Object.entries(creatureTypes ?? {})
                .find(([key]) => key.toLowerCase() === type.toLowerCase());
            const label = entry?.[1];
            if (typeof label === "string" && label.trim()) {
                const localizedLabel = game.i18n.localize(label.trim());
                if (typeof localizedLabel === "string" && localizedLabel.trim() && !localizedLabel.trim().startsWith("PF1.")) {
                    return localizedLabel.trim();
                }
                return null;
            }
            if (!pathOverride) return null;
        }

        return type;
    } catch {
        // Preserve the normal replacement when the configured path cannot be read.
        return null;
    }
}
