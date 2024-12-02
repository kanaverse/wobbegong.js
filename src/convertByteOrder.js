const machine = { order: null };

export function currentByteOrder() {
    if (machine.order === null) {
        let val = new Uint32Array([1]);
        let view = new Uint8Array(val.buffer)
        machine.order = (view[0] == 1 ? "little_endian" : "big_endian");
    }
    return machine.order;
}

export function convertByteOrder(x, order, size) {
    if (order !== currentByteOrder()) {
        for (let i = 0; i < x.length; i += size) {
            const sub = x.subarray(i, i + size);
            sub.reverse();
        }
    }
}
