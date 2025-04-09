//@ts-check
import { Player, ScriptEventCommandMessageAfterEvent, world, system } from "@minecraft/server";
import { setBorderStatus } from "../../index.js";
/**
 * 
 * @param {ScriptEventCommandMessageAfterEvent} ev 
 */
export const worldborderSet = function(ev){
    const { message, sourceEntity } = ev;

    const array = message.trim().split(/\s+/);

        //引数が1つの場合
        if(array.length === 1){
            const newDistance = parseFloat(array[0]);
            const nowDistance = world.getDynamicProperty("worldborderDistance");

            if(!Number.isNaN(newDistance)){
                if(nowDistance !== newDistance){
                    world.setDynamicProperty("worldborderDistance", newDistance);
                    //distance = newDistance;
                    //length = distance / 2;
                    if(sourceEntity instanceof Player) sourceEntity.sendMessage(`ワールドボーダーの幅を${newDistance}ブロックに設定しました`);
                }

                else {
                    if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§cワールドボーダーは既にその大きさのため、変更されませんでした§r`);
                }
               
            }
            
            else{
                if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§c構文エラー:§a/scriptevent "worldborder:set" <distance:value> [time:int]`);
            }
        }
        
        //引数が2つの場合
        else if(array.length === 2){
            const newDistance = parseFloat(array[0]);
            const time = parseInt(array[1]);
            const nowDistance = world.getDynamicProperty("worldborderDistance");

            if(!Number.isNaN(newDistance) && !Number.isNaN(time)){
                if(time >= 0){
                    if(nowDistance){
                        if(typeof(nowDistance) === "number"){
                            if(newDistance < nowDistance){
                                if(sourceEntity instanceof Player) sourceEntity.sendMessage(`ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに縮小します`);
    
                                let tick = time * 20;
                                const num = (nowDistance - newDistance) / tick;
                                setBorderStatus(-1);

                                const id = system.runInterval(()=>{
                                    if(tick > 0){
                                        const d = world.getDynamicProperty("worldborderDistance");
    
                                        if(typeof(d) === "number"){
                                            world.setDynamicProperty("worldborderDistance", (d - num));
                                        }

                                        tick--;
                                    }
                                    
                                    else{
                                        system.clearRun(id);
                                        setBorderStatus(0);
                                    }
                                },1);
                            }
                            
                            else if(newDistance > nowDistance){
                                if(sourceEntity instanceof Player) sourceEntity.sendMessage(`ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに拡大します`);

                                let tick = time * 20;
                                const num = (newDistance - nowDistance) / tick;
                                setBorderStatus(1);

                                const id = system.runInterval(()=>{
                                    if(tick > 0){
                                        const d = world.getDynamicProperty("worldborderDistance");
    
                                        if(typeof(d) === "number"){
                                            world.setDynamicProperty("worldborderDistance", (d + num));
                                        }

                                        tick--;
                                    }
                                    
                                    else{
                                        system.clearRun(id);
                                        setBorderStatus(0);
                                    }
                                },1);
                            }
                            
                            else{
                                if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§cワールドボーダーは既にその大きさのため、変更されませんでした§r`);
                            }
                        }
                    }

                    else{
                        if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§c時間は0以上であるなくてはならないため${time}は適しません§r`);
                    }
                }
                
            }

            else{
                if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§c構文エラー:§a/scriptevent "worldborder:set" <distance:value> [time:int]`);
            }
        }

        //それ以外
        else{
            if(sourceEntity instanceof Player) sourceEntity.sendMessage(`§c構文エラー:§a/scriptevent "worldborder:set" <distance:value> [time:int]`);
        }
};