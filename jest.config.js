module.exports = {
    transform: {
        "^.+\\.(ts|tsx)$": [ "ts-jest", {
            tsconfig: "tsconfig.json" } 
    ] },
    testMatch: [
        "**/test/**/*.test.(ts|tsx)"
    ]
};
