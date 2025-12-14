//@ts-check

import { BlockVolume, CustomCommandOrigin, CustomCommandStatus, Player, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import config from "../config.js";
import { Utils } from "./Utils.js";
import { BorderState } from "./BorderState.js";

/**
 * @typedef {"overworld" | "nether" | "the_end"} DimensionId
 */

export class WorldBorder {
    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} addDistance 
     * @param {number} time 
     * @param {DimensionId} dimension
     * @returns {{ status: CustomCommandStatus, message: string } | undefined}
     */
    static add(origin, addDistance, time, dimension = Utils.getOriginDimensionId(origin)){
        let nowDistance = Utils.getDistance(dimension);

        if(typeof(nowDistance) === "number") {
            const newDistance = nowDistance + addDistance;
            return this.set(origin, newDistance, time, dimension);
        }
        
        return undefined;
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {import("@minecraft/server").Vector3} location 
     * @param {DimensionId} dimension
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    static center(origin, location, dimension = Utils.getOriginDimensionId(origin)){
        Utils.setCenter(dimension, location);

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
     * @param {DimensionId} dimension
     * @returns {{ status: CustomCommandStatus, message: string }}
     */
    static get(origin, dimension = Utils.getOriginDimensionId(origin)){
        let distance = Utils.getDistance(dimension);
        if(distance) distance = Math.round(distance);

        return { status: CustomCommandStatus.Success, message: `現在のワールドボーダーの幅は${distance}ブロックです` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {number} newDistance 
     * @param {number} time 
     * @param {DimensionId} dimension
     * @returns {{ status: CustomCommandStatus, message: string } | undefined}
     */
    static set(origin, newDistance, time, dimension = Utils.getOriginDimensionId(origin)) {
        let nowDistance = Utils.getDistance(dimension);

        newDistance = Math.round(newDistance * 10) / 10;

        if (nowDistance === newDistance) {
            return { status: CustomCommandStatus.Failure, message: `ワールドボーダーは既にその大きさのため、変更されませんでした` };
        }

        if (!time) {
            if(newDistance < 0){
                return { status: CustomCommandStatus.Failure, message: `ワールドボーダーの幅を1ブロックより狭くすることはできません` };
            }

            BorderState.stopTransition(dimension);
            Utils.setDistance(dimension, newDistance);

            return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${newDistance}ブロックに設定しました` };
        }

        if (time < 0) {
            return { status: CustomCommandStatus.Failure, message: `この整数は0以上でなくてはならないため${time}は適しません` };
        }

        if (typeof nowDistance !== "number") return undefined;

        BorderState.startTransition(dimension, nowDistance, newDistance, time);

        const action = newDistance > nowDistance ? "拡大" : "縮小";
        return { status: CustomCommandStatus.Success, message: `ワールドボーダーの幅を${time}秒かけて${newDistance}ブロックに${action}します` };
    }

    /**
     * @param {CustomCommandOrigin} origin
     * @param {DimensionId} dimension
     * @returns {{ status: CustomCommandStatus, message?: string } | undefined}
     */
    static randomcenter(origin, dimension = Utils.getOriginDimensionId(origin)){
        const distance = Utils.getDistance(dimension);
        const center = Utils.getCenter(dimension);
        
        if(!distance) return;
        if(!center) return;
    
        const borderLength = distance / 4;

        const blockVolume = new BlockVolume(
            { x: center.x - borderLength, y: -104, z: center.z - borderLength },
            { x: center.x + borderLength, y: 400, z: center.z + borderLength }
        );

        const location = Utils.getRandomLocation(center, blockVolume.from, blockVolume.to);
        
        return this.center(origin, location, dimension);
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
            const showActionbar = world.getDynamicProperty("showActionbar");

            if(typeof(baseParticleId) !== "string" || typeof(expandParticleId) !== "string" || typeof(reductionParticleId) !== "string" || typeof(particleQuantity) !== "number" || typeof(particleHeight) !== "number" || typeof(showActionbar) !== "boolean") return undefined;

            const settingForm = new ModalFormData();
            settingForm.title("ワールドボーダーの設定");
            settingForm.textField("\nbaseParticleId\n", "namespace:name", { defaultValue : baseParticleId });
            settingForm.textField("\nexpandParticleId\n", "namespace:name", { defaultValue : expandParticleId });
            settingForm.textField("\nreductionParticleId\n", "namespace:name", { defaultValue : reductionParticleId });
            settingForm.dropdown("\nparticleQuantity\n", ["few", "many"], { defaultValueIndex: particleQuantity, tooltip: "パーティクルの表示量を増やすと、処理が重くなる可能性があります" });
            settingForm.slider("\nparticleHeight", 15, 120, { defaultValue: particleHeight, valueStep: 3 });
            settingForm.toggle("showActionbar", { defaultValue: showActionbar });

            system.run(()=>{
                //@ts-ignore
                settingForm.show(player).then((response) => {
                    if(response.formValues){
                        if (
                            typeof response.formValues[0] === "string" &&
                            typeof response.formValues[1] === "string" &&
                            typeof response.formValues[2] === "string" &&
                            typeof response.formValues[3] === "number" && 
                            typeof response.formValues[4] === "number" &&
                            typeof response.formValues[5] === "boolean"
                        ) {
                            world.setDynamicProperties({
                                baseParticleId: response.formValues[0],
                                expandParticleId: response.formValues[1],
                                reductionParticleId: response.formValues[2],
                                particleQuantity: response.formValues[3],
                                particleHeight: response.formValues[4],
                                showActionbar: response.formValues[5],
                            });
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