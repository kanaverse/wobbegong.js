import * as wob from "../src/index.js";
import { localFetchRange, localFetchJson } from "./utils.js";
import * as fs from "fs";
import * as p from "path";
import * as u from "url";

test("load works for SummarizedExperiments", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full");
    const my_se = await wob.load(path, localFetchJson, localFetchRange);
    expect(my_se instanceof wob.SummarizedExperiment).toBe(true);
    expect(my_se.numberOfRows()).toEqual(50);
    expect(my_se.numberOfColumns()).toEqual(20);
})

test("load works for DataFrames", async () => {
    const path = p.join(p.dirname(u.fileURLToPath(import.meta.url)), "mock-files", "full", "column_data");
    const my_df = await wob.load(path, localFetchJson, localFetchRange);
    expect(my_df instanceof wob.DataFrame).toBe(true);
    expect(my_df.numberOfRows()).toEqual(20);
    expect(my_df.numberOfColumns()).toEqual(4);
})
