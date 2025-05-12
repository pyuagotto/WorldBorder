//@ts-check
import { world, system } from '@minecraft/server';
import "./registerCommand.js";
import config from "./config.js";

/**
 * @typedef {import("@minecraft/server").Vector3} Vector3
 */

let borderStatus = 0;

/**
 * 
 * @param {number} status 
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

    if(!baseParticleId) world.setDynamicProperty("baseParticleId", config.particleId.baseParticleId);
    if(!expandParticleId) world.setDynamicProperty("expandParticleId", config.particleId.expandParticleId);
    if(!reductionParticleId) world.setDynamicProperty("reductionParticleId", config.particleId.reductionParticleId);

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

    if (typeof center === "object") {
        const overworld = world.getDimension("overworld");

        // プレイヤーリストを取得
        const borderVolume = { x: borderLength * 2, y: 300, z: borderLength * 2 };
        const bufferVolume = { x: bufferLength * 2, y: 300, z: bufferLength * 2 };

        
        for (const player of overworld.getPlayers({ location: { x: center.x - borderLength, y: center.y, z: center.z - borderLength }, volume: borderVolume })) {
            insideBorderPlayerList.push(player);
        }

        for (const player of overworld.getPlayers({ location: { x: center.x - bufferLength, y: center.y, z: center.z - bufferLength }, volume: bufferVolume })) {
            insideBufferPlayerList.push(player);
        }
    }

    for (const player of world.getPlayers()) {
        // ボーダー内外の処理
        if (insideBorderPlayerList.includes(player)) {
            player.runCommand('/fog @s remove border');
        } else {
            player.runCommand('/fog @s push "minecraft:fog_crimson_forest" border');
        }

        // バッファ外のダメージ処理
        if (!insideBufferPlayerList.includes(player)) {
            const amount = world.getDynamicProperty("worldborderDamageAmount");
            if (typeof amount === "number" && typeof center === "object") {
                player.applyDamage(amount);
            }
        }
    }
}, 10);

let i = 0;
//パーティクルの表示
system.runInterval(()=>{
    
    let particleId;

    switch(borderStatus){
        case -1:
            particleId = config.particleId.reductionParticleId;
            break;

        case 0:
            particleId = config.particleId.baseParticleId;
            break;

        case 1:
            particleId = config.particleId.expandParticleId;
            break;
    }
    
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

    if (i < length / 2) {
        for (let y = 0; y < 15; y += 3) {
            for (const point of points) {
                world.getDimension("overworld").runCommand(`/particle ${particleId} ${point.x} ${center.y + y} ${point.z}`);
            }
        }
        
        i += Math.sqrt(length);
    } else {
        i = 0;
        console.warn("往復")
    }
},1);