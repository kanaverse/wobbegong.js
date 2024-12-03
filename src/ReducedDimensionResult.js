import * as dec from "./decode.js";
import { computeByteRanges } from "./computeByteRanges.js";

/**
 * An interface to the **wobbegong** representation of a reduced dimension result.
 */
export class ReducedDimensionResult {
    #summary;
    #path;
    #fetch;
    #bytes;

    /**
     * @param {object} summary - A summary of the reduced dimension result's contents, according to the **wobbegong** specifications.
     * @param {string} path - Path to the reduced dimension result's directory.
     * This may be a relative or absolute path, depending on how the files are hosted.
     * @param {function} fetch_range - A function that accepts `file` (a path to a file inside `path`), `start` and `end`.
     * It should retrieve bytes from `file` in the interval `[start, end)` and return a Uint8Array containing those bytes.
     * It may also return a promise that resolves to such a Uint8Array.
     */
    constructor(summary, path, fetch_range) {
        this.#summary = summary;
        this.#path = path + "/content";
        this.#fetch = fetch_range;
        this.#bytes = computeByteRanges(this.#summary.column_bytes);
    }

    /**
     * @return {number} Number of rows.
     */
    numberOfRows() {
        return this.#summary.row_count;
    }

    /**
     * @return {number} Number of columns.
     */
    numberOfColumns() {
        return this.#summary.column_bytes.length;
    }

    /**
     * @return {string} Type of the matrix, typically either `boolean`, `integer` or `double`.
     */
    type() {
        return this.#summary.type;
    }

    /**
     * @param {number} i - Row index.
     * @param {object} [options={}] - Further options.
     * @param {string} [options.missing="null"] - How to handle missing values for integer arrays, see the corresponding option in {@linkcode decodeIntegers}.
     * @return {Array|Int32Array|Float64Array} Array of length equal to the number of rows, containing the contents of column `i`.
     */
    async column(i, options={}) {
        const { missing = "null", ...others } = options;
        for (const key of Object.keys(others)) {
            throw new Error("unknown option '" + key + "'");
        }
        let payload = await this.#fetch(this.#path, this.#bytes[i], this.#bytes[i + 1]);
        return dec.decode(payload, this.type(), this.#summary.byte_order, { missing });
    }
}
