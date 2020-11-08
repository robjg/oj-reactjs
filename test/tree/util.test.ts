
import { Op, DiffOp, arrayDiff } from '../../src/tree/util';

test("From Empty to Empty", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [], []);

    expect(result).toStrictEqual( [] );
});


test("From Empty to None Empty", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [], [1, 2, 3]);

    expect(result).toStrictEqual( [
        { op: Op.INSERT, value: 1, index: 0 },
        { op: Op.INSERT, value: 2, index: 1 },
        { op: Op.INSERT, value: 3, index: 2 }
    ]);
});

test("Insert Value Before and After", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [2], [1, 2, 3]);

    expect(result).toStrictEqual( [
        { op: Op.INSERT, value: 1, index: 0 },
        { op: Op.INSERT, value: 3, index: 2 }
    ]);
});

test("Remove One", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [1], []);

    expect(result).toStrictEqual( [
        { op: Op.REMOVE, value: 1, index: 0 }
    ]);
});

test("Remove Two", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [1, 2], []);

    expect(result).toStrictEqual( [
        { op: Op.REMOVE, value: 1, index: 0 },
        { op: Op.REMOVE, value: 2, index: 0 }
    ]);
});

test("Delete One Before", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [2, 3], [3]);

    expect(result).toStrictEqual( [
        { op: Op.REMOVE, value: 2, index: 0 },
    ]);
});

test("Delete Value Before and After", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [1, 2, 3], [2]);

    expect(result).toStrictEqual( [
        { op: Op.REMOVE, value: 1, index: 0 },
        { op: Op.REMOVE, value: 3, index: 1 }
    ]);
});

test("Change One value", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [1], [2]);

    expect(result).toStrictEqual( [
        { op: Op.INSERT, value: 2, index: 0 },
        { op: Op.REMOVE, value: 1, index: 1 }
    ]);
});

test("Change 3 values", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [1, 2, 3], [4, 5, 6]);

    expect(result).toStrictEqual( [
        { op: Op.INSERT, value: 4, index: 0 },
        { op: Op.INSERT, value: 5, index: 1 },
        { op: Op.INSERT, value: 6, index: 2 },
        { op: Op.REMOVE, value: 1, index: 3 },
        { op: Op.REMOVE, value: 2, index: 3 },
        { op: Op.REMOVE, value: 3, index: 3 }
    ]);
});

test("Some changes in the middle", () => {

    const result: DiffOp<number>[] = arrayDiff(
        [1, 2, 3], [1, 5, 6, 3, 7]);

    expect(result).toStrictEqual( [
        { op: Op.INSERT, value: 5, index: 1 },
        { op: Op.INSERT, value: 6, index: 2 },
        { op: Op.REMOVE, value: 2, index: 3 },
        { op: Op.INSERT, value: 7, index: 4 },
    ]);
});

