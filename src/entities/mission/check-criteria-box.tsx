import type { ReactNode } from "react";
import { Badge } from "@/shared/ui/badge";

// 완료 기준 상자(기획서 8.2.1). 데이터 이름은 checkCriteria, 화면에는 "이만큼 하면 완료"
export function CheckCriteriaBox({
  checkCriteria,
  userModified = false,
  action,
}: {
  checkCriteria: string;
  /** 사용자가 고친 기준이면 "내 기준" 표시 */
  userModified?: boolean;
  /** 상자 아래 동작("내 기준으로 바꾸기") */
  action?: ReactNode;
}) {
  return (
    <section
      aria-label="이만큼 하면 완료"
      className="flex flex-col gap-2 rounded-xl bg-muted px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          이만큼 하면 완료
        </h2>
        {userModified && <Badge variant="outline">내 기준</Badge>}
      </div>
      <p className="text-base">{checkCriteria}</p>
      {action && <div>{action}</div>}
    </section>
  );
}
