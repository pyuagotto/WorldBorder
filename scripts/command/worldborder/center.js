//@ts-check
import { Player, ScriptEventCommandMessageAfterEvent, world } from "@minecraft/server";

/**
 * 
 * @param {ScriptEventCommandMessageAfterEvent} ev 
 */
export const worldborderCenter = function(ev){
    const { message, sourceEntity } = ev;

    const coordinate = message.trim().split(/\s+/);

    if(coordinate.length === 3){
        const x = parseFloat(coordinate[0]);
        const y = parseFloat(coordinate[1]);
        const z = parseFloat(coordinate[2]);
        
        if(!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)){
            const center = {
                x: x,
                y: y,
                z: z,
            };

            world.setDynamicProperty("worldborderCenter", center);

            if(sourceEntity instanceof Player) sourceEntity.sendMessage(`ワールドボーダーの中心を ${x},${y},${z} に設定しました`);
        }else{
            if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§c構文エラー:§a/scriptevent "worldborder:center" <position:x y z>`);
        }
    }
    
    else{
        if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§c構文エラー:§a/scriptevent "worldborder:center" <position:x y z>`);
    }
};