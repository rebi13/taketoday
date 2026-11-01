// S11 내 미션 목록. 구역별 보기·켜기·끄기는 #15에서 만든다
export default function MissionsPage() {
  return (
    <main className="flex flex-1 flex-col gap-2 px-4 pt-4">
      <h1 className="text-xl font-semibold">내 미션</h1>
      <p className="text-muted-foreground">
        켜 둔 미션을 구역별로 볼 수 있게 준비하고 있어요
      </p>
    </main>
  );
}
