//@ts-check
import { world, system } from '@minecraft/server';
import "./registerCommand.js";
import config from "./config.js";
import { WorldBorderInfo } from './class/WorldBorderInfo.js';


/**
 * @type {1 | 0 | -1}
 */
let borderStatus = 0;

/**
 * @param {1 | 0 | -1} status 
 * @returns {boolean}
 */
export const setBorderStatus = function(status){
    let result = false;

    if(status >= -1 && status <= 1) {
        borderStatus = status;
        result = true;
    }

    return result;
};

world.afterEvents.worldLoad.subscribe(() => {
    const center = world.getDynamicProperty("worldborderCenter");
    if(!center) world.setDynamicProperty("worldborderCenter", {x: 0.5, y: -60, z: 0.5});

    const amount = world.getDynamicProperty("worldborderDamageAmount");
    if(!amount) world.setDynamicProperty("worldborderDamageAmount", 1);

    const buffer = world.getDynamicProperty("worldborderDamageBuffer");
    if(!buffer) world.setDynamicProperty("worldborderDamageBuffer", 0);

    const baseParticleId = world.getDynamicProperty("baseParticleId");
    const expandParticleId = world.getDynamicProperty("expandParticleId");
    const reductionParticleId = world.getDynamicProperty("reductionParticleId");
    const particleQuantity = world.getDynamicProperty("particleQuantity");
    const particleHeight = world.getDynamicProperty("particleHeight");

    if(!baseParticleId) world.setDynamicProperty("baseParticleId", config.particleId.baseParticleId);
    if(!expandParticleId) world.setDynamicProperty("expandParticleId", config.particleId.expandParticleId);
    if(!reductionParticleId) world.setDynamicProperty("reductionParticleId", config.particleId.reductionParticleId);
    if(!particleHeight) world.setDynamicProperty("particleHeight", config.particleHeight);

    if(!particleQuantity){
        switch(config.particleQuantity){
            case "few":
                world.setDynamicProperty("particleQuantity", 0);
                break;

            case "many":
                world.setDynamicProperty("particleQuantity", 1);
                break;
        }
    }
});

system.runInterval(() => {
    const insideBorderPlayerList = [];
    const insideBufferPlayerList = [];

    const distance = world.getDynamicProperty("worldborderDistance");
    const buffer = world.getDynamicProperty("worldborderDamageBuffer");
    const borderLength = typeof distance === "number" ? distance / 2 : 0;
    const bufferLength = typeof distance === "number" && typeof buffer === "number" ? (distance + buffer) / 2 : 0;

    const center = world.getDynamicProperty("worldborderCenter");
    if (typeof center !== "object") return;

    const overworld = world.getDimension("overworld");

    // プレイヤーリストを取得
    const borderVolume = { x: borderLength * 2, y: 300, z: borderLength * 2 };
    const bufferVolume = { x: bufferLength * 2, y: 300, z: bufferLength * 2 };

    for (const player of overworld.getPlayers({ location: { x: center.x - borderLength, y: -104, z: center.z - borderLength }, volume: borderVolume })) {
        insideBorderPlayerList.push(player);
    }

    for (const player of overworld.getPlayers({ location: { x: center.x - bufferLength, y: -104, z: center.z - bufferLength }, volume: bufferVolume })) {
        insideBufferPlayerList.push(player);
    }


    for (const player of world.getPlayers()) {
        // ボーダー内外の処理
        if (insideBorderPlayerList.includes(player)) {
            player.runCommand('/fog @s remove border');
        } else {
            player.runCommand('/fog @s push "minecraft:fog_crimson_forest" border');
        }

        const magnification = Math.sqrt(Math.pow(center.x - player.location.x, 2) + Math.pow(center.z - player.location.z, 2)) - bufferLength;

        // バッファ外のダメージ処理
        if (!insideBufferPlayerList.includes(player)) {
            const amount = world.getDynamicProperty("worldborderDamageAmount");
            if (typeof amount === "number" && typeof center === "object") {
                player.applyDamage(amount * magnification / 5);
            }
        }
    }
}, 10);

let i = 0;
//パーティクルの表示
system.runInterval(()=>{
    const particleId = WorldBorderInfo.getParticleId(borderStatus);
    const particleHeight = WorldBorderInfo.getParticleHeight();

    let distance = world.getDynamicProperty("worldborderDistance");
    let length = 0;
    
    if(typeof(distance) === "number") {
        length = distance / 2.0;
        const sb = world.scoreboard.getObjective("border");
        sb?.getScores().forEach((score) => {
            sb.removeParticipant(score.participant)
        })
        sb?.setScore(distance?.toString(), -1);
    }
    const center = world.getDynamicProperty("worldborderCenter");

    if(typeof(center) !== "object") return;

    const points = [
        { x: center.x + length, z: center.z + i }, { x: center.x + length, z: center.z - i },
        { x: center.x - length, z: center.z + i }, { x: center.x - length, z: center.z - i },
        { x: center.x + i, z: center.z + length }, { x: center.x - i, z: center.z + length },
        { x: center.x + i, z: center.z - length }, { x: center.x - i, z: center.z - length },
        { x: center.x + length - i, z: center.z + length }, { x: center.x + length, z: center.z + length - i },
        { x: center.x + length - i, z: center.z - length }, { x: center.x + length, z: center.z - length + i },
        { x: center.x - length + i, z: center.z - length }, { x: center.x - length, z: center.z - length + i },
        { x: center.x - length + i, z: center.z + length }, { x: center.x - length, z: center.z + length - i }
    ];

    // パーティクル量の計算
    const particleQuantity = WorldBorderInfo.calculateParticleQuantity(length);

    if (i < length / 2 + particleQuantity) {
        for (let y = 0; y < particleHeight; y += 3) {
            for (const point of points) {
                world.getDimension("overworld").runCommand(
                    `/particle ${particleId} ${point.x} ${center.y + y} ${point.z}`
                );
            }
        }

        i += particleQuantity;
    } else {
        i = 0;
    }
},1);