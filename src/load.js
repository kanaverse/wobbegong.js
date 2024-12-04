import { SummarizedExperiment } from "./SummarizedExperiment.js";
import { DataFrame } from "./DataFrame.js";

/**
 * Load an interface to a SummarizedExperiment or a DataFrame.
 *
 * @param {string} path - Path to a directory containing a SummarizedExperiment or DataFrame.
 * This may be a relative or absolute path, depending on how the files are hosted.
 * @param {function} fetch_json - A function that accepts `path`, a path to a file inside `path`.
 * It should retrieve the contents of `path` and load them as a JSON object.
 * It may also return a promise that resolves to such an object.
 * @param {function} fetch_range - A function that accepts `file` (a path to a file inside `path`), `start` and `end`.
 * It should retrieve bytes from `path` in the interval `[start, end)` and return a Uint8Array containing those bytes.
 * It may also return a promise that resolves to such a Uint8Array.
 *
 * @return {DataFrame|SummarizedExperiment} Interface to a {@link DataFrame} or {@link SummarizedExperiment},
 * depending on the object at `path`.
 */
export async function load(path, load_json, load_range) {
    const summary = await load_json(path + "/summary.json");
    if (summary.object == "data_frame") {
        return new DataFrame(summary, path, load_range);
    } else if ([ "summarized_experiment", "single_cell_experiment"].indexOf(summary.object) >= 0) {
        return new SummarizedExperiment(summary, path, load_json, load_range)
    }
    throw new Error("unknown object type '" + summary.object + "' at path '" + path + "'");
}
