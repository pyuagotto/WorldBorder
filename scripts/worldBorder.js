//@ts-check

import { CustomCommandOrigin, CustomCommandStatus, system, world } from "@minecraft/server";

export class WorldBorder {
    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} newDistance 
     * @param {number} time 
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    add(origin, newDistance, time) {
        // 型チェック
        if (typeof newDistance !== "number" || typeof time !== "number" || !Number.isInteger(time)) {
            return { status: CustomCommandStatus.Failure, message: `構文エラー:§a/scriptevent "worldborder:add" <distance:float> [time:int]` };
        }

        const nowDistance = world.getDynamicProperty("worldborderDistance");

        //引数が1つの場合
        
        if(!time){
            if(!Number.isNaN(newDistance)){
                if(nowDistance !== newDistance){
                    world.setDynamicProperty("worldborderDistance", newDistance);
                    //distance = newDistance;
                    //length = distance / 2;
                    return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${newDistance}ブロックに設定しました` };
                }

                return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
            }
            
            return { status: CustomCommandStatus.Failure, message: `構文エラー:§a/scriptevent "worldborder:add" <distance:value> [time:int]` };
        }
        
        //引数が2つの場合
        else {
            if(!Number.isNaN(newDistance) && !Number.isNaN(time)){
                if(time >= 0){
                    if(nowDistance){
                        if(typeof(nowDistance) === "number"){
                            if(newDistance < nowDistance){
                                let tick = time * 20;
                                const num = (nowDistance - newDistance) / tick;
    
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
                                    }
                                },1);

                                return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに縮小します` };
                            }
                            
                            else if(newDistance > nowDistance){
                                let tick = time * 20;
                                const num = (newDistance - nowDistance) / tick;
    
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
                                    }
                                },1);

                                return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに拡大します` };
                            }

                            return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
                        }
                    }

                    return { status: CustomCommandStatus.Failure, message: `時間は0以上でなくてはならないため${time}は適しません` };
                }
                
            }

            return { status: CustomCommandStatus.Failure, message: `構文エラー:§a/scriptevent "worldborder:add" <distance:value> [time:int]` };
        }
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {import("@minecraft/server").Vector3} location 
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    center(origin, location){
        world.setDynamicProperty("worldborderCenter", location);
        return { status: CustomCommandStatus.Success, message: `ワールドボーダーの中心を${location.x},${location.y},${location.z}に設定しました` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} damage 
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    damage(origin, damage){
        world.setDynamicProperty("worldborderDamage", damage);
        return { status: CustomCommandStatus.Success, message: `ワールドボーダー外のダメージを${damage}ダメージ毎秒に設定しました` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    get(origin){
        let distance = world.getDynamicProperty("worldborderDistance");
        
        if(typeof(distance) === "number") distance = Math.round(distance);
        return { status: CustomCommandStatus.Success, message: `現在のワールドボーダーの幅は${distance}ブロックです` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} newDistance 
     * @param {number} time 
     * @returns 
     */
    set(origin, newDistance, time) {
        // 型チェック
        if (typeof newDistance !== "number" || typeof time !== "number" || !Number.isInteger(time)) {
            return { status: CustomCommandStatus.Failure, message: `構文エラー:§a/scriptevent "worldborder:add" <distance:float> [time:int]` };
        }

        const nowDistance = world.getDynamicProperty("worldborderDistance");

        //引数が1つの場合
        if(!time){
            

            if(!Number.isNaN(newDistance)){
                if(nowDistance !== newDistance){
                    world.setDynamicProperty("worldborderDistance", newDistance);
                    //distance = newDistance;
                    //length = distance / 2;
                    return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${newDistance}ブロックに設定しました` };
                }

                return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
            }
            
            return { status: CustomCommandStatus.Failure, message: `構文エラー:§a/scriptevent "worldborder:add" <distance:value> [time:int]` };
        }
        
        //引数が2つの場合
        else {
            if(!Number.isNaN(newDistance) && !Number.isNaN(time)){
                if(time >= 0){
                    if(nowDistance){
                        if(typeof(nowDistance) === "number"){
                            let tick = time * 20;

                            if(newDistance < nowDistance){
                                const num = (nowDistance - newDistance) / tick;
    
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
                                    }
                                },1);

                                return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに縮小します` };
                            }
                            
                            else if(newDistance > nowDistance){
                                const num = (newDistance - nowDistance) / tick;
    
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
                                    }
                                },1);

                                return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに拡大します` };
                            }

                            return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
                        }
                    }

                    return { status: CustomCommandStatus.Failure, message: `時間は0以上であるなくてはならないため${time}は適しません` };
                }
                
            }

            return { status: CustomCommandStatus.Failure, message: `構文エラー:§a/scriptevent "worldborder:add" <distance:value> [time:int]` };
        }
    }
}