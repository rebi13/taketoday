import {
  COLOR_TOKENS,
  LAYER_TOKENS,
  MOTION_TOKENS,
  RADIUS_TOKENS,
} from "./tokens";

// 값은 globals.css 토큰을 var()로 읽기만 한다. 테마를 바꾸면 견본도 같이 바뀐다.
export function TokenSwatches() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="색">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map(({ name, pair }) => (
            <li key={name} className="flex flex-col gap-1.5">
              <div
                className="flex h-16 items-center justify-center rounded-lg border text-sm font-medium"
                style={{
                  background: `var(--${name})`,
                  color: pair ? `var(--${pair})` : undefined,
                }}
              >
                {pair ? "가나다 Aa" : null}
              </div>
              <code className="text-xs text-muted-foreground">--{name}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="둥글기">
        <ul className="flex flex-wrap gap-4">
          {RADIUS_TOKENS.map(({ name, className }) => (
            <li key={name} className="flex flex-col items-center gap-1.5">
              <div className={`size-16 border-2 bg-muted ${className}`} />
              <code className="text-xs text-muted-foreground">{name}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="그림자">
        <div className="h-16 w-40 rounded-lg border bg-card shadow-card" />
        <code className="text-xs text-muted-foreground">--shadow-card</code>
      </Section>

      <Section title="모션 (마우스를 올리거나 눌러 확인)">
        <ul className="flex flex-col gap-2">
          {MOTION_TOKENS.map((name) => (
            <li key={name} className="group flex items-center gap-3">
              <div className="h-11 w-48 rounded-lg bg-muted p-1">
                <div
                  className="size-9 rounded-md bg-primary transition-transform group-hover:translate-x-36 group-active:translate-x-36"
                  style={{ transitionDuration: `var(--${name})` }}
                />
              </div>
              <code className="text-xs text-muted-foreground">--{name}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="방 레이어 (아래 → 위)">
        <div className="relative h-40 w-72">
          {LAYER_TOKENS.map((name, i) => (
            <div
              key={name}
              className="absolute flex h-14 w-40 items-start rounded-md border bg-card p-1.5 shadow-card"
              style={{
                zIndex: `var(--${name})`,
                left: `${i * 1.5}rem`,
                top: `${i * 1.25}rem`,
              }}
            >
              <code className="text-xs">--{name}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
