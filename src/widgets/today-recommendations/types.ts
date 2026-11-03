// 화면이 server/services의 TodayRecommendations를 그대로 넘긴다. 필요한 모양만 적는다
/** 미션 자체의 정보(오늘 더 하기 목록) */
export type TodayMissionInfoData = {
  missionId: string;
  name: string;
  zone: { id: string; name: string; icon: string } | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  userModified: boolean;
  templateCriteria: string | null;
};

export type TodayMissionData = TodayMissionInfoData & {
  status: "pending" | "done" | "postponed" | "canceled";
};

export type TodayData = {
  /** 서울 기준 오늘. 완료·취소할 때 함께 보내 자정을 넘긴 화면을 거른다 */
  date: string;
  /** 추천받은 미션 */
  missions: TodayMissionData[];
  /** 오늘 더 하기로 넣었거나 미션 상세에서 직접 한 미션 */
  extra: TodayMissionData[];
  /** 오늘 더 하기로 고를 수 있는 미션 */
  addable: TodayMissionInfoData[];
  pendingRewards: number;
};
