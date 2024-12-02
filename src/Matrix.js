import * as dec from "./decode.js";
import { computeByteRanges } from "./computeByteRanges.js";

class MatrixStatistics {
    #summary;
    #path;
    #fetch;
    #order;
    #bytes;

    constructor(summary, path, order, fetch_range) {
        this.#summary = summary;
        this.#path = path + "/stats";
        this.#fetch = fetch_range;
        this.#order = order;
        this.#bytes = computeByteRanges(this.#summary.bytes);
    }

    names(options={}) {
        const { types = false, ...others } = options;
        for (const key of Object.keys(others)) {
            throw new Error("unknown option '" + key + "'");
        }

        let curnames = this.#summary.names;
        if (!types) {
            return curnames;
        }

        let curtypes = this.#summary.types;
        let output = new Array(curnames.length);
        for (var i = 0; i < curnames.length; i++) {
            output[i] = { name: curnames[i], type: curtypes[i] };
        }
        return output;
    }

    async get(name, options={}) {
        let i = this.#summary.names.indexOf(name);
        if (i === -1) {
            throw new Error("could not find column named '" + i + "'");
        }

        const { missing = "null", type = false, ...others } = options;
        for (const key of Object.keys(others)) {
            throw new Error("unknown option '" + key + "'");
        }

        let payload = await this.#fetch(this.#path, this.#bytes[i], this.#bytes[i + 1]);
        let curtype = this.#summary.types[i];
        let output = await dec.decode(payload, curtype, this.#order, { missing });

        if (type) {
            return { type: curtype, value: output };
        } else {
            return output;
        }
    }
}

/**
 * An interface to the **wobbegong** representation of a matrix.
 * This is either a row-major dense matrix or a compressed sparse row matrix.
 */
export class Matrix {
    #summary;
    #path;
    #fetch;
    #bytes;
    #statistics;

    /**
     * @param {object} summary - A summary of the matrix contents, according to the **wobbegong** specifications.
     * @param {string} path - Path to the matrix directory.
     * This may be a relative or absolute path, depending on how the files are hosted.
     * @param {function} fetch_range - A function that accepts `file` (a path to a file inside `path`), `start` and `end`.
     * It should retrieve bytes from `file` in the interval `[start, end)` and return a Uint8Array containing those bytes.
     * It may also return a promise that resolves to such a Uint8Array.
     */
    constructor(summary, path, fetch_range) {
        this.#summary = summary;
        this.#path = path + "/content";
        this.#fetch = fetch_range;

        if (summary.format == "dense") {
            this.#bytes = computeByteRanges(this.#summary.row_bytes);
        } else {
            let last = 0;
            let bytes = [0];
            for (var i = 0; i < this.#summary.row_count; i++) {
                last += this.#summary.row_bytes.value[i];
                bytes.push(last);
                last += this.#summary.row_bytes.index[i];
                bytes.push(last);
            }
            this.#bytes = bytes;
        }

        this.#statistics = new MatrixStatistics(this.#summary.statistics, path, this.#summary.byte_order, fetch_range)
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
        return this.#summary.column_count;
    }

    /**
     * @return {boolean} Whether this matrix is sparse.
     */
    sparse() {
        return (this.#summary.format === "sparse");
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
     * @param {string} [options.asDense=false] - Whether to return the row's contents as a dense array with explicit zeros.
     * Only relevant if {@linkcode Matrix#sparse sparse} returns true.
     * 
     * @return {object|Array|Int32Array|Float64Array} 
     * If `asDense = true` or {@linkcode Matrix#sparse sparse} is false, an array of length equal to the number of columns is returned, containing the contents of row `i` in dense form.
     *
     * Otherwise, an object is returned containing `value`, an array of the values of the structural non-zero elements of row `i`; and `index`, a Int32Array of column indices for each entry of `value`.
     * All indices are guaranteed to be sorted and unique.
     */
    async row(i, options={}) {
        const { missing = "null", asDense = false, ...others } = options;
        for (const key of Object.keys(others)) {
            throw new Error("unknown option '" + key + "'");
        }

        if (!this.sparse()) {
            let payload = await this.#fetch(this.#path, this.#bytes[i], this.#bytes[i + 1]);
            return dec.decode(payload, this.type(), this.#summary.byte_order, { missing });
        }

        let i2 = 2 * i;
        let start = this.#bytes[i2];
        let full_payload = await this.#fetch(this.#path, start, this.#bytes[i2 + 2]);

        let midpoint = this.#bytes[i2 + 1];
        let vals = await dec.decode(full_payload.slice(0, midpoint - start), this.type(), this.#summary.byte_order, { missing });
        let idx = await dec.decodeDeltaIndices(full_payload.slice(midpoint - start), this.#summary.byte_order);
        if (!asDense) {
            return { value: vals, index: idx };
        } 

        let full = new vals.constructor(this.numberOfColumns());
        full.fill(0);
        for (var i = 0; i < vals.length; i++) {
            full[idx[i]] = vals[i];
        }
        return full;
    }

    /**
     * List available statistics.
     * Each matrix is guaranteed to have at least:
     *
     * - `row_sum`, the summed value within each row.
     * - `column_sum`, the summed value within each column.
     * - `row_nonzero`, the number of non-zero entries within each row.
     * - `column_nonzero`, the number of non-zero entries within each column.
     *
     * @param {object} [options={}] - Further options.
     * @param {boolean} [options.types=true] - Whether to include the types of the statistics.
     * @return {Array} Names of the available statistics.
     * If `types = true`, each entry is an object specifying the `name` and `type` of the column;
     * otherwise, each entry is a string.
     */
    statisticNames(options={}) {
        return this.#statistics.names(options);
    }

    /**
     * Retrieve a statistic by name.
     *
     * @param {string} name - Name of the statistic, as described in {@linkcode DenseMatrix#statisticNames statisticNames}.
     * @param {object} [options={}] - Further options.
     * @param {boolean} [options.type=false] - Whether to include the type of the statistic.
     * @param {string} [options.missing="null"] - How to handle missing values for integer arrays, see the corresponding option in {@linkcode decodeIntegers}.
     * @return {object|Array|Int32Array|Float64Array} If `type = false`, an array containing the statistic `i`.
     * If `type = true`, this is instead an object containing `type`, a string with the statistic's type; and `value`, an array with the statistic itself.
     */
    statistic(name, options={}) {
        return this.#statistics.get(name, options);
    }
}
