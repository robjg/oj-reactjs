import { javaClasses } from '../../src/remote/remote';


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