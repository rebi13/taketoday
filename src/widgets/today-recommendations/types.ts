// 화면이 server/services의 TodayRecommendations를 그대로 넘긴다. 필요한 모양만 적는다
export type TodayMissionData = {
  missionId: string;
  name: string;
  zone: { id: string; name: string; icon: string } | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  userModified: boolean;
  templateCriteria: string | null;
  status: "pending" | "done" | "postponed" | "canceled";
};

export type TodayData = {
  missions: TodayMissionData[];
  pendingRewards: number;
};
