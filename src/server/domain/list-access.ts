import "server-only";

// 미션 리스트에 접근할 수 있는지는 이 함수 하나로만 판단한다(CLAUDE.md "공유 리스트 확장 대비").
// MVP는 개인 리스트(owner_type = user)뿐이다. 2단계에서 그룹 리스트가 생기면
// viewer.groupIds에 소속 그룹을 넣어 부르고, 이 함수만 고친다.

export type ListOwner = {
  ownerType: "user" | "group";
  ownerId: string;
};

export type ListViewer = {
  userId: string;
  /** 소속 그룹. 2단계 전에는 비워 둔다 */
  groupIds?: readonly string[];
};

export function canAccessList(list: ListOwner, viewer: ListViewer): boolean {
  switch (list.ownerType) {
    case "user":
      return list.ownerId === viewer.userId;
    case "group":
      return viewer.groupIds?.includes(list.ownerId) ?? false;
  }
}
