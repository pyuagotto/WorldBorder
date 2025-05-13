//@ts-check
import { world } from "@minecraft/server";
import config from "../config.js";

export class WorldBorderInfo {
    /**
     * @param {-1 | 0 | 1 } borderStatus
     * @returns {string | undefined}
     */
    static getParticleId(borderStatus) {
        let id;

        if (config.config) {
            switch (borderStatus) {
                case -1:
                    id = config.particleId.reductionParticleId;
                    break;
                case 0:
                    id = config.particleId.baseParticleId;
                    break;
                case 1:
                    id = config.particleId.expandParticleId;
                    break;
            }
        } else {
            switch (borderStatus) {
                case -1:
                    id = world.getDynamicProperty("reductionParticleId");
                    break;
                case 0:
                    id = world.getDynamicProperty("baseParticleId");
                    break;
                case 1:
                    id = world.getDynamicProperty("expandParticleId");
                    break;
            }
        }

        return typeof id === "string" ? id : undefined;
    }

    /**
     * @returns {number}
     */
    static getParticleHeight() {
        let height;

        if (config.config) {
            height = config.particleHeight;
        } else {
            height = world.getDynamicProperty("particleHeight");
        }

        return typeof height === "number" ? height : 0;
    }

    /**
     * @param {number} length
     * @returns {number}
     */
    static calculateParticleQuantity(length) {
        let particleQuantity = 0;

        if (config.config) {
            switch (config.particleQuantity) {
                case "few":
                    particleQuantity = Math.cbrt(length);
                    break;
                case "many":
                    particleQuantity = Math.sqrt(length);
                    break;
            }
        } else {
            const dynamicParticleQuantity = world.getDynamicProperty("particleQuantity");
            switch (dynamicParticleQuantity) {
                case 0:
                    particleQuantity = Math.sqrt(length);
                    break;
                case 1:
                    particleQuantity = Math.cbrt(length);
                    break;
            }
        }

        return particleQuantity;
    }
}