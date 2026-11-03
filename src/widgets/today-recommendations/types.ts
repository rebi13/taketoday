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
  /** 서울 기준 오늘. 완료·취소할 때 함께 보내 자정을 넘긴 화면을 거른다 */
  date: string;
  missions: TodayMissionData[];
  pendingRewards: number;
};
