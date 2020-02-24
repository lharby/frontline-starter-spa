/**
 * A utility for working with matrices.
 *
 * @module utils/calc/matrix
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { isArray } from "../typeCheckers";

/**
 * Check if all the rows in a matrix have the same amount of columns
 *
 * @example
 * import { isMatrix } from "./utils/calc/matrix";
 *
 * const matrix = [
 *     [1, 2, 3],
 *     [3, 4, 5],
 *     [5, 6],
 * ];
 * const matrixIsValid = isMatrix(matrix); // false
 *
 * @param {Number[][]} matrix - An array of arrays
 * @returns {Boolean}
 */
export function isMatrix(matrix) {
    if (!isArray(matrix)) {
        return false;
    }

    const rowCount = matrix.length;
    let columnCount = 0;

    for (let i = 0; i < rowCount; i += 1) {
        if (!isArray(matrix[i])) {
            return false;
        }

        const columnsInRow = matrix[i].length;

        if (i === 0) {
            columnCount = columnsInRow;
        } else if (columnCount !== columnsInRow) {
            return false;
        }
    }

    return true;
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const checkMatrix = isMatrix;

/**
 * Multiply matrices
 *
 * @example
 *import { multiplyMatrices } from "./utils/calc/matrix";
 *
 * const matrix1 = [
 *     [1, 2, 3],
 *     [3, 4, 5],
 *     [5, 6, 7],
 * ];
 * const matrix2 = [
 *     [10, 11, 12],
 *     [13, 14, 15],
 *     [16, 17, 18],
 * ];
 * const newMatrix = multiplyMatrices(matrix1, matrix2);
 * // The first number here i calculated like this: 1 * 10 + 2 * 13 + 3 * 16 = 84
 *
 * @param {...Number[][]} matrices - Two or more two dimensional arrays
 * @returns {Number[][]}
 */
export function multiplyMatrices(...matrices) {
    function multiply(m1, m2) {
        const result = [];

        for (let row = 0, rowLength = m1.length; row < rowLength; row += 1) {
            result[row] = [];

            for (
                let column = 0, columnLength = m2[0].length;
                column < columnLength;
                column += 1
            ) {
                let sum = 0;

                for (
                    let cell = 0, cellLength = m1[0].length;
                    cell < cellLength;
                    cell += 1
                ) {
                    sum += m1[row][cell] * m2[cell][column];
                }

                result[row][column] = sum;
            }
        }

        return result;
    }

    let previousMatrix;
    let finalMatrix;

    for (const index in matrices) {
        if (isMatrix(matrices[index])) {
            const matrix = matrices[index];

            if (previousMatrix) {
                finalMatrix = previousMatrix = multiply(previousMatrix, matrix);
            } else {
                previousMatrix = matrix;
            }
        } else {
            throw new Error("Invalid matrix");
        }
    }

    return finalMatrix;
}
