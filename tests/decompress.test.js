import { compress } from "./utils.js";
import { decompress } from "../src/decompress.js";

test("decompress works as expected", async () => {
    let ref = new Int32Array([987, 817, 18182, 283, 324]);
    let comp = await compress(ref.buffer);
    let dec = await decompress(comp);
    let cast = new Int32Array(dec.buffer);
    expect(cast).toEqual(ref);
})
