import { compress } from "./utils.js";
import * as wb from "../src/index.js";
import * as bo from "../src/convertByteOrder.js";

test("integer decoding works in simple cases", async () => {
    let ref = new Int32Array([1,2,3,4,5,6]);
    let enc = await compress(ref.buffer);
    let dec = await wb.decodeIntegers(enc, bo.currentByteOrder());
    expect(dec).toEqual(ref);

    // Checking that the byte order is handled. 
    let alt_order = bo.currentByteOrder() == "little_endian" ? "big_endian" : "little_endian";
    let ref_alt  = ref.slice();
    bo.convertByteOrder(new Uint8Array(ref_alt.buffer), alt_order, 4);
    let enc_alt = await compress(ref_alt.buffer)
    let dec_alt = await wb.decodeIntegers(enc_alt, alt_order);
    expect(dec_alt).toEqual(ref);
})

test("integer decoding works with missing values", async () => {
    let ref = new Int32Array([100,200,-2147483648,400,500,600]);
    let enc = await compress(ref.buffer);

    let dec1 = await wb.decodeIntegers(enc, bo.currentByteOrder(), { missing: "raw" });
    expect(dec1).toEqual(ref);

    let dec2 = await wb.decodeIntegers(enc, bo.currentByteOrder(), { missing: "null" });
    let ref2 = Array.from(ref);
    ref2[2] = null;
    expect(dec2).toEqual(ref2);

    let dec3 = await wb.decodeIntegers(enc, bo.currentByteOrder(), { missing: "nan" });
    let ref3 = new Float64Array(ref);
    ref3[2] = Number.NaN;
    expect(dec3).toEqual(ref3);
})

test("Decoding works with delta-encoded indices", async () => {
    let ref = new Int32Array([1,2,3,4,5,6]);
    let enc = await compress(ref.buffer);
    let dec = await wb.decodeDeltaIndices(enc, bo.currentByteOrder(), { missing: "raw" });
    expect(dec).toEqual(new Int32Array([1,3,6,10,15,21]));
})

test("double-precision decoding works", async () => {
    let ref = new Float64Array([1.2,2.3,Number.NaN,Number.POSITIVE_INFINITY,-1.5]);
    let enc = await compress(ref.buffer);
    let dec = await wb.decodeDoubles(enc, bo.currentByteOrder());
    expect(dec).toEqual(ref);

    // Checking that the byte order is handled. 
    let alt_order = bo.currentByteOrder() == "little_endian" ? "big_endian" : "little_endian";
    let ref_alt  = ref.slice();
    bo.convertByteOrder(new Uint8Array(ref_alt.buffer), alt_order, 8);
    let enc_alt = await compress(ref_alt.buffer)
    let dec_alt = await wb.decodeDoubles(enc_alt, alt_order);
    expect(dec_alt).toEqual(ref);
})

test("boolean decoding works", async () => {
    let ref = new Uint8Array([0,1,0,1,2,1]);
    let enc = await compress(ref.buffer);
    let dec = await wb.decodeBooleans(enc);
    expect(dec).toEqual([false,true,false,true,null,true]);
})

test("string decoding works", async () => {
    let ref = ["akari","aika","alice","alicia","akira","athena","�"];

    let bytes = [];
    let tenc = new TextEncoder;
    for (const x of ref) {
        let current = tenc.encode(x);
        for (const v of current) {
            bytes.push(v);
        }
        bytes.push(0);
    }

    let bytes_cast = new Uint8Array(bytes);
    let enc = await compress(bytes_cast.buffer);
    let dec = await wb.decodeStrings(enc);
    ref[ref.length - 1] = null;
    expect(dec).toEqual(ref);
})
