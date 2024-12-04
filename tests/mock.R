# Script to mock up some objects of interest.

dir <- "mock-files"
dir.create(dir, showWarnings=FALSE)

library(SingleCellExperiment)
sce <- SingleCellExperiment(list(counts=matrix(rpois(1000, lambda=10), ncol=20), logcounts=matrix(rnorm(1000), ncol=20), other=Matrix::rsparsematrix(50, 20, 0.3)))

rownames(sce) <- sprintf("GENE_%i", seq_len(nrow(sce)))
rowData(sce)$Symbol <- sprintf("NICE_GENE_%i", seq_len(nrow(sce)))

sce$blah <- runif(ncol(sce))
sce$blah[1] <- NA
sce$whee <- rbinom(ncol(sce), 1, 0.5) == 1
sce$whee[2] <- NA
sce$stuff <- sprintf("FOO-%s-BAR", sample(LETTERS, ncol(sce)))
sce$stuff[3] <- NA
sce$gunk <- sample(100, ncol(sce))
sce$gunk[4] <- NA

reducedDim(sce, "TSNE") <- matrix(rnorm(ncol(sce) * 4), nrow=ncol(sce))
reducedDim(sce, "UMAP") <- matrix(rpois(ncol(sce) * 2, lambda=10), nrow=ncol(sce))

adt.se <- SummarizedExperiment(list(counts=as(matrix(rpois(60, lambda=0.5), ncol=20), "SVT_SparseMatrix")))
altExp(sce, "ADT", withDimnames=FALSE) <- adt.se

library(wobbegong)
local({
    path <- file.path(dir, "full")
    unlink(path, recursive=TRUE)
    wobbegongify(sce, path)
})

local({
    simple <- as(sce, "SummarizedExperiment")
    dimnames(simple) <- list(NULL, NULL)
    rowData(simple) <- rowData(simple)[,0]
    colData(simple) <- colData(simple)[,0]

    path <- file.path(dir, "simple")
    unlink(path, recursive=TRUE)
    wobbegongify(simple, path)
})
