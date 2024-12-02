export async function decompress(x) {
    // See https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream
    // for the implementation status across browsers and frameworks.
    let dec = new DecompressionStream("deflate-raw");
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
