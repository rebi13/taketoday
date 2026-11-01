import { describe, expect, it } from "vitest";
import { canAccessList } from "./list-access";

const me = "11111111-1111-1111-1111-111111111111";
const other = "22222222-2222-2222-2222-222222222222";
const group = "33333333-3333-3333-3333-333333333333";

describe("canAccessList", () => {
  it("내 개인 리스트는 볼 수 있다", () => {
    expect(
      canAccessList({ ownerType: "user", ownerId: me }, { userId: me }),
    ).toBe(true);
  });

  it("다른 사람의 개인 리스트는 볼 수 없다", () => {
    expect(
      canAccessList({ ownerType: "user", ownerId: other }, { userId: me }),
    ).toBe(false);
  });

  it("그룹 리스트는 소속 그룹일 때만 볼 수 있다(2단계 대비)", () => {
    const list = { ownerType: "group", ownerId: group } as const;
    expect(canAccessList(list, { userId: me })).toBe(false);
    expect(canAccessList(list, { userId: me, groupIds: [] })).toBe(false);
    expect(canAccessList(list, { userId: me, groupIds: [group] })).toBe(true);
  });

  it("사용자 id와 그룹 id가 우연히 같아도 섞이지 않는다", () => {
    expect(
      canAccessList({ ownerType: "group", ownerId: me }, { userId: me }),
    ).toBe(false);
  });
});
