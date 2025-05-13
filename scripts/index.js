//@ts-check
import { world, system, BlockVolume } from '@minecraft/server';
import "./registerCommand.js";
import config from "./config.js";
import { ParticleInfo } from './class/ParticleInfo.js';
import toJson from './toJson.js';

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

// プレイヤーの位置とボーダーの境界からの距離を計算
/**
 * 
 * @param {import('@minecraft/server').Vector3} playerLocation 
 * @param {BlockVolume} blockVolume
 * @returns {number}
 */
const calculateDistanceFromBorder = function(playerLocation, blockVolume) {
    const min = blockVolume.getMin();
    const max = blockVolume.getMax();

    const distanceX1 = Math.abs(min.x - playerLocation.x);
    const distanceX2 = Math.abs(max.x - playerLocation.x);
    const distanceZ1 = Math.abs(min.z - playerLocation.z);
    const distanceZ2 = Math.abs(max.z - playerLocation.z);

    const closestX = Math.min(distanceX1, distanceX2);
    const closestZ = Math.min(distanceZ1, distanceZ2);

    return Math.min(closestX, closestZ);
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
    const borderVolume = { x: borderLength * 2, y: 400, z: borderLength * 2 };
    const bufferVolume = { x: bufferLength * 2, y: 400, z: bufferLength * 2 };

    const blockVolume = new BlockVolume({ x: center.x - bufferLength, y: -104, z: center.z - bufferLength }, { x: center.x + bufferLength, y: 400, z: center.z + bufferLength });
    
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

        // バッファ外のダメージ処理
        if (!insideBufferPlayerList.includes(player)) {
            const amount = world.getDynamicProperty("worldborderDamageAmount");
            if (typeof amount === "number" && typeof center === "object") {
                const damage = amount * calculateDistanceFromBorder(player.location, blockVolume);
                console.warn(damage)
                player.applyDamage(damage);
            }
        }
    }
}, 10);

let i = 0;
//パーティクルの表示
system.runInterval(()=>{
    const particleId = ParticleInfo.getParticleId(borderStatus);
    const particleHeight = ParticleInfo.getParticleHeight();

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
    const particleQuantity = ParticleInfo.calculateParticleQuantity(length);

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