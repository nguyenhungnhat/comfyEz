import { WorkflowPreset } from "../types";
import { Z_TURBO_PRESET } from "./zTurbo";
import { SDXL_BASE_PRESET } from "./sdxlBase";
import { SDXL_TURBO_PRESET } from "./sdxlTurbo";
// import { Z_INPAINT_PRESET } from "./zInpaint";

export const DEFAULT_PRESETS: WorkflowPreset[] = [
    Z_TURBO_PRESET,
    // Z_INPAINT_PRESET,
    SDXL_BASE_PRESET,
    SDXL_TURBO_PRESET
];

export { Z_TURBO_PRESET, SDXL_BASE_PRESET, SDXL_TURBO_PRESET };
