//@ts-check
import { Player, ScriptEventCommandMessageAfterEvent, world } from "@minecraft/server";

/**
 * 
 * @param {ScriptEventCommandMessageAfterEvent} ev 
 */
export const worldborderGet = function(ev){
    const { sourceEntity } = ev;

    let distance = world.getDynamicProperty("worldborderDistance");

    if(typeof(distance) === "number") distance = Math.round(distance);
    if(sourceEntity instanceof Player) sourceEntity.sendMessage(`現在のワールドボーダーの幅は${distance}ブロックです`);
};