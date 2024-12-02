export function computeByteRanges(bytes) {
    let last = 0;
    let output = [0];
    for (const x of bytes) {
        last += x;
        output.push(last);
    }
    return output;
}
