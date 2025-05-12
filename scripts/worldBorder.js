//@ts-check

import { CustomCommandOrigin, CustomCommandStatus, system, world } from "@minecraft/server";
import { setBorderStatus } from "./index.js";

export class WorldBorder {
    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} addDistance 
     * @param {number} time 
     * @returns {{ status: CustomCommandStatus, message: string } | undefined}
     */
    add(origin, addDistance, time) {
        
        const nowDistance = world.getDynamicProperty("worldborderDistance");

        if(typeof(nowDistance) === "number") {
            const newDistance = nowDistance + addDistance;
            return this.set(origin, newDistance, time);
        }
        
        return undefined;
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
     * @param {"amount" | "buffer"} param
     * @param {number} number 
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    damage(origin, param, number){
        switch(param){
            case "amount": {
                world.setDynamicProperty("worldborderDamageAmount", number);
                return { status: CustomCommandStatus.Success, message: `ワールドボーダー外のダメージを${number}ダメージ毎秒に設定しました` };
            }

            case "buffer": {
                world.setDynamicProperty("worldborderDamageBuffer", number);
                return { status: CustomCommandStatus.Success, message: `ワールドボーダー外の安全圏を${number}ブロックに設定しました` };
            }
        }
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
     * @returns {{ status: CustomCommandStatus, message: string } | undefined}
     */
    set(origin, newDistance, time) {
        const nowDistance = world.getDynamicProperty("worldborderDistance");
        newDistance = Math.floor(newDistance * 10) / 10;

        if (nowDistance === newDistance) {
            return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
        }

        if (!time) {
            // 引数が1つの場合
            if(newDistance < 0){
                return { status: CustomCommandStatus.Failure, message: `ワールドボーダーの幅を1ブロックより狭くすることはできません` };
            }

            world.setDynamicProperty("worldborderDistance", newDistance);
            return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${newDistance}ブロックに設定しました` };
        }

        if (time < 0) {
            return { status: CustomCommandStatus.Failure, message: `時間は0以上であるなくてはならないため${time}は適しません` };
        }

        // 引数が2つの場合
        if (typeof nowDistance !== "number") return undefined;

        let tick = time * 20;
        const num = Math.abs(newDistance - nowDistance) / tick;
        console.warn('num', num);
        const direction = newDistance > nowDistance ? 1 : -1;

        const id = system.runInterval(() => {
            if (tick >= 0) {
                const d = world.getDynamicProperty("worldborderDistance");
                if (typeof d === "number") {
                    
                    world.setDynamicProperty("worldborderDistance", d + direction * num);
                }
                tick--;
            } else {
                world.setDynamicProperty("worldborderDistance", newDistance);
                setBorderStatus(0);
                system.clearRun(id);
            }
        }, 1);

        const action = direction > 0 ? "拡大" : "縮小";
        const status = direction > 0 ? 1 : -1;

        setBorderStatus(status);
        return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに${action}します` };
    }
}