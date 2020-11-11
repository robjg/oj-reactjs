import { Latch, Phaser } from "./testutil"

test("Test Latch with count of two", async () => {

    const latch: Latch = new Latch(2);

    const results: number[] = [];

    setImmediate(() => {
        results.push(42);
        latch.countDown();
    });

    setImmediate(() => {
        results.push(24);
        latch.countDown();
    });

    expect(results.length).toBe(0);

    await latch.promise;

    expect(results.length).toBe(2);

    expect(results).toEqual(expect.arrayContaining([42, 24]));
})

test("Test Latch released more than count", async () => {

    const latch: Latch = new Latch();

    const results: number[] = [];

    setImmediate(() => {
        results.push(42);
        latch.countDown();
        latch.countDown();
    });

    await latch.promise;

    expect(results.length).toBe(1);

    expect(results).toEqual(expect.arrayContaining([42]));
})


test("Phaser over three Phases phases in order", async () => {

    const phaser: Phaser = new Phaser();

    const results: number[] = [];

    setImmediate(() => {
        results.push(42);
        phaser.release();
    });

    expect(results.length).toBe(0);

    await phaser.next();

    expect(results).toEqual(expect.arrayContaining([42]));

    setImmediate(() => {
        results.push(24);
        phaser.release();
    });

    await phaser.next();

    expect(results).toEqual(expect.arrayContaining([42, 24]));
})

test("Phaser release before next", async () => {

    const phaser: Phaser = new Phaser();

    expect(() => phaser.release()).toThrow("Phaser is out of step as phase 0 not started yet.");

})