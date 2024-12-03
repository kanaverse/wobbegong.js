import * as rd from "../src/ReducedDimensionResult.js";
import { localFetchRange } from "./utils.js";
import * as fs from "fs";
import * as p from "path";
import * as u from "url";

test("ReducedDimensionResult works as expected", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full", "reduced_dimensions", "0");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_rd = new rd.ReducedDimensionResult(summary, path, localFetchRange);

    // Checking the dimensions.
    expect(my_rd.numberOfRows()).toBe(20);
    expect(my_rd.numberOfColumns()).toBe(4);

    // Checking the type.
    expect(my_rd.type()).toBe("double");

    // Extracting a column.
    let col1 = await my_rd.column(0);
    expect(col1 instanceof Float64Array).toBe(true);
    expect(col1.length).toBe(20);

    let col4 = await my_rd.column(3);
    expect(col4 instanceof Float64Array).toBe(true);
    expect(col4.length).toBe(20);
})

test("ReducedDimensionResult works with integers", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full", "reduced_dimensions", "1");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_rd = new rd.ReducedDimensionResult(summary, path, localFetchRange);

    // Checking the dimensions.
    expect(my_rd.numberOfRows()).toBe(20);
    expect(my_rd.numberOfColumns()).toBe(2);

    // Checking the type.
    expect(my_rd.type()).toBe("integer");

    // Extracting a column.
    let col1 = await my_rd.column(0);
    expect(col1 instanceof Int32Array).toBe(true);
    expect(col1.length).toBe(20);

    let col2 = await my_rd.column(1);
    expect(col2 instanceof Int32Array).toBe(true);
    expect(col2.length).toBe(20);
})
