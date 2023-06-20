export const timeit = async <T>(fn: () => T) => {
    const start = process.hrtime();
    const result = await fn();
    const stop = process.hrtime(start);
    const time = stop[0];
    console.log("time:", time, "seconds");
    return { result, time };
};
