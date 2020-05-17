import { ZoneRecovery } from "../src/models/ZoneRecovery";
describe("compiler: codegen", () => {
  test("adds 1 + 2 to equal 3", () => {
    console.table(ZoneRecovery.calcSteps(10, 3));

    // expect(2 + 2).toBe(3);
  });
});
