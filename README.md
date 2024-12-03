# Access a wobbegong-formatted SummarizedExperiment

![Unit tests](https://github.com/kanaverse/wobbegong.js/actions/workflows/run-tests.yaml/badge.svg)
![Documentation](https://github.com/kanaverse/wobbegong.js/actions/workflows/build-docs.yaml/badge.svg)
[![NPM](https://img.shields.io/npm/v/wobbegong.svg)](https://npmjs.org/package/wobbegong)

## Overview

The [**wobbegong**](https://github.com/kanaverse/wobbegong-R) specification supports the retrieval of parts of a SummarizedExperiment object via HTTP range requests on static files. 
This allows web applications to fetch and visualize assay data, reduced dimension results, etc. without the need to download the entire object or implement custom server logic. 
The **wobbegong.js** library provides an easy-to-use Javascript interface that handles the process of decoding the ranges from **wobbegong**-formatted files.

## Quick start

First, we install the **wobbegong** library from [npm](https://npmjs.com/package/wobbegong) via the usual method:

```bash
npm install wobbegong
```

Developers are expected to know how to fetch content from their static file server.
For example, we could define the relevant fetching functions as below:

```js
const url = "https://my.wobbegong.host.com";

// Define a method to retrieve JSON from the wobbegong-hosted files.
// This typically uses fetch() on a web browser:
const fetch_json = async (path) => {
    const res = await fetch(url+ "/" + path);
    if (!res.ok) {
        throw new Error("oops, failed to retrieve '" + path + "' (" + String(res.status) + ")");
    }
    return res.json();
};

// Define a method to do range requests on wobbegong-hosted files:
const fetch_range = async (path, start, end) => {
    const res = await fetch(
        url + "/" + path,
        { headers: { Range: "bytes=" + String(start) + "-" + String(end-1) } }
    );
    if (!res.ok) {
        throw new Error("oops, failed to retrieve range from '" + path + "' (" + String(res.status) + ")");
    }
    let output = await res.bytes();
    return output.slice(0, end - start); // trim off any excess junk
};
```

Once that's done, we use the **wobbegong.js** library to set up our interface to the SummarizedExperiment:

```js
import * as wob from "wobbegong";
const se_summary = await fetch_json("my_dataset/summary.json");
const se = new wob.SummarizedExperiment(se_summary, "my_dataset", fetch_json, fetch_range)
se.numberOfRows();
se.numberOfColumns();
```

## Retrieving row/column data

Row data will be returned as a DataFrame, or `null` if no row data is available.

```js
se.hasRowData(); // indicates whether row data is available
const rowd = await se.rowData(); // null if the above is false.
rowd.numberOfRows();
rowd.columnNames();
```

Each column of the DataFrame can be retrieved by index or name, returning an array of the same length.

```js
await rowd.column(0); // first column
await rowd.column("whee"); // can also access by name
```

We can also check if there are any row names on the DataFrame.
If present, this returns an array of strings.

```js
rowd.hasRowNames();
await rowd.rowNames(); // null if no row names are present
```

The same applies to the column data.

```js
const cold = await se.columnData();
cold.numberOfRows();
cold.columnNames();
await cold.column(0);
await cold.column("whee");
```

## Retrieving assays

We can check the available assays in the SummarizedExperiment:

```js
se.assayNames();
```

And then retrieve each matrix by name or index:

```js
const first_assay = await se.assay(0);
const log_assay = await se.assay('logcounts');
```

Each assay matrix from the same SummarizedExperiment will have the same number of rows and columns, but may have different types or sparsity.

```js
log_assay.numberOfRows();
log_assay.numberOfColumns();
log_assay.type(); // usually one of integer, double or boolean
log_assay.sparse();
```

The only way to extract data from a matrix is by row, which optimizes for per-gene access.
For dense matrices, this returns an array of length equal to the number of columns;
for sparse matrices, this returns an object with `value` and `index` properties that specify the value and column index, respectively, of each structural non-zero element.
Developers can forcibly return a dense array in all situations by setting `asDense: true`.

```js
const vals = await log_assay.row(0);
const vals2 = await log_assay.row(0, { asDense: true }); // always returns dense array
```

Developers may also like to inspect pre-computed statistics such as the column sums or the number of detected genes in each column.
In particular, the column sums can be used to perform library size normalization of count data prior to visualization. 

```js
log_assay.statisticNames(); // see available stats.
const colsums = await log_assay.statistic("column_sum");
```

## Retrieving reduced dimensions

As with the assays, we can check the available reduced dimension results in the SummarizedExperiment:

```js
se.reducedDimensionNames();
```

And then retrieve each result by name or index:

```js
const first_reddim = await se.reducedDimension(0);
const tsne = await se.reducedDimension('TSNE');
```

We can examine various properties of each result:

```js
tsne.numberOfRows();
tsne.numberOfColumns();
tsne.type(); // typically double
```

Each column can then be extracted for visualization.

```js
const tsne_x = await tsne.column(0);
const tsne_y = await tsne.column(1);
```
