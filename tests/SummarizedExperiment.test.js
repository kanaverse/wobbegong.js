import * as se from "../src/index.js";
import { localFetchRange, localFetchJson } from "./utils.js";
import * as fs from "fs";
import * as p from "path";
import * as u from "url";

test("SummarizedExperiment works as expected", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-sce");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_se = new se.SummarizedExperiment(summary, path, localFetchJson, localFetchRange);

    // Checking the dimensions.
    expect(my_se.numberOfRows()).toEqual(50);
    expect(my_se.numberOfColumns()).toEqual(20);

    // Checking the row/coldata.
    expect(my_se.hasRowData()).toBe(true);
    expect(my_se.hasColumnData()).toBe(true);

    let rd = await my_se.rowData();
    expect(rd instanceof se.DataFrame).toBe(true);
    expect(rd.numberOfRows()).toEqual(50);

    let cd = await my_se.columnData();
    expect(cd instanceof se.DataFrame).toBe(true);
    expect(cd.numberOfRows()).toEqual(20);

    // Checking the assays.
    expect(my_se.assayNames()).toEqual(["counts", "logcounts", "other"]);

    let first_assay = await my_se.assay("counts");
    expect(first_assay.sparse()).toBe(false);
    expect(first_assay.numberOfRows()).toBe(50);
    expect(first_assay.numberOfColumns()).toBe(20);

    let last_assay = await my_se.assay(2);
    expect(last_assay.sparse()).toBe(true);
    expect(last_assay.numberOfRows()).toBe(50);
    expect(last_assay.numberOfColumns()).toBe(20);
})
