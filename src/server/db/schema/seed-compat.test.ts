import { describe, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import type {
  conditionTagSchema,
  missionTemplateSchema,
  seasonSchema,
} from "../../../../seed/schema";
import type { ConditionTag, Season, difficulty } from "./missions";

// DB 스키마의 값 종류가 seed/schema.ts와 어긋나면 시드 적재(#10)가 깨진다.
describe("시드 스키마와 DB 스키마의 값 종류", () => {
  it("조건 태그", () => {
    expectTypeOf<ConditionTag>().toEqualTypeOf<
      z.infer<typeof conditionTagSchema>
    >();
  });

  it("계절", () => {
    expectTypeOf<Season>().toEqualTypeOf<z.infer<typeof seasonSchema>>();
  });

  it("난이도", () => {
    expectTypeOf<(typeof difficulty.enumValues)[number]>().toEqualTypeOf<
      z.infer<typeof missionTemplateSchema>["difficulty"]
    >();
  });
});
