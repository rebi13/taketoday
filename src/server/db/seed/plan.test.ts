import { describe, expect, it } from "vitest";
import type { MissionTemplate } from "../../../../seed/schema";
import { pickMissionsToSync, planTemplates, type SyncCandidate } from "./plan";

const template = (
  id: string,
  overrides: Partial<MissionTemplate> = {},
): MissionTemplate => ({
  id,
  zoneId: "desk",
  name: "책상 위 컵 치우기",
  checkCriteria: "책상 위 컵을 모두 싱크대에 옮기면 완료",
  cycleDays: 1,
  estimatedMinutes: 1,
  difficulty: "low",
  conditionTags: [],
  seasons: [],
  shareable: false,
  defaultOn: true,
  ...overrides,
});

const existing = (id: string, version = 1, t = template(id)) => ({
  id,
  name: t.name,
  checkCriteria: t.checkCriteria,
  version,
});

describe("planTemplates", () => {
  it("빈 DB면 모두 버전 1로 넣는다", () => {
    const plan = planTemplates([template("desk-01"), template("desk-02")], []);
    expect(plan.added).toEqual(["desk-01", "desk-02"]);
    expect(plan.rows.map((r) => r.version)).toEqual([1, 1]);
    expect(plan.textChanged).toEqual([]);
  });

  it("같은 시드를 다시 넣으면 버전이 그대로다", () => {
    const plan = planTemplates([template("desk-01")], [existing("desk-01", 3)]);
    expect(plan.added).toEqual([]);
    expect(plan.textChanged).toEqual([]);
    expect(plan.rows[0].version).toBe(3);
  });

  it("완료 기준이 바뀌면 버전을 올린다", () => {
    const plan = planTemplates(
      [template("desk-01", { checkCriteria: "컵을 모두 싱크대에 두면 완료" })],
      [existing("desk-01", 2)],
    );
    expect(plan.textChanged).toEqual(["desk-01"]);
    expect(plan.rows[0].version).toBe(3);
  });

  it("이름이 바뀌어도 버전을 올린다", () => {
    const plan = planTemplates(
      [template("desk-01", { name: "책상 컵 치우기" })],
      [existing("desk-01")],
    );
    expect(plan.rows[0].version).toBe(2);
  });

  it("주기·태그만 바뀌면 버전은 그대로 두고 값은 고친다", () => {
    const plan = planTemplates(
      [template("desk-01", { cycleDays: 3, seasons: ["summer"] })],
      [existing("desk-01")],
    );
    expect(plan.textChanged).toEqual([]);
    expect(plan.rows[0]).toMatchObject({
      version: 1,
      cycleDays: 3,
      seasons: ["summer"],
    });
  });

  it("시드에서 빠진 템플릿은 지우지 않고 알린다", () => {
    const plan = planTemplates(
      [template("desk-01")],
      [existing("desk-01"), existing("desk-99")],
    );
    expect(plan.orphaned).toEqual(["desk-99"]);
    expect(plan.rows.map((r) => r.id)).toEqual(["desk-01"]);
  });
});

describe("pickMissionsToSync", () => {
  const mission = (id: string, overrides: Partial<SyncCandidate> = {}) => ({
    id,
    userModified: false,
    deletedAt: null,
    templateVersion: 1,
    ...overrides,
  });

  it("고치지 않은 미션은 새 문장으로 바꾼다", () => {
    expect(pickMissionsToSync([mission("a")], 2)).toEqual(["a"]);
  });

  it("사용자가 고친 완료 기준은 시드 갱신에 덮어쓰지 않는다", () => {
    expect(
      pickMissionsToSync(
        [mission("a", { userModified: true }), mission("b")],
        2,
      ),
    ).toEqual(["b"]);
  });

  it("지운 미션과 이미 반영한 미션은 건너뛴다", () => {
    expect(
      pickMissionsToSync(
        [
          mission("a", { deletedAt: new Date() }),
          mission("b", { templateVersion: 2 }),
        ],
        2,
      ),
    ).toEqual([]);
  });
});
