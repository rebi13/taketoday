// 화면이 server/services의 Records를 그대로 넘긴다. 필요한 모양만 적는다
type Zone = { id: string; name: string; icon: string };

export type RecordEntryData = {
  dailyMissionId: string;
  missionId: string;
  name: string;
  zone: Zone | null;
  status: "pending" | "done" | "postponed" | "canceled";
  recommended: boolean;
  deleted: boolean;
};

export type RecordDayData = {
  date: string;
  entries: RecordEntryData[];
  rewardCount: number;
};

export type RecordsData = {
  today: string;
  days: RecordDayData[];
  zones: { zone: Zone; lastDoneDate: string | null }[];
};
