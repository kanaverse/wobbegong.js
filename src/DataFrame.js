import * as dec from "./decode.js";
import { computeByteRanges } from "./computeByteRanges.js";

/**
 * An interface to the **wobbegong** representation of a DataFrame instance.
 * This should contain columns of integer, double, string or boolean arrays of the same length.
 * It may also contain row names.
 */
export class DataFrame {
    #summary;
    #path;
    #fetch;
    #bytes;

    /**
     * @param {object} summary - A summary of the DataFrame contents, according to the **wobbegong** specifications.
     * @param {string} path - Path to the DataFrame directory.
     * This may be a relative or absolute path, depending on how the files are hosted.
     * @param {function} fetch_range - A function that accepts `file` (a path to a file inside `path`), `start` and `end`.
     * It should retrieve bytes from `file` in the interval `[start, end)` and return a Uint8Array containing those bytes.
     * It may also return a promise that resolves to such a Uint8Array.
     */
    constructor(summary, path, fetch_range) {
        this.#summary = summary;
        this.#path = path + "/content";
        this.#fetch = fetch_range;
        this.#bytes = computeByteRanges(this.#summary.columns.bytes);
    }

    /**
     * @return {boolean} Whether this DataFrame has row names.
     */
    hasRowNames() {
        return this.#summary.has_row_names;
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
        return this.#summary.columns.names.length;
    }

    /**
     * @return {?Array} Names of the rows, or `null` if there are no row names.
     */
    async rowNames() {
        if (!this.hasRowNames()) {
            return null;
        }

        let ncol = this.numberOfColumns();
        let payload = await this.#fetch(this.#path, this.#bytes[ncol], this.#bytes[ncol + 1]);
        return dec.decodeStrings(payload);
    }

    /**
     * @param {object} [options={}] - Further options.
     * @param {boolean} [options.types=false] - Whether to include the types of the columns.
     * @return {Array} Names of the columns.
     * If `types = true`, each entry is an object specifying the `name` and `type` of the column;
     * otherwise, each entry is a string.
     */
    columnNames(options = {}) {
        const { types = false, ...others } = options;
        for (const key of Object.keys(others)) {
            throw new Error("unknown option '" + key + "'");
        }

        let curnames = this.#summary.columns.names;
        if (!types) {
            return curnames;
        }

        let curtypes = this.#summary.columns.types;
        let output = new Array(curnames.length);
        for (var i = 0; i < curnames.length; i++) {
            output[i] = { name: curnames[i], type: curtypes[i] };
        }
        return output;
    }

    /**
     * @param {number|string} i - Index or name of the column to retrieve.
     * @param {object} [options={}] - Further options.
     * @param {boolean} [options.type=false] - Whether to include the type of the column.
     * @param {string} [options.missing="null"] - How to handle missing values for integer arrays, see the corresponding option in {@linkcode decodeIntegers}.
     * @return {object|Array|Int32Array|Float64Array} If `type = false`, an array containing the contents of column `i`.
     * If `type = true`, this is instead an object containing `type`, a string with the column type; and `value`, an array with the column contents.
     */
    async column(i, options = {}) {
        if (typeof i === "string") {
            i = this.#summary.columns.names.indexOf(i);
            if (i === -1) {
                throw new Error("could not find column named '" + i + "'");
            }
        }

        const { missing = "null", type = false, ...others } = options;
        for (const key of Object.keys(others)) {
            throw new Error("unknown option '" + key + "'");
        }

        let payload = await this.#fetch(this.#path, this.#bytes[i], this.#bytes[i + 1]);
        let curtype = this.#summary.columns.types[i];
        let output = await dec.decode(payload, curtype, this.#summary.byte_order, { missing });

        if (type) {
            return { type: curtype, value: output };
        } else {
            return output;
        }
    }
}
