
import { javaClasses } from '../../src/remote/java';


class A {

}

class B {

}


test('Test JavaClasses', () => {

    javaClasses.register(A, "foo.A");
    javaClasses.register(B, "foo.B");

    const classA = javaClasses.forName("foo.A");

    expect(classA.name).toBe("foo.A");

    const classB = javaClasses.forType(B);

    expect(classB.name).toBe("foo.B");

});


// Is order guaranteed here?

test("Error for Duplicate Registration", () => {

    expect(() => javaClasses.register(A, "foo.B"))
        .toThrow("Already registered");

});