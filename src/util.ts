import { StageMethod } from "./interfaces";

export const timeit = async (fn: () => ReturnType<StageMethod>) => {
    const start = process.hrtime();
    const result = await fn();
    const stop = process.hrtime(start);
    const time = stop[0] + stop[1] / 1e9;
    console.log("time:", time, "seconds");
    return { ...result, metrics: { ...(result.metrics as object), time } };
};
