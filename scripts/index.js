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
let i = 0;

world.afterEvents.worldLoad.subscribe(() => {
    const center = world.getDynamicProperty("worldborderCenter");
    if(!center) world.setDynamicProperty("worldborderCenter", {x: 0.5, y: -60, z: 0.5});

    const amount = world.getDynamicProperty("worldborderDamageAmount");
    if(!amount) world.setDynamicProperty("worldborderDamageAmount", 1);

    const buffer = world.getDynamicProperty("worldborderDamageBuffer");
    if(!buffer) world.setDynamicProperty("worldborderDamageBuffer", 0);
});

system.runInterval(()=>{
    const insideBorderPlayerList = [];
    const insideBufferPlayerList = [];

    let distance = world.getDynamicProperty("worldborderDistance");
    let buffer = world.getDynamicProperty("worldborderDamageBuffer");
    let borderLength = 0;
    let bufferLength = 0;

    if(typeof(distance) === "number" && typeof(buffer) === "number"){
        borderLength = distance / 2;
        bufferLength = (distance + buffer) / 2;
    }

    const center = world.getDynamicProperty("worldborderCenter");

    if(typeof(center) === "object"){
        for(const player of world.getDimension("overworld").getPlayers({location: {x: center.x - borderLength, y: center.y, z: center.z - borderLength}, volume: {x: borderLength * 2, y: 300, z: borderLength * 2}})){
            insideBorderPlayerList.push(player);
        }

        for(const player of world.getDimension("overworld").getPlayers({location: {x: center.x - bufferLength, y: center.y, z: center.z - bufferLength}, volume: {x: bufferLength * 2, y: 300, z: bufferLength * 2}})){
            insideBufferPlayerList.push(player);
        }
    }

    for(const player of world.getPlayers()){
        if(insideBorderPlayerList.includes(player)){
            player.runCommand('/fog @s remove border');
        }else{
            player.runCommand('/fog @s push "minecraft:fog_crimson_forest" border');
        }

        if(!insideBufferPlayerList.includes(player)){
            let amount = world.getDynamicProperty("worldborderDamageAmount");

            if(typeof(amount) === "number") player.applyDamage(amount);
        }
    }
}, 10);


//パーティクルの表示
system.runInterval(()=>{
    let particleId;

    switch(borderStatus){
        case -1:
            particleId = config.reductionParticleId;
            break;

        case 0:
            particleId = config.baseParticleId;
            break;

        case 1:
            particleId = config.expandParticleId;
            break;
    }
    
    let distance = world.getDynamicProperty("worldborderDistance");
    let length = 0;

    if(typeof(distance) === "number") length = distance / 2.0;

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
        i += 5;
    } else {
        i = 0;
    }
},1);