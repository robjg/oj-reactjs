
/**
 * Op Type.
 */
export enum Op { INSERT, REMOVE }

/**
 * Difference Operation to be applied to get from something to something.
 */
export type DiffOp<T> = {
    op: Op;
    value: T;
    index: number;
}

/**
 * Generate operations to change one array or unique values to another. The values are assumed to 
 * be unique and unordered.
 * This has really poor performance as it goes through the second array for each element in the first
 * so its n*n and we could probably do better.
 *  
 * @param from The array to be changed.
 * @param to The array to be changed to.
 * @param equalFn A equality function. Defaults to ==.
 */
export function arrayDiff<T>(from: T[], to: T[],
    equalFn: (a: T, b: T) => boolean = (a: T, b: T) => a == b): DiffOp<T>[] {

    const ops: DiffOp<T>[] = [];

    var lastI = 0, insertPoint = 0;

    for (var j = 0; j < to.length; ++j) {

        var found = false;

        // go though the to list until two values match
        for (var i = lastI; i < from.length; ++i) {

            if (equalFn(to[j], from[i])) {
                // If we find a match we delete everything in the first up to this point.
                for (; lastI < i; ++lastI) {
                    ops.push({ op: Op.REMOVE, value: from[lastI], index: insertPoint });
                }
                ++lastI;
                ++insertPoint;
                found = true;
                break;
            }
        }


        if (!found) {
            // if we don't find a match we need insert the value from the second. 
            ops.push({ op: Op.INSERT, value: to[j], index: insertPoint++ });
        }
    }

    // everything else in the froms needs to be deleted.
    for (var i = lastI; i < from.length; ++i) {
        ops.push({ op: Op.REMOVE, value: from[i], index: insertPoint });
    }

    return ops;
}
