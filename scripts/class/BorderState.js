//@ts-check
import { system } from "@minecraft/server";
import { Utils } from "./Utils.js";

/**
 * @typedef {"overworld" | "nether" | "the_end"} Dimension
 */

/**
 * @typedef {Object} DimensionState
 * @property {1 | 0 | -1} status - 拡大中: 1, 停止中: 0, 縮小中: -1
 * @property {number} time - 残り時間（ティック）
 * @property {number} newDistance - 目標距離
 * @property {number | undefined} intervalId - runIntervalのID
 */

/**
 * @type {Record<Dimension, DimensionState>}
 */
const states = {
    overworld: { status: 0, time: -1, newDistance: -1, intervalId: undefined },
    nether: { status: 0, time: -1, newDistance: -1, intervalId: undefined },
    the_end: { status: 0, time: -1, newDistance: -1, intervalId: undefined },
};

export class BorderState {
    /**
     * @param {Dimension} dimension
     * @returns {DimensionState}
     */
    static get(dimension) {
        return states[dimension];
    }

    /**
     * @param {Dimension} dimension
     * @returns {1 | 0 | -1}
     */
    static getStatus(dimension) {
        return states[dimension].status;
    }

    /**
     * @param {Dimension} dimension
     * @param {1 | 0 | -1} status
     */
    static setStatus(dimension, status) {
        states[dimension].status = status;
    }

    /**
     * @param {Dimension} dimension
     * @returns {number}
     */
    static getTime(dimension) {
        return states[dimension].time;
    }

    /**
     * @param {Dimension} dimension
     * @param {number} time
     */
    static setTime(dimension, time) {
        states[dimension].time = time;
    }

    /**
     * @param {Dimension} dimension
     * @returns {number}
     */
    static getNewDistance(dimension) {
        return states[dimension].newDistance;
    }

    /**
     * @param {Dimension} dimension
     * @param {number} distance
     */
    static setNewDistance(dimension, distance) {
        states[dimension].newDistance = distance;
    }

    /**
     * @param {Dimension} dimension
     */
    static clearInterval(dimension) {
        const id = states[dimension].intervalId;
        if (id !== undefined) {
            system.clearRun(id);
            states[dimension].intervalId = undefined;
        }
    }

    /**
     * @param {Dimension} dimension
     * @param {number} id
     */
    static setIntervalId(dimension, id) {
        states[dimension].intervalId = id;
    }

    /**
     * ボーダーの拡大/縮小を開始
     * @param {Dimension} dimension
     * @param {number} nowDistance
     * @param {number} newDistance
     * @param {number} time - 秒数
     */
    static startTransition(dimension, nowDistance, newDistance, time) {
        this.clearInterval(dimension);

        let tick = time * 20;
        const num = Math.abs(newDistance - nowDistance) / tick;
        const direction = newDistance > nowDistance ? 1 : -1;

        this.setNewDistance(dimension, newDistance);
        this.setStatus(dimension, direction > 0 ? 1 : -1);

        const intervalId = system.runInterval(() => {
            if (tick >= 0) {
                this.setTime(dimension, tick);
                const d = Utils.getDistance(dimension);
                if (d) Utils.setDistance(dimension, d + direction * num);
                
                tick--;
            } else {
                Utils.setDistance(dimension, newDistance);
                this.setStatus(dimension, 0);
                this.clearInterval(dimension);
            }
        }, 1);

        this.setIntervalId(dimension, intervalId);
    }

    /**
     * ボーダーの変更を停止
     * @param {Dimension} dimension
     */
    static stopTransition(dimension) {
        this.clearInterval(dimension);
        this.setStatus(dimension, 0);
    }
}