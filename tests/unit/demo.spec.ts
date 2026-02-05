import { add } from "@/utils/demo-util";

describe("add function", () => {
    test("adds two positive numbers", () => {
        const result: number = add(2, 3);
        expect(result).toBe(5);
    });

    test("adds negative numbers", () => {
        const result: number = add(-2, -3);
        expect(result).toBe(-5);
    });
});
