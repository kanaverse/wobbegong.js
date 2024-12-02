import * as fs from "fs";

export async function compress(x) {
    let dec = new CompressionStream("deflate-raw");
    let bb = new Blob([x]);
    let readable = bb.stream().pipeThrough(dec);

    let chunks = [];
    let total = 0;
    for await (const chunk of readable) {
        chunks.push(chunk)
        total += chunk.length;
    }

    let combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    return combined;
}

export function localFetchRange(path, start, end) {
    const handle = fs.openSync(path);
    let output = new Uint8Array(end - start);
    try {
        fs.readSync(handle, output, 0, output.length, start);
    } finally {
        fs.closeSync(handle);
    }
    return output;
}

export function localFetchJson(path, start, end) {
    const content = fs.readFileSync(path, { encoding: "utf8" });
    return JSON.parse(content);
}
