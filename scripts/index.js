//@ts-check
import { world, system, BlockVolume } from '@minecraft/server';
import "./registerCommand.js";
import config from "./config.js";
import { ParticleInfo } from './class/ParticleInfo.js';
import { MinecraftDimensionTypes } from './lib/index.js';

const dimensions = [
    MinecraftDimensionTypes.Overworld,
    MinecraftDimensionTypes.Nether,
    MinecraftDimensionTypes.TheEnd,
];

/**
 * @type {1 | 0 | -1}
 */
let borderStatus = 0;

/**
 * @param {1 | 0 | -1} status 
 * @returns {boolean}
 */
export const setBorderStatus = function(status) {
    if (status >= -1 && status <= 1) {
        borderStatus = status;
        return true;
    }
    return false;
};

/**
 * プレイヤーの位置とボーダーの境界からの距離を計算
 * @param {import('@minecraft/server').Vector3} playerLocation 
 * @param {BlockVolume} blockVolume
 * @returns {number}
 */
const calculateDistanceFromBorder = function(playerLocation, blockVolume) {
    const min = blockVolume.getMin();
    const max = blockVolume.getMax();

    const closestX = Math.min(Math.abs(min.x - playerLocation.x), Math.abs(max.x - playerLocation.x));
    const closestZ = Math.min(Math.abs(min.z - playerLocation.z), Math.abs(max.z - playerLocation.z));

    return Math.min(closestX, closestZ);
};

world.afterEvents.worldLoad.subscribe(() => {
    const defaultProperties = {
        worldborderDistance: 50000000,
        worldborderCenter: { x: 0.5, y: -60, z: 0.5 },
        worldborderDamageAmount: 1,
        worldborderDamageBuffer: 0,
        baseParticleId: config.particleId.baseParticleId,
        expandParticleId: config.particleId.expandParticleId,
        reductionParticleId: config.particleId.reductionParticleId,
        particleHeight: config.particleHeight,
        particleQuantity: config.particleQuantity === "few" ? 0 : 1,
    };

    for (const [key, value] of Object.entries(defaultProperties)) {
        if (!world.getDynamicProperty(key)) {
            world.setDynamicProperty(key, value);
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

    const borderVolume = { x: borderLength * 2, y: 400, z: borderLength * 2 };
    const bufferVolume = { x: bufferLength * 2, y: 400, z: bufferLength * 2 };

    const blockVolume = new BlockVolume(
        { x: center.x - bufferLength, y: -104, z: center.z - bufferLength },
        { x: center.x + bufferLength, y: 400, z: center.z + bufferLength }
    );

    for (const dimension of dimensions) {
        const playersInBorder = world.getDimension(dimension).getPlayers({
            location: { x: center.x - borderLength, y: -104, z: center.z - borderLength },
            volume: borderVolume,
        });
        insideBorderPlayerList.push(...playersInBorder);

        const playersInBuffer = world.getDimension(dimension).getPlayers({
            location: { x: center.x - bufferLength, y: -104, z: center.z - bufferLength },
            volume: bufferVolume,
        });
        insideBufferPlayerList.push(...playersInBuffer);
    }

    for (const player of world.getPlayers()) {
        const isInsideBorder = insideBorderPlayerList.includes(player);
        const isInsideBuffer = insideBufferPlayerList.includes(player);

        if(isInsideBorder) player.runCommand('/fog @s remove border');
        else player.runCommand('/fog @s push "minecraft:fog_crimson_forest" border');
        
        if (!isInsideBuffer) {
            const amount = world.getDynamicProperty("worldborderDamageAmount");
            if (typeof amount === "number") {
                const damage = amount * calculateDistanceFromBorder(player.location, blockVolume);
                player.applyDamage(damage);
            }
        }
    }
}, 10);

let i = 0;
system.runInterval(()=>{
    const particleId = ParticleInfo.getParticleId(borderStatus);
    const particleHeight = ParticleInfo.getParticleHeight();

    let distance = world.getDynamicProperty("worldborderDistance");
    let length = 0;
    
    if(typeof(distance) === "number") {
        length = distance / 2.0;
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
                for(const dimension of dimensions) {
                    world.getDimension(dimension).runCommand(`/particle ${particleId} ${point.x} ${center.y + y} ${point.z}`);
                }
            }
        }

        i += particleQuantity;
    } else {
        i = 0;
    }
},1);