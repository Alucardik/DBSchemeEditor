// Functional Dependency: LHS → RHS (LHS - determinant attributes, RHS - dependent attributes)
import { TableDependency } from "@/app/models/scheme"
import { Optional } from "@/libs/utils/types"

interface FD {
    lhs: Set<string>
    rhs: Set<string>
}

export class DependencyMatrix {
    private readonly rows: FD[]
    private canonizedRows: FD[]
    private attrList: string[] = []

    constructor(dependencies: TableDependency[] = []) {
        this.rows = []
        this.canonizedRows = []

        for (const dependency of dependencies) {
            this.rows.push({
                lhs: new Set(dependency.determinants),
                rhs: new Set(dependency.dependants),
            })
        }
    }

    /**
     * Return the set of all attributes in matrix, sorted alphabetically
     * (either in LHS or RHS of any FD)
     */
    GetAllAttributes(): ReadonlyArray<string> {
        if (this.attrList.length > 0) {
            return this.attrList
        }

        const attrs = new Set<string>()
        for (const { lhs, rhs } of this.rows) {
            for (const a of lhs) attrs.add(a)
            for (const a of rhs) attrs.add(a)
        }

        this.attrList = Array.from(attrs.values()).toSorted()

        return this.attrList
    }


    // Follows the inner canonized row order of the matrix
    //  - need to call 'Canonize' first
    GetCanonizedDeterminantsCountPerRow(): number[] {
        return this.canonizedRows.map(r => r.lhs.size)
    }

    // Returns the number of times each attribute appear as determinant among all dependencies
    //  the array follows GetAllAttributes attribute order
    GetCanonizedDeterminantOrderPerAttribute(): number[] {
        const attrs = this.GetAllAttributes()
        const ret = new Array(attrs.length).fill(0)
        const attrOrderMapping = new Map<string, number>()
        for (const [i, a] of attrs.entries()) {
            attrOrderMapping.set(a, i)
        }

        for (const { lhs } of this.canonizedRows) {
            for (const a of lhs) {
                const attrIndex = attrOrderMapping.get(a)
                if (attrIndex) {
                    ret[attrIndex] += 1
                }
            }
        }

        return ret
    }

    // GetCanonizedMatrixValue returns:
    //  1 – if the requested attribute is in the lhs of the requested row
    //  0 – if the requested attribute is in the rhs of the requested row
    // null - otherwise
    GetCanonizedMatrixValue(this: DependencyMatrix, rowIndex: number, colIndex: number): Optional<number> {
        if (this.canonizedRows.length <= rowIndex) {
            return null
        }

        const attrs = this.GetAllAttributes()
        if (attrs.length <= colIndex) {
            return null
        }

        const attrName = attrs[colIndex]
        if (this.canonizedRows[rowIndex].lhs.has(attrName)) {
            return 1
        }

        if (this.canonizedRows[rowIndex].rhs.has(attrName)) {
            return 0
        }

        return null
    }

    GetCanonizedRow(this: DependencyMatrix, rowIndex: number): Optional<FD> {
        if (this.canonizedRows.length <= rowIndex) {
            return null
        }

        return this.canonizedRows[rowIndex]
    }

    GetCanonizedRows(this: DependencyMatrix): ReadonlyArray<FD> {
        return this.canonizedRows
    }

    MergePseudoTransitiveCanonicalRows(this: DependencyMatrix, attrRow: number, attrValue: 1 | 0): number {
        const rowIndicesToRemove = new Set<number>()

        if (this.canonizedRows.length <= attrRow) {
            return 0
        }

        const dep = this.canonizedRows[attrRow]
        const initialDepRHS = Array.from(dep.rhs.values()).sort()
        // move all dependent attributes from pseudo transitive rows to the currDependency rhs
        for (const attr of initialDepRHS) {
            const pseudoTransitiveRows = this.GetPseudoTransitiveCanonicalRowsByAttribute(attrRow, attr, attrValue)
            for (const [row, rowIndex] of pseudoTransitiveRows) {
                console.log("adding rhs from", rowIndex, row)
                for (const attr of row.rhs) {
                    if (!dep.lhs.has(attr)) {
                        dep.rhs.add(attr)
                    }
                }

                rowIndicesToRemove.add(rowIndex)
            }
        }

        // filter out all pseudo transitive rows
        this.canonizedRows = this.canonizedRows.filter((_, index) => !rowIndicesToRemove.has(index))

        return rowIndicesToRemove.size
    }

    GetPseudoTransitiveCanonicalRowsByAttribute(this: DependencyMatrix, attrRow: number, attrName: string, attrValue: 1 | 0): [FD, number][] {
        const ret = [] as [FD, number][]
        console.log("Checking pseudo transitivity by attr", attrName)

        for (const [i, row] of this.canonizedRows.entries()) {
            if (i === attrRow) {
                continue
            }

            if (attrValue === 0 && row.lhs.has(attrName)) {
                ret.push([row, i])
            }

            if (attrValue === 1 && row.rhs.has(attrName)) {
                ret.push([row, i])
            }
        }

        return ret
    }

    MergeIdenticalDeterminantRows(this: DependencyMatrix): number {
        const mergedDeterminants = new Set<string>()
        const rowIndicesToRemove = new Set<number>()

        for (const [i, row] of this.canonizedRows.entries()) {
            const lhsKey = Array.from(row.lhs.values()).sort().join("_")
            if (mergedDeterminants.has(lhsKey)) {
                continue
            }

            for (const [j, innerRow] of this.canonizedRows.entries()) {
                if (j === i) {
                    continue
                }

                const innerLHSKey = Array.from(innerRow.lhs.values()).sort().join("_")
                if (mergedDeterminants.has(innerLHSKey)) {
                    continue
                }

                // merge rows with the same lhs
                if (lhsKey === innerLHSKey) {
                    console.log("merging")
                    row.rhs = row.rhs.union(innerRow.rhs)
                    rowIndicesToRemove.add(j)
                }
            }

            mergedDeterminants.add(lhsKey)
        }

        // filter out all merged rows
        this.canonizedRows = this.canonizedRows.filter((_, index) => !rowIndicesToRemove.has(index))

        return rowIndicesToRemove.size
    }

    // RemoveDuplicatedDependants checks each fd's lhs for being part of another fd's lhs
    //  and returns the relationships between moved attributes
    // [
    //      [[some of row 0 lhs attrNames]; number of row, which lhs is subset of row's 0 lhs (i.e. fk)],
    // ]
    RemoveDuplicatedDependants(this: DependencyMatrix): [string[], number][][] {
        const ret = new Array(this.canonizedRows.length) as [string[], number][][]
        for (let i = 0; i < this.canonizedRows.length; ++i) {
            ret[i] = []
        }

        console.log("initialized", ret)

        for (const [i, row] of this.canonizedRows.entries()) {
            for (const [j, innerRow] of this.canonizedRows.entries()) {
                if (j === i) {
                    continue
                }

                // overlapping lhs parts require us to remove rhs parts from superset
                if (row.lhs.isSubsetOf(innerRow.lhs)) {
                    innerRow.rhs = innerRow.rhs.difference(row.rhs)
                    ret[j].push([Array.from(row.lhs.values()), i])
                }
            }
        }

        return ret
    }

    Canonize(this: DependencyMatrix): void {
        this.canonizedRows = []

        for (const dependency of this.rows) {
            if (dependency.rhs.size <= 1) {
                this.canonizedRows.push(dependency)
                continue
            }

            // make rhs of size 1 each
            for (const attr of dependency.rhs) {
                this.canonizedRows.push({
                    lhs: dependency.lhs,
                    rhs: new Set([attr]),
                })
            }
        }



        // TODO: add additional canonization steps like ruling out extra attributes and FD
    }

    ToSecondNormalForm(this: DependencyMatrix): [string[], number][][] {
        console.log("Initial fdMatrix\n", this.ToStringInitialRows())

        this.Canonize()

        console.log("Canonized fdMatrix\n", this.ToString())

        let rowIndexToStart = 0
        const startRowCounts = this.GetCanonizedDeterminantsCountPerRow()
        const startColCounts = this.GetCanonizedDeterminantOrderPerAttribute()

        // we select first row in (max ccount, min rcount) manner, going through each rcount in ascending order (ccount is fixed)
        const maxColCount = startColCounts.reduce((maxColCount, currCount) => Math.max(maxColCount, currCount), 0)
        const colCountsMaxIndices = startColCounts.
        map((_, index)  => index).
        filter((index) => startColCounts[index] === maxColCount)

        const rowCountsIndicesAscending = startRowCounts.map((_, index)  => index)
        rowCountsIndicesAscending.sort((a, b) => startRowCounts[a] - startRowCounts[b])

        for (const colIndex of colCountsMaxIndices) {
            for (let i = 0; i < rowCountsIndicesAscending.length; i++) {
                if (this.GetCanonizedMatrixValue(rowCountsIndicesAscending[i], colIndex) === 1) {
                    rowIndexToStart = rowCountsIndicesAscending[i]
                    break
                }
            }
        }

        console.log("Selected row", rowIndexToStart, "first", this.GetCanonizedRow(rowIndexToStart))

        let currRowIndex = rowIndexToStart
        while (true) {
            const rowsMerged = this.MergePseudoTransitiveCanonicalRows(currRowIndex, 0)
            if (rowsMerged <= 0) {
                // we end the cycle as soon, as no rows have been merged
                break
            }

            console.log("Merged", rowsMerged, "by pseudo transitivity fdMatrix\n", this.ToString())

            const rowCounts = this.GetCanonizedDeterminantsCountPerRow()
            const colCounts = this.GetCanonizedDeterminantOrderPerAttribute()

            const maxRowCount = startColCounts.reduce((maxColCount, currCount) => Math.max(maxColCount, currCount), 0)
            const rowCountsMaxIndices = rowCounts.
                map((_, index)  => index).
                filter((index) => rowCounts[index] === maxRowCount)

            const colCountsIndicesAscending = colCounts.map((_, index)  => index)
            colCountsIndicesAscending.sort((a, b) => colCounts[a] - colCounts[b])

            for (const rowIndex of rowCountsMaxIndices) {
                for (let i = 0; i < colCountsIndicesAscending.length; i++) {
                    if (this.GetCanonizedMatrixValue(rowIndex, colCountsIndicesAscending[i]) === 1) {
                        currRowIndex = rowIndex
                        break
                    }
                }
            }

            console.log("Selected", currRowIndex, "next", this.GetCanonizedRow(currRowIndex))
        }

        this.MergeIdenticalDeterminantRows()
        console.log("Merged by identical rows fdMatrix\n", this.ToString())

        const ret = this.RemoveDuplicatedDependants()
        console.log("Removed duplicated dependants fdMatrix\n", this.ToString())

        return ret
    }

    ToStringInitialRows(this: DependencyMatrix): string {
        return this.rows
            .map(
                (r, i) =>
                    `${i}: {${[...r.lhs].join(', ')}} → {${[...r.rhs].join(', ')}}`
            )
            .join('\n');
    }

    /** Debug-only */
    ToString(this: DependencyMatrix): string {
        return this.canonizedRows
            .map(
                (r, i) =>
                    `${i}: {${[...r.lhs].join(', ')}} → {${[...r.rhs].join(', ')}}`
            )
            .join('\n');
    }

    /**
     * Computes  closure({attrs}) based on current FD rows.
     * Principle: while closure enlarges,
     *   for every FD(X→A), if X⊆closure, then add A. (as dependent attribute)
     */
    private Closure(this: DependencyMatrix, attrs: string[], fds: FD[]): Set<string> {
        // TODO: could use extensive memoization
        const closure = new Set<string>(attrs)
        let changed = true

        while (changed) {
            changed = false
            for (const { lhs, rhs } of fds) {
                // if lhs ⊆ closure
                if ([...lhs].every(a => closure.has(a))) {
                    // добавляем rhs
                    for (const a of rhs) {
                        if (!closure.has(a)) {
                            closure.add(a)
                            changed = true
                        }
                    }
                }
            }
        }

        return closure
    }
}