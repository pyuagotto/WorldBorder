
//@ts-check
import { system, CustomCommandParamType, CommandPermissionLevel, CustomCommandOrigin, CustomCommandStatus } from "@minecraft/server";
import { WorldBorder } from "./worldBorder.js";

system.beforeEvents.startup.subscribe((ev) => {
    /**
     * 
     * @param {string} name 
     * @param {string} description 
     * @param {import("@minecraft/server").CustomCommandParameter[]} mandatoryParameters 
     * @param {import("@minecraft/server").CustomCommandParameter[]} optionalParameters 
     * @param {(origin: CustomCommandOrigin, ...args: any[]) => { status: CustomCommandStatus, message?: string } | undefined} callback 
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

    ev.customCommandRegistry.registerEnum(
        "wb:[amount|buffer]",
        [
            "amount",
            "buffer",
        ]
    )

    const worldBorder = new WorldBorder();

    registerCommand(
        "wb:worldborder_add",
        "ワールドボーダーの幅を追加します",
        [
            { name: "distance", type: CustomCommandParamType.Float },
        ],
        [
            { name: "time", type: CustomCommandParamType.Integer },
        ],
        worldBorder.add.bind(worldBorder)
    );

    registerCommand(
        "wb:worldborder_center",
        "ワールドボーダーの中心を設定します",
        [
            { name: "position", type: CustomCommandParamType.Location },
        ],
        [],
        worldBorder.center
    );

    registerCommand(
        "wb:worldborder_damage",
        "ワールドボーダー外のダメージを設定します",
        [
            { name: "wb:[amount|buffer]", type: CustomCommandParamType.Enum },
            { name: "number", type: CustomCommandParamType.Integer },
        ],
        [],
        worldBorder.damage
    );

    registerCommand(
        "wb:worldborder_get",
        "現在のワールドボーダーの幅を取得します",
        [],
        [],
        worldBorder.get
    );

    registerCommand(
        "wb:worldborder_set",
        "ワールドボーダーの幅を設定します",
        [
            { name: "distance", type: CustomCommandParamType.Float },
        ],
        [
            { name: "time", type: CustomCommandParamType.Integer },
        ],
        worldBorder.set
    );
});