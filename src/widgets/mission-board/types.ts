// 화면이 server/services의 MissionBoard를 그대로 넘긴다. 위젯은 서버 모듈을 가져오지 않으므로
// 필요한 모양만 여기 적는다(구조가 같으면 그대로 맞는다).

export type BoardZone = { id: string; name: string; icon: string };

export type BoardMission = {
  id: string;
  name: string;
  zoneId: string | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  active: boolean;
  fromTemplate: boolean;
};

export type BoardTemplate = {
  id: string;
  name: string;
  zoneId: string;
  checkCriteria: string;
  cycleDays: number;
};

export type MissionBoardData = {
  zones: BoardZone[];
  mine: BoardMission[];
  browse: BoardTemplate[];
};

export type BoardTab = "mine" | "browse";
