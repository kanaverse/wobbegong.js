import { Matrix } from "./Matrix.js";
import { DataFrame } from "./DataFrame.js";

/**
 * An interface to the **wobbegong** representation of a SummarizedExperiment instance.
 */
export class SummarizedExperiment {
    #summary;
    #path;
    #fetch_json;
    #fetch_range;

    /**
     * @param {object} summary - A summary of the SummarizedExperiment contents, according to the **wobbegong** specifications.
     * @param {string} path - Path to the SummarizedExperiment directory.
     * This may be a relative or absolute path, depending on how the files are hosted.
     * @param {function} fetch_json - A function that accepts `path`, a path to a file inside `path`.
     * It should retrieve the contents of `path` and load them as a JSON object.
     * It may also return a promise that resolves to such an object.
     * @param {function} fetch_range - A function that accepts `file` (a path to a file inside `path`), `start` and `end`.
     * It should retrieve bytes from `path` in the interval `[start, end)` and return a Uint8Array containing those bytes.
     * It may also return a promise that resolves to such a Uint8Array.
     */
    constructor(summary, path, fetch_json, fetch_range) {
        this.#summary = summary;
        this.#path = path;
        this.#fetch_json = fetch_json;
        this.#fetch_range = fetch_range;
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
     * @return {boolean} Whether row data is available.
     */
    hasRowData() {
        return this.#summary.has_row_data;
    }

    /**
     * @return {boolean} Whether column data is available.
     */
    hasColumnData() {
        return this.#summary.has_column_data;
    }

    /**
     * @return {?DataFrame} A {@link DataFrame} instance representing the row data,
     * or `null` if {@linkcode SummarizedExperiment#hasRowData hasRowData} is false.
     */
    async rowData() {
        if (!this.hasRowData()) {
            return null;
        }
        let path = this.#path + "/row_data";
        const summary = await this.#fetch_json(path + "/summary.json");
        return new DataFrame(summary, this.#path + "/row_data", this.#fetch_range);
    }

    /**
     * @return {?DataFrame} A {@link DataFrame} instance representing the column data,
     * or `null` if {@linkcode SummarizedExperiment#hasColumnData hasColumnData} is false.
     */
    async columnData() {
        if (!this.hasColumnData()) {
            return null;
        }
        let path = this.#path + "/column_data";
        const summary = await this.#fetch_json(path + "/summary.json");
        return new DataFrame(summary, path, this.#fetch_range);
    }

    /**
     * @return {Array} Names of the assays.
     */
    assayNames() {
        return this.#summary.assay_names;
    }

    /**
     * @param {number|string} i - Index or name of the assay to retrieve.
     * @return {Matrix} A {@link Matrix} instance representing the assay matrix for `i`.
     */
    async assay(i) {
        if (typeof i === "string") {
            i = this.#summary.assay_names.indexOf(i);
            if (i === -1) {
                throw new Error("could not find assay named '" + i + "'");
            }
        }
        let path = this.#path + "/assays/" + String(i); 
        const summary = await this.#fetch_json(path + "/summary.json");
        return new Matrix(summary, path, this.#fetch_range);
    }

    /**
     * @return {boolean} Whether reduced dimensions are available. 
     */
    hasReducedDimensions() {
        return "reduced_dimensions" in this.#summary;
    }

//    reducedDimensionNames() {
//        return this.#summary.assay_names;
//    }
//
//    async reducedDimension(i) {
//
//    }
}
