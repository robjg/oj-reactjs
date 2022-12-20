This folder contains little Proof of Concept snippets created to 
reduce the feedback cycle when developing some new bit of functionality.

Originally these were developed using ReactJs as the module loader, however
since moving to react 18 I've struggle with the

    import ReactDOM from 'react-dom/client';

equivalent in RequireJS.

I've subsequently found https://github.com/systemjs/systemjs/issues/2389 which
shows the format required however I've also tried to use ES6 modules in the
browser which I couldn't get to work, and then Browserify.

$ tsc

then browserfy on the input file you want such as

$ js\test\pocs\src\ojtree.js -d -o bundle.js

Which can then be loaded either in Live Server or as a file directly in Chrome.

The problem is that the Source Maps point at the generated javascript, not the original typescript. Apparently the fix
is to use tsify. However I coudn't get this to work.

$ browserify -p [ tsify ] -d -o bundle.js                
TypeScript error: c:/users/rob/projects/oj-reactjs/test/pocs/src/invokeform.tsx(114,13): Error TS2845: This condition will always return 'false'.

TODO: Work out a simple way to work with a rapid feedback cycle in this project!
