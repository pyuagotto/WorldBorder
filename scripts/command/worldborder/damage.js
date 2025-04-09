//@ts-check
import { Player, ScriptEventCommandMessageAfterEvent, world } from "@minecraft/server";

/**
 * 
 * @param {ScriptEventCommandMessageAfterEvent} ev 
 */
export const worldborderDamage = function(ev){
    const { message, sourceEntity } = ev;

    const damage = parseInt(message.trim());

    if(!Number.isNaN(damage)){
        if(sourceEntity instanceof Player) sourceEntity.sendMessage(`ワールドボーダー外のダメージを${damage}ダメージ毎秒に設定しました`);
        world.setDynamicProperty("worldborderDamage", damage);
    }
};