import * as wob from "../src/index.js";
import { localFetchRange, localFetchJson } from "./utils.js";
import * as fs from "fs";
import * as p from "path";
import * as u from "url";

test("SummarizedExperiment works as expected", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_se = new wob.SummarizedExperiment(summary, path, localFetchJson, localFetchRange);

    // Checking the dimensions.
    expect(my_se.numberOfRows()).toEqual(50);
    expect(my_se.numberOfColumns()).toEqual(20);

    // Checking the row/coldata.
    expect(my_se.hasRowData()).toBe(true);
    expect(my_se.hasColumnData()).toBe(true);

    let rd = await my_se.rowData();
    expect(rd instanceof wob.DataFrame).toBe(true);
    expect(rd.numberOfRows()).toEqual(50);

    let cd = await my_se.columnData();
    expect(cd instanceof wob.DataFrame).toBe(true);
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

    // Checking the reduced dimensions.
    expect(my_se.isSingleCellExperiment()).toBe(true);

    expect(my_se.reducedDimensionNames()).toEqual(["TSNE", "UMAP"]);

    let first_rd = await my_se.reducedDimension(0);
    expect(first_rd instanceof wob.ReducedDimensionResult).toBe(true);
    expect(first_rd.numberOfRows()).toBe(20);
    expect(first_rd.numberOfColumns()).toBe(4);

    let last_rd = await my_se.reducedDimension(1);
    expect(last_rd instanceof wob.ReducedDimensionResult).toBe(true);
    expect(last_rd.numberOfRows()).toBe(20);
    expect(last_rd.numberOfColumns()).toBe(2);

    // Checking the alternative experiment.
    expect(my_se.alternativeExperimentNames()).toEqual(["ADT"]);

    let first_ae = await my_se.alternativeExperiment(0);
    expect(first_ae instanceof wob.SummarizedExperiment).toBe(true);
    expect(first_ae.numberOfRows()).toBe(3);
    expect(first_ae.numberOfColumns()).toBe(20);

    first_ae = await my_se.alternativeExperiment("ADT");
    expect(first_ae instanceof wob.SummarizedExperiment).toBe(true);
    expect(first_ae.numberOfRows()).toBe(3);
    expect(first_ae.numberOfColumns()).toBe(20);
})

test("SummarizedExperiment works without any details", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "simple");
    const summary = JSON.parse(fs.readFileSync(p.join(path, "summary.json")));
    const my_se = new wob.SummarizedExperiment(summary, path, localFetchJson, localFetchRange);

    // Checking the dimensions.
    expect(my_se.numberOfRows()).toEqual(50);
    expect(my_se.numberOfColumns()).toEqual(20);

    // Checking the row/coldata.
    expect(my_se.hasRowData()).toBe(false);
    expect(my_se.hasColumnData()).toBe(false);
    expect(my_se.isSingleCellExperiment()).toBe(false);

    expect(await my_se.rowData()).toBeNull();
    expect(await my_se.columnData()).toBeNull();
    expect(await my_se.reducedDimensionNames()).toBeNull();
    expect(await my_se.reducedDimension(0)).toBeNull();
    expect(await my_se.alternativeExperimentNames()).toBeNull();
    expect(await my_se.alternativeExperiment(0)).toBeNull();
})
