//@ts-check
import { BlockVolume, CustomCommandOrigin, world, CustomCommandSource, Dimension, Player } from "@minecraft/server";

/**
 * @typedef {"overworld" | "nether" | "the_end"} DimensionId
 */

export class Utils { 
    /**
     * 
     * @param {CustomCommandOrigin} origin 
     * @returns {DimensionId}
     */
    static getOriginDimensionId(origin) {
        /**
         * @type {DimensionId}
         */
        let dimension;

        switch(origin.sourceType) {
            case CustomCommandSource.Block: {
                switch(origin.sourceBlock?.dimension.id) {
                    case "minecraft:nether":
                        dimension = "nether";
                        break;
                    case "minecraft:the_end":
                        dimension = "the_end";
                        break;
                    case "minecraft:overworld":
                    default:
                        dimension = "overworld";
                }
                break;
            }

            case CustomCommandSource.Entity: {
                switch(origin.sourceEntity?.dimension.id) {
                    case "minecraft:nether":
                        dimension = "nether";
                        break;
                    case "minecraft:the_end":
                        dimension = "the_end";
                        break;
                    case "minecraft:overworld":
                    default:
                        dimension = "overworld";
                }
                break;
            }

            case CustomCommandSource.NPCDialogue: {
                switch(origin.initiator?.dimension.id) {
                    case "minecraft:nether":
                        dimension = "nether";
                        break;
                    case "minecraft:the_end":
                        dimension = "the_end";
                        break;
                    case "minecraft:overworld":
                    default:
                        dimension = "overworld";
                }
                break;
            }

            case CustomCommandSource.Server: {
                dimension = "overworld";
                break;
            }
        }

        if(!dimension) dimension = "overworld";
        return dimension;
    }

    /**
     * @param {DimensionId} dimension
     * @returns {number | undefined}
     */
    static getDistance(dimension){
        let distance;

        switch(dimension){
            case "nether":
                distance = world.getDynamicProperty("worldborderDistanceNether");
                break;
            case "the_end":
                distance = world.getDynamicProperty("worldborderDistanceTheEnd");
                break;
            case "overworld":
            default:
                distance = world.getDynamicProperty("worldborderDistanceOverworld");
        }

        if(typeof distance === "number") return distance;
        return undefined;
    }

    /**
     * @param {DimensionId} dimension
     * @param {number} distance 
     */
    static setDistance(dimension, distance){
        switch(dimension){
            case "nether":
                world.setDynamicProperty("worldborderDistanceNether", distance);
                break;
            case "the_end":
                world.setDynamicProperty("worldborderDistanceTheEnd", distance);
                break;
            case "overworld":
            default:
                world.setDynamicProperty("worldborderDistanceOverworld", distance);
        }
    }

    /**
     * @param {DimensionId} dimension
     * @returns {import("@minecraft/server").Vector3 | undefined}
     */
    static getCenter(dimension){
        let center;
        switch(dimension){
            case "nether":
                center = world.getDynamicProperty("worldborderCenterNether");
                break;
            case "the_end":
                center = world.getDynamicProperty("worldborderCenterTheEnd");
                break;
            case "overworld":
            default:
                center = world.getDynamicProperty("worldborderCenterOverworld");
        }
        if(typeof center === "object" && center !== null && typeof center.x === "number" && typeof center.z === "number") return center;
        return undefined;
    }

    /**
     * @param {DimensionId} dimension
     * @param {import("@minecraft/server").Vector3} center 
     */
    static setCenter(dimension, center){
        switch(dimension){
            case "nether":
                world.setDynamicProperty("worldborderCenterNether", center);
                break;

            case "the_end":
                world.setDynamicProperty("worldborderCenterTheEnd", center);
                break;

            case "overworld":
            default:
                world.setDynamicProperty("worldborderCenterOverworld", center);
        }
    }

    /**
     * プレイヤーの位置とボーダーの境界からの距離を計算
     * @param {import('@minecraft/server').Vector3} playerLocation 
     * @param {BlockVolume} blockVolume
     * @returns {number} ボーダーまでの距離（絶対値）
     */
    static calculateDistanceFromBorder(playerLocation, blockVolume) {
        const min = blockVolume.getMin();
        const max = blockVolume.getMax();

        // 各軸でのボーダーまでの距離
        const distanceToMinX = playerLocation.x - min.x;
        const distanceToMaxX = max.x - playerLocation.x;
        const distanceToMinZ = playerLocation.z - min.z;
        const distanceToMaxZ = max.z - playerLocation.z;

        // 各軸で最も近いボーダーまでの距離
        const closestX = Math.min(distanceToMinX, distanceToMaxX);
        const closestZ = Math.min(distanceToMinZ, distanceToMaxZ);

        // 内側にいる場合（両方とも正）
        if (closestX >= 0 && closestZ >= 0) {
            return Math.min(closestX, closestZ);
        }

        // X軸方向のみ外側
        if (closestX < 0 && closestZ >= 0) {
            return Math.abs(closestX);
        }

        // Z軸方向のみ外側
        if (closestX >= 0 && closestZ < 0) {
            return Math.abs(closestZ);
        }

        // 角の外側（両方とも負）
        return Math.sqrt(closestX ** 2 + closestZ ** 2);
    }

    /**
     * プレイヤーの向きと位置から最も近いボーダーへの矢印を返す
     * @param {Player} player - player
     * @param {import('@minecraft/server').Vector3} center - ボーダーの中心座標
     * @param {number} borderLength - ボーダーの半径
     * @returns {string} 矢印（↑, →, ↓, ←）
     */
    static getBorderArrow(player, center, borderLength) {
        // 各ボーダーまでの距離を計算
        const playerLocation = player.location;
        const viewDirection = player.getViewDirection();

        const distances = {
            north: { distance: Math.abs(playerLocation.z - (center.z - borderLength)), angle: 180 },
            south: { distance: Math.abs(playerLocation.z - (center.z + borderLength)), angle: 0 },
            west: { distance: Math.abs(playerLocation.x - (center.x - borderLength)), angle: -90 },
            east: { distance: Math.abs(playerLocation.x - (center.x + borderLength)), angle: 90 },
        };

        // 最も近いボーダーの角度を取得
        const borderAngle = Object.values(distances).reduce((nearest, current) =>
            current.distance < nearest.distance ? current : nearest
        ).angle;

        // プレイヤーの向いている角度を取得（-180° ～ 180°）
        const playerAngle = Math.atan2(viewDirection.x, viewDirection.z) * (180 / Math.PI);

        // プレイヤーの向きからボーダーへの相対角度を計算
        let relativeAngle = borderAngle - playerAngle;

        // -180° ～ 180° の範囲に正規化
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;

        // 相対角度から矢印を決定（4方向）
        if (relativeAngle >= -45 && relativeAngle < 45) return "↑";
        if (relativeAngle >= 45 && relativeAngle < 135) return "←";
        if (relativeAngle >= 135 || relativeAngle < -135) return "↓";
        if (relativeAngle >= -135 && relativeAngle < -45) return "→";

        return "?";
    }

    /**
     * プレイヤーの向きと位置から中心への矢印を返す
     * @param {Player} player - Player
     * @param {import('@minecraft/server').Vector3} center - ボーダーの中心座標
     * @returns {string} 矢印（↑, →, ↓, ←）
     */
    static getCenterArrow(player, center) {
        // プレイヤーから中心への角度を計算
        const dx = center.x - player.location.x;
        const dz = center.z - player.location.z;
        const centerAngle = Math.atan2(dx, dz) * (180 / Math.PI);

        // プレイヤーの向いている角度を取得（-180° ～ 180°）
        const playerAngle = Math.atan2(player.getViewDirection().x, player.getViewDirection().z) * (180 / Math.PI);

        // プレイヤーの向きから中心への相対角度を計算
        let relativeAngle = centerAngle - playerAngle;

        // -180° ～ 180° の範囲に正規化
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;

        // 相対角度から矢印を決定（8方向）
        if (relativeAngle >= -22.5 && relativeAngle < 22.5) return "↑";
        if (relativeAngle >= 22.5 && relativeAngle < 67.5) return "↖";
        if (relativeAngle >= 67.5 && relativeAngle < 112.5) return "←";
        if (relativeAngle >= 112.5 && relativeAngle < 157.5) return "↙";
        if (relativeAngle >= 157.5 || relativeAngle < -157.5) return "↓";
        if (relativeAngle >= -157.5 && relativeAngle < -112.5) return "↘";
        if (relativeAngle >= -112.5 && relativeAngle < -67.5) return "→";
        if (relativeAngle >= -67.5 && relativeAngle < -22.5) return "↗";


        return "?";
    }

    /**
     * 始点と終点の範囲内でランダムな座標を1つ返す
     * @param {import('@minecraft/server').Vector3} center - 中心点
     * @param {import('@minecraft/server').Vector3} from - 始点
     * @param {import('@minecraft/server').Vector3} to - 終点
     * @returns {import('@minecraft/server').Vector3} ランダムな座標
     */
    static getRandomLocation = function(center, from, to) {
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        const minZ = Math.min(from.z, to.z);
        const maxZ = Math.max(from.z, to.z);

        return {
            x: Math.random() * (maxX - minX) + minX,
            y: center.y,
            z: Math.random() * (maxZ - minZ) + minZ
        };
    };
}