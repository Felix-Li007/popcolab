import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// runs before every test
beforeEach(() => {
    console.log("Setting up test environment");
    jest.clearAllMocks();
});

// runs after each test
afterEach(() => {
    console.log("Cleaning up after each test");
    cleanup();
    jest.clearAllMocks();
});

// runs once before all tests
beforeAll(() => {
    console.log("Initialize test environment before all tests");
});

// runs once after all tests
afterAll(() => {
    console.log("Cleaning up after all tests");
});
