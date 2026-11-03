// 화면이 server/services의 MissionDetail을 그대로 넘긴다. 필요한 모양만 적는다
export type MissionDetailData = {
  id: string;
  name: string;
  zone: { id: string; name: string; icon: string } | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  userModified: boolean;
  active: boolean;
  fromTemplate: boolean;
  templateCriteria: string | null;
  lastDoneDate: string | null;
  today: string;
  doneToday: boolean;
};
