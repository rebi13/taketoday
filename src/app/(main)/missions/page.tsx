// 넓은 화면(840 이상)에서 아직 미션을 고르지 않았을 때 오른쪽 영역. 좁은 화면에서는 숨는다
export default function MissionsPage() {
  return (
    <p className="rounded-xl bg-muted px-4 py-10 text-center text-muted-foreground">
      미션을 누르면 여기에서 완료 기준과 주기를 볼 수 있어요.
    </p>
  );
}
