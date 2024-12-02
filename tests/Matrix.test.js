import * as mat from "../src/Matrix.js";
import { localFetchRange } from "./utils.js";
import * as fs from "fs";
import * as p from "path";
import * as u from "url";

test("Matrix works as expected for dense matrices", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-sce", "assays", "0");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_mat = new mat.Matrix(summary, path, localFetchRange);

    // Checking the dimensions.
    expect(my_mat.numberOfRows()).toEqual(50);
    expect(my_mat.numberOfColumns()).toEqual(20);

    // Checking other bits.
    expect(my_mat.sparse()).toBe(false);
    expect(my_mat.type()).toBe("integer");

    // Checking some rows for sane values.
    let first_row = await my_mat.row(0);
    expect(first_row instanceof Int32Array).toBe(true);
    expect(first_row.length).toBe(20);
    expect(first_row.every(x => x >= 0 && x < 100)).toBe(true);

    let last_row = await my_mat.row(49);
    expect(last_row instanceof Int32Array).toBe(true);
    expect(last_row.length).toBe(20);
    expect(last_row.every(x => x >= 0 && x < 100)).toBe(true);

    // Checking the statistics. 
    let stats = my_mat.statisticNames();
    expect(stats.indexOf("column_sum")).toBeGreaterThan(-1);
    expect(stats.indexOf("row_nonzero")).toBeGreaterThan(-1);

    let tstats = my_mat.statisticNames({ types: true });
    let cnz = stats.indexOf("column_nonzero");
    expect(tstats[cnz].type).toEqual("integer");

    let row_sum = await my_mat.statistic("row_sum");
    expect(row_sum[0]).toBeCloseTo(first_row.reduce((x, y) => x + y, 0));
    expect(row_sum[49]).toBeCloseTo(last_row.reduce((x, y) => x + y, 0));

    let trow_sum = await my_mat.statistic("row_sum", { type: true });
    expect(trow_sum.value).toEqual(row_sum);
    expect(trow_sum.type).toEqual("double");
})

test("Matrix works as expected for sparse matrices", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-sce", "assays", "2");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_mat = new mat.Matrix(summary, path, localFetchRange);

    // Checking the dimensions.
    expect(my_mat.numberOfRows()).toEqual(50);
    expect(my_mat.numberOfColumns()).toEqual(20);

    // Checking other bits.
    expect(my_mat.sparse()).toBe(true);
    expect(my_mat.type()).toBe("double");

    // Checking some rows for sane values.
    let first_row = await my_mat.row(0);
    expect(first_row.value instanceof Float64Array).toBe(true);
    expect(first_row.index instanceof Int32Array).toBe(true);
    expect(first_row.index.length).toEqual(first_row.value.length);
    for (var i = 1; i < first_row.index.length; i++) {
        expect(first_row.index[i]).toBeGreaterThan(first_row.index[i-1]);
        expect(first_row.index[i]).toBeLessThan(20);
        expect(first_row.index[i]).toBeGreaterThanOrEqual(0);
    }

    let last_row = await my_mat.row(49, { asDense: true });
    expect(last_row instanceof Float64Array).toBe(true);
    expect(last_row.length).toBe(20);
})
