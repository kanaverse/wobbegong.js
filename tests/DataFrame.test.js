import * as df from "../src/DataFrame.js";
import { localFetchRange } from "./utils.js";
import * as fs from "fs";
import * as p from "path";
import * as u from "url";

test("DataFrame works as expected", async () => {
    const colpath = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full", "column_data");
    const summary = JSON.parse(fs.readFileSync(p.join(colpath, "summary.json")));
    const my_df = new df.DataFrame(summary, colpath, localFetchRange);

    // Checking the dimensions.
    expect(my_df.numberOfRows()).toEqual(20);
    expect(my_df.numberOfColumns()).toEqual(4);

    // Checking the row names.
    expect(my_df.hasRowNames()).toBe(false);
    expect(await my_df.rowNames()).toBeNull();

    // Checking the column names.
    expect(my_df.columnNames()).toEqual([ "blah", "whee", "stuff", "gunk" ]);
    expect(my_df.columnNames({ types: true })).toEqual([ 
        { name: "blah", type: "double" }, 
        { name: "whee", type: "boolean" },
        { name: "stuff", type: "string" },
        { name: "gunk", type: "integer" }
    ]);

    // Checking each column.
    let col1 = await my_df.column(0);
    expect(col1 instanceof Float64Array).toBe(true);
    expect(Number.isNaN(col1[0])).toBe(true);

    let col2 = await my_df.column("whee");
    expect(typeof col2[0]).toBe("boolean");
    expect(col2[1]).toBeNull();

    let col3 = await my_df.column(2);
    expect(typeof col3[0]).toBe("string");
    expect(col3[0]).toMatch(/^FOO-[A-Z]+-BAR$/);
    expect(col3[2]).toBeNull();

    let col4 = await my_df.column("gunk", { missing: "raw", type: true });
    expect(col4.type).toBe("integer");
    expect(col4.value instanceof Int32Array).toBe(true);
    expect(col4.value[3]).toEqual(-(2**31));
})

test("DataFrame works as expected with rownames", async () => {
    const rowpath = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full", "row_data");
    const summary = JSON.parse(fs.readFileSync(p.join(rowpath, "summary.json")));
    const my_df = new df.DataFrame(summary, rowpath, localFetchRange);

    // Checking the dimensions.
    expect(my_df.numberOfRows()).toEqual(50);
    expect(my_df.numberOfColumns()).toEqual(1);

    // Checking the row names.
    expect(my_df.hasRowNames()).toBe(true);
    let rn = await my_df.rowNames();
    expect(rn.length).toEqual(50);
    expect(rn[0]).toMatch(/^GENE_[0-9]+$/);
})
