//@ts-check
import { world, system } from '@minecraft/server';
import { worldborderAdd } from "./command/worldborder/add.js";
import { worldborderCenter } from "./command/worldborder/center.js";
import { worldborderDamage } from "./command/worldborder/damage.js";
import { worldborderGet } from "./command/worldborder/get.js";
import { worldborderSet } from "./command/worldborder/set.js";
import config from "./config.js";
import toJson from "./toJson.js";

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
system.afterEvents.scriptEventReceive.subscribe((ev)=>{
    const { id } = ev;
    
    switch(id){
        case "worldborder:add":
            worldborderAdd(ev);
            break;

        case "worldborder:center": 
            worldborderCenter(ev);
            break;

        case "worldborder:damage":
            worldborderDamage(ev);
            break;

        case "worldborder:get":
            worldborderGet(ev);
            break;

        case "worldborder:set":
            worldborderSet(ev);
            break;
    }
});

system.runInterval(()=>{
    const inZonePlayerList = [];
    let distance = world.getDynamicProperty("worldborderDistance");
    let length = 0;

    if(typeof(distance) === "number") length = distance / 2;
    
    const center = world.getDynamicProperty("worldborderCenter");

    if(!center) world.setDynamicProperty("worldborderCenter", {x: 0.5, y: -60, z: 0.5});

    if(typeof(center) === "object"){
        for(const player of world.getDimension("overworld").getPlayers({location: {x: center.x - length, y: center.y, z: center.z - length}, volume: {x: length * 2, y: 100, z: length * 2}})){
            inZonePlayerList.push(player);
        }
    }

    for(const player of world.getPlayers()){
        if(inZonePlayerList.includes(player)){
            player.runCommand('/fog @s remove zone');
        }else{
            let damage = world.getDynamicProperty("worldborderDamage");

            if(!damage) {
                damage = 1
                world.setDynamicProperty("worldborderDamage", 1);
            }

            if(typeof(damage) === "number") player.applyDamage(damage);
            player.runCommand('/fog @s push "minecraft:fog_crimson_forest" zone');
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