
//@ts-check
import { system, CustomCommandParamType, CommandPermissionLevel, CustomCommandOrigin, CustomCommandStatus, world } from "@minecraft/server";
import { WorldBorder } from "./worldBorder.js";

system.beforeEvents.startup.subscribe((ev) => {
    /**
     * 
     * @param {string} name 
     * @param {string} description 
     * @param {import("@minecraft/server").CustomCommandParameter[]} mandatoryParameters 
     * @param {import("@minecraft/server").CustomCommandParameter[]} optionalParameters 
     * @param {(origin: CustomCommandOrigin, ...args: any[]) => { status: CustomCommandStatus, message?: string }} callback 
     */
    const registerCommand = function(name, description, mandatoryParameters, optionalParameters, callback) {
        ev.customCommandRegistry.registerCommand(
            {
                name,
                description,
                mandatoryParameters,
                optionalParameters,
                permissionLevel: CommandPermissionLevel.GameDirectors,
            },
            callback
        );
    };

    const worldBorder = new WorldBorder();

    registerCommand(
        "wb:worldborder_add",
        "wb",
        [
            { name: "distance", type: CustomCommandParamType.Float },
        ],
        [
            { name: "time", type: CustomCommandParamType.Integer },
        ],
        worldBorder.add
    );

    registerCommand(
        "wb:worldborder_center",
        "wb",
        [
            { name: "position", type: CustomCommandParamType.Location },
        ],
        [],
        worldBorder.center
    );

    registerCommand(
        "wb:worldborder_damage",
        "wb",
        [
            { name: "position", type: CustomCommandParamType.Location },
        ],
        [],
        worldBorder.damage
    );

    registerCommand(
        "wb:worldborder_get",
        "wb",
        [],
        [],
        worldBorder.get
    );

    registerCommand(
        "wb:worldborder_set",
        "wb",
        [
            { name: "distance", type: CustomCommandParamType.Float },
        ],
        [
            { name: "time", type: CustomCommandParamType.Integer },
        ],
        worldBorder.set
    );
});