import { decompress } from "./decompress.js";
import { convertByteOrder } from "./convertByteOrder.js";

/**
 * Decode 32-bit integers from a DEFLATE-compressed byte range.
 * 
 * @param {Uint8Array} x - A DEFLATE-compressed byte range containing 32-bit integers.
 * @param {string} order - The byte order of the (decompressed) values in `x`, either `little_endian` or `big_endian`, 
 * @param {object} [options={}] - Additional options.
 * @param {string} [options.missing="null"] - How to treat missing values, represented by the lowest integer (-2147483648).
 * The default value of `null` will convert these to `null`s in an ordinary Array.
 * Setting this to `nan` will convert them to NaN values in a Float64Array.
 * Setting this to `raw` will leave them as -2147483648.
 *
 * @return {Int32Array|Array|Float64Array} Array of decoded integers.
 * This is an Int32Array if `missing="raw"` or if there are no missing values;
 * otherwise it is either an ordinary Array or a Float64Array, depending on the choice of `missing`.
 */
export async function decodeIntegers(x, order, options = {}) {
    const { missing = "null", ...others } = options;
    for (const key of Object.keys(others)) {
        throw new Error("unknown option '" + key + "'");
    }

    let out = await decompress(x);
    convertByteOrder(out, order, 4);
    let res = new Int32Array(out.buffer);
    if (missing == "raw") {
        return res;
    }

    // Check if any are missing.
    const missingness = -2147483648;
    if (!res.some(x => x == missingness)) {
        return res;
    }

    if (missing == "null") {
        let full = Array.from(res);
        for (var i = 0; i < full.length; i++) {
            if (full[i] == missingness) {
                full[i] = null;
            }
        }
        return full;
    }

    if (missing == "nan") {
        let casted = new Float64Array(res);
        for (var i = 0; i < casted.length; i++) {
            if (casted[i] == missingness) {
                casted[i] = Number.NaN;
            }
        }
        return casted;
    }

    throw new Error("unsupported value for the 'missing' argument (" + missing + ")");
}

/**
 * Decode delta-encoded indices from a DEFLATE-compressed byte range.
 * 
 * @param {Uint8Array} x - A DEFLATE-compressed byte range containing delta-encoded indices.
 * @param {string} order - The byte order of the (decompressed) values in `x`, either `little_endian` or `big_endian`, 
 *
 * @return {Int32Array} Array of decoded indices.
 */
export async function decodeDeltaIndices(x, order) {
    let dec = await decodeIntegers(x, order, { missing: "raw" }); // shouldn't be any missing integers anyway.
    for (var i = 1; i < dec.length; i++) {
        dec[i] += dec[i-1];
    }
    return dec;
}

/**
 * Decode double-precision floating-point values from a DEFLATE-compressed byte range.
 * 
 * @param {Uint8Array} x - A DEFLATE-compressed byte range containing doubles.
 * @param {string} order - The byte order of the (decompressed) values in `x`, either `little_endian` or `big_endian`, 
 *
 * @return {Float64Array} Array of decoded doubles.
 */
export async function decodeDoubles(x, order) {
    let out = await decompress(x);
    convertByteOrder(out, order, 8);
    return new Float64Array(out.buffer);
}

/**
 * Decode booleans from a DEFLATE-compressed byte range.
 * 
 * @param {Uint8Array} x - A DEFLATE-compressed byte range containing booleans.
 *
 * @return {Array} Array of booleans.
 * Missing values are represented as `null`.
 */
export async function decodeBooleans(x) {
    let out = await decompress(x);
    let data = Array.from(out);
    for (const [i, v] of Object.entries(data)) {
        switch (v) {
            case 0: case 1:
                data[i] = (v != 0);
                break;
            default:
                data[i] = null;
        }
    }
    return data;
}

/**
 * Decode strings from a DEFLATE-compressed byte range.
 * 
 * @param {Uint8Array} x - A DEFLATE-compressed byte range containing strings.
 *
 * @return {Array} Array of strings.
 * Missing values are represented as `null`.
 */
export async function decodeStrings(x) {
    let out = await decompress(x);
    let last = 0;
    let data = [];
    const dec = new TextDecoder;
    for (let i = 0; i < out.length; i++) {
        if (out[i] == 0) {
            const view = out.subarray(last, i);
            let curstr = dec.decode(view);
            if (curstr == "�") {
                curstr = null;
            }
            data.push(curstr);
            last = i + 1;
        }
    }
    return data;
}

/**
 * Decode an array from a DEFLATE-compressed byte range.
 * 
 * @param {Uint8Array} x - A DEFLATE-compressed byte range containing an array.
 * @param {string} type - Type of the array, either `integer`, `double`, `boolean` or `string`.
 * @param {string} order - The byte order of the (decompressed) values in `x`, either `little_endian` or `big_endian`, 
 * @param {object} [options={}] - Additional options.
 * @param {string} [options.missing="null"] - How to treat missing values in integer arrays, see {@linkcode decodeIntegers}.
 *
 * @return {Int32Array|Array|Float64Array} An array of values of the specified `type`.
 * See {@linkcode decodeStrings}, {@linkcode decodeBooleans}, {@linkcode decodeIntegers} or {@linkcode decodeDoubles} for more details.
 */
export async function decode(x, type, order, options = {}) {
    const { missing = "nulltype", ...others } = options;
    for (const key of Object.keys(others)) {
        throw new Error("unknown option '" + key + "'");
    }

    if (type == "string") {
        return decodeStrings(x);
    } else if (type == "boolean") {
        return decodeBooleans(x);
    } else if (type == "double") {
        return decodeDoubles(x, order);
    } else if (type == "integer") {
        return decodeIntegers(x, order, { missing });
    }

    throw new Error("unknown column type '" + type + "'");
}

