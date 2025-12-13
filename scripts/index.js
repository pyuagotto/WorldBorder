//@ts-check
import { world, system, BlockVolume, Player } from '@minecraft/server';
import "./registerCommand.js";
import config from "./config.js";
import { ParticleInfo } from './class/ParticleInfo.js';
import { Utils } from './class/Utils.js';
import { BorderState } from './class/BorderState.js';

/**
 * @typedef {"overworld" | "nether" | "the_end"} Dimension
 */

/**
 * @type {Dimension[]}
 */
const dimensions = [
    "overworld",
    "nether",
    "the_end",
];

world.afterEvents.worldLoad.subscribe(() => {
    const defaultProperties = {
        worldborderDistanceOverworld: 50000000,
        worldborderDistanceNether: 5000000,
        worldborderDistanceTheEnd: 5000000,
        worldborderCenterOverworld: { x: 0.5, y: -60, z: 0.5 },
        worldborderCenterNether: { x: 0.5, y: -60, z: 0.5 },
        worldborderCenterTheEnd: { x: 0.5, y: -60, z: 0.5 },
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

//ダメージの処理
system.runInterval(() => {
    for(const dimension of dimensions) {
        const insideBorderPlayerList = [];
        const insideBufferPlayerList = [];

        let distance = Utils.getDistance(dimension);
        let center = Utils.getCenter(dimension);

        if(!distance) return;
        if(!center) return;

        const buffer = world.getDynamicProperty("worldborderDamageBuffer");

        const borderLength = distance / 2;
        const bufferLength = typeof buffer === "number" ? (distance + buffer) / 2 : 0;

        const borderVolume = { x: borderLength * 2, y: 400, z: borderLength * 2 };
        const bufferVolume = { x: bufferLength * 2, y: 400, z: bufferLength * 2 };

        const blockVolume = new BlockVolume(
            { x: center.x - bufferLength, y: -104, z: center.z - bufferLength },
            { x: center.x + bufferLength, y: 400, z: center.z + bufferLength }
        );

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

        for (const player of world.getDimension(dimension).getPlayers()) {
            const isInsideBorder = insideBorderPlayerList.includes(player);
            const isInsideBuffer = insideBufferPlayerList.includes(player);

            if(isInsideBorder) player.runCommand('/fog @s remove border');
            else player.runCommand('/fog @s push "minecraft:fog_crimson_forest" border');
            
            if (!isInsideBuffer) {
                const amount = world.getDynamicProperty("worldborderDamageAmount");
                if (typeof amount === "number") {
                    const damage = amount * Utils.calculateDistanceFromBorder(player.location, blockVolume);
                    player.applyDamage(damage);
                }
            }

            const borderDistance = Utils.calculateDistanceFromBorder(player.location, blockVolume);
            const centerArrow = Utils.getCenterArrow(player, center);
            const borderArrow = Utils.getBorderArrow(player, center, borderLength);

            let toBorder = "";

            if(isInsideBorder) {
                toBorder = `[${Math.floor(borderDistance)}m (${borderArrow})]`;
            }else{
                toBorder = `[§c${Math.floor(borderDistance)}m (${centerArrow})§r]`;
            }

            let status;

            switch (BorderState.getStatus(dimension)) {
                case 1:
                    status = `§a拡大中§r (${Math.floor(BorderState.getTime(dimension) / 20)}秒後に${Math.floor(BorderState.getNewDistance(dimension))}m)`;
                    break;
                case -1:
                    status = `§c縮小中§r (${Math.floor(BorderState.getTime(dimension) / 20)}秒後に${Math.floor(BorderState.getNewDistance(dimension))}m)`;
                    break;
                case 0:
                    status = "停止中";
                    break;
            }

            const actionbar = `中心: [X:${Math.round(center.x * 10) / 10} Z:${Math.round(center.z * 10) / 10} (${centerArrow})] ` + 
                            `ボーダーまで: ${toBorder}\n` + 
                            `大きさ: [${Math.floor(distance)}m] ` +
                            `状態: [${status}]`;
            player.onScreenDisplay.setActionBar(actionbar);
        }
    }
    
}, 10);

//パーティクルの表示
const particleIndex = {
    [dimensions[0]]: 0,
    [dimensions[1]]: 0,
    [dimensions[2]]: 0,
};

system.runInterval(()=>{
    for(const dimension of dimensions) {
        const particleId = ParticleInfo.getParticleId(BorderState.getStatus(dimension));
        const particleHeight = ParticleInfo.getParticleHeight();

        const distance = Utils.getDistance(dimension);
        const center = Utils.getCenter(dimension);

        if(!distance) return;
        if(!center) return;

        const length = distance / 2.0;;

        const i = particleIndex[dimension];

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
                    world.getDimension(dimension).runCommand(`/particle ${particleId} ${point.x} ${center.y + y} ${point.z}`);
                }
            }

            particleIndex[dimension] += particleQuantity;
        } else {
            particleIndex[dimension] = 0;
        }
    }
},1);