//@ts-check

import { CustomCommandOrigin, CustomCommandStatus, Player, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { setBorderStatus } from "../index.js";
import config from "../config.js";

/**
 * @type {number | undefined}
 */
let intervalId;

export class WorldBorder {
    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} addDistance 
     * @param {number} time 
     * @returns {{ status: CustomCommandStatus, message: string } | undefined}
     */
    static add(origin, addDistance, time) {
        
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
    static center(origin, location){
        world.setDynamicProperty("worldborderCenter", location);
        return { status: CustomCommandStatus.Success, message: `ワールドボーダーの中心を${Math.round(location.x * 100) / 100},${Math.round(location.y * 100) / 100},${Math.round(location.z * 100) / 100}に設定しました` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {"amount" | "buffer"} param
     * @param {number} number 
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    static damage(origin, param, number){
        if(number >= 0){
            number = Math.round(number * 100) / 100;
            switch(param){
                case "amount": {
                    const nowDamageAmount = world.getDynamicProperty("worldborderDamageAmount");
                    if (nowDamageAmount === number) {
                        return { status: CustomCommandStatus.Failure, message: `ワールドボーダーのダメージは既にその値のため、変更されませんでした` };
                    }

                    world.setDynamicProperty("worldborderDamageAmount", number);
                    return { status: CustomCommandStatus.Success, message: `ワールドボーダー外のダメージを${number}ダメージ毎秒に設定しました` };
                }

                case "buffer": {
                    const nowDamageBuffer = world.getDynamicProperty("worldborderDamageBuffer");
                    if (nowDamageBuffer === number) {
                        return { status: CustomCommandStatus.Failure, message: `ワールドボーダーの安全県の距離は既にその距離のため、変更されませんでした` };
                    }

                    world.setDynamicProperty("worldborderDamageBuffer", number);
                    return { status: CustomCommandStatus.Success, message: `ワールドボーダー外の安全圏を${number}ブロックに設定しました` };
                }
            }
        }else{
            return { status: CustomCommandStatus.Failure, message: `この浮動小数点数は0.0以上でなくてはならないため${number}は適しません` };
        }
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    static get(origin){
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
    static set(origin, newDistance, time) {
        const nowDistance = world.getDynamicProperty("worldborderDistance");
        newDistance = Math.round(newDistance * 10) / 10;

        if (nowDistance === newDistance) {
            return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
        }

        if (!time) {
            // 引数が1つの場合
            if(newDistance < 0){
                return { status: CustomCommandStatus.Failure, message: `ワールドボーダーの幅を1ブロックより狭くすることはできません` };
            }

            if(intervalId){
                system.clearRun(intervalId);
                setBorderStatus(0);
                intervalId = undefined;
            }

            world.setDynamicProperty("worldborderDistance", newDistance);
            return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${newDistance}ブロックに設定しました` };
        }

        if (time < 0) {
            return { status: CustomCommandStatus.Failure, message: `この整数は0以上でなくてはならないため${time}は適しません` };
        }

        // 引数が2つの場合
        if (typeof nowDistance !== "number") return undefined;

        let tick = time * 20;
        const num = Math.abs(newDistance - nowDistance) / tick;
        const direction = newDistance > nowDistance ? 1 : -1;

        if(intervalId){
            system.clearRun(intervalId);
            setBorderStatus(0);
        }

        intervalId = system.runInterval(() => {
            if (tick >= 0) {
                const d = world.getDynamicProperty("worldborderDistance");
                if (typeof d === "number") {
                    
                    world.setDynamicProperty("worldborderDistance", d + direction * num);
                }
                tick--;
            } else {
                world.setDynamicProperty("worldborderDistance", newDistance);
                setBorderStatus(0);
                if(intervalId) system.clearRun(intervalId);
            }
        }, 1);

        const action = direction > 0 ? "拡大" : "縮小";
        const status = direction > 0 ? 1 : -1;

        setBorderStatus(status);
        return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに${action}します` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @returns {{ status: CustomCommandStatus, message?: string } | undefined}
     */
    static setting(origin){
        if(origin.sourceEntity instanceof Player){
            if(config.config) return { status: CustomCommandStatus.Failure, message: "config.jsからconfigをfalseにしてください" };

            const player = origin.sourceEntity;
            const baseParticleId = world.getDynamicProperty("baseParticleId");
            const expandParticleId = world.getDynamicProperty("expandParticleId");
            const reductionParticleId = world.getDynamicProperty("reductionParticleId");
            const particleQuantity = world.getDynamicProperty("particleQuantity");
            const particleHeight = world.getDynamicProperty("particleHeight");

            if(typeof(baseParticleId) !== "string" || typeof(expandParticleId) !== "string" || typeof(reductionParticleId) !== "string" || typeof(particleQuantity) !== "number" || typeof(particleHeight) !== "number") return undefined;

            const settingForm = new ModalFormData();
            settingForm.title("ワールドボーダーの設定");
            settingForm.textField("\nbaseParticleId\n", "namespace:name", { defaultValue : baseParticleId });
            settingForm.textField("\nexpandParticleId\n", "namespace:name", { defaultValue : expandParticleId });
            settingForm.textField("\nreductionParticleId\n", "namespace:name", { defaultValue : reductionParticleId });
            settingForm.dropdown("\nparticleQuantity\n", ["few", "many"], { defaultValueIndex: particleQuantity, tooltip: "パーティクルの表示量を増やすと、処理が重くなる可能性があります" });
            settingForm.slider("\nparticleHeight", 15, 120, { defaultValue: particleHeight, valueStep: 3 });

            system.run(()=>{
                settingForm.show(player).then((response) => {
                    if(response.formValues){
                        if (
                            typeof response.formValues[0] === "string" &&
                            typeof response.formValues[1] === "string" &&
                            typeof response.formValues[2] === "string" &&
                            typeof response.formValues[3] === "number" && 
                            typeof response.formValues[4] === "number"
                        ) {
                            world.setDynamicProperty("baseParticleId", response.formValues[0]);
                            world.setDynamicProperty("expandParticleId", response.formValues[1]);
                            world.setDynamicProperty("reductionParticleId", response.formValues[2]);
                            world.setDynamicProperty("particleQuantity", response.formValues[3]);
                            world.setDynamicProperty("particleHeight", response.formValues[4]);

                            player.sendMessage(`§aワールドボーダーの設定を変更しました§r`);
                        } 
                    }
                });
            });
            

            return { status: CustomCommandStatus.Success };
        }

        return { status: CustomCommandStatus.Failure, message: "このコマンドはプレイヤーから実行する必要があります" };
    }
}