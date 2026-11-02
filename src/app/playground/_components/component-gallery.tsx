import { PlusIcon } from "lucide-react";

import { CharacterFigure } from "@/entities/character";
import { MissionCard, ZoneBadge } from "@/entities/mission";
import { GoogleSignInButton } from "@/features/sign-in";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Switch } from "@/shared/ui/switch";
import { Input } from "@/shared/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

// shared/ui에 컴포넌트나 변형을 추가하면 여기에도 추가한다 (CLAUDE.md UI 규칙).
const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;
const BUTTON_ICON_SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;
const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;
const TABS_VARIANTS = ["default", "line"] as const;
const SHEET_SIDES = ["bottom", "right", "left", "top"] as const;
const MISSION_STATUSES = [
  "none",
  "pending",
  "done",
  "postponed",
  "canceled",
] as const;

export function ComponentGallery() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Button">
        <div className="flex flex-col gap-3">
          {BUTTON_VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-2">
              <code className="w-24 text-xs text-muted-foreground">
                {variant}
              </code>
              {BUTTON_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size}
                </Button>
              ))}
              {BUTTON_ICON_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={variant}
                  size={size}
                  aria-label={size}
                >
                  <PlusIcon />
                </Button>
              ))}
              <Button variant={variant} disabled>
                disabled
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>카드 제목</CardTitle>
              <CardDescription>설명 문장이 들어갑니다.</CardDescription>
              <CardAction>
                <Badge variant="secondary">배지</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>본문 내용</CardContent>
            <CardFooter>
              <Button>주요 동작</Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>size=sm</CardTitle>
              <CardDescription>작은 카드</CardDescription>
            </CardHeader>
            <CardContent>본문 내용</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tabs">
        <div className="flex flex-col gap-4">
          {TABS_VARIANTS.map((variant) => (
            <Tabs key={variant} defaultValue="one">
              <TabsList variant={variant}>
                <TabsTrigger value="one">{variant} 하나</TabsTrigger>
                <TabsTrigger value="two">둘</TabsTrigger>
                <TabsTrigger value="three" disabled>
                  셋
                </TabsTrigger>
              </TabsList>
              <TabsContent value="one">첫 번째 탭 내용</TabsContent>
              <TabsContent value="two">두 번째 탭 내용</TabsContent>
            </Tabs>
          ))}
        </div>
      </Section>

      <Section title="Dialog">
        <div className="flex">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">팝업 열기</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>팝업 제목</DialogTitle>
                <DialogDescription>팝업 설명 문장입니다.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">나중에</Button>
                </DialogClose>
                <Button>확인</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Section>

      <Section title="Sheet">
        <div className="flex flex-wrap gap-2">
          {SHEET_SIDES.map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="outline">{side}</Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle>시트 제목</SheetTitle>
                  <SheetDescription>side=&quot;{side}&quot;</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </Section>

      <Section title="Checkbox">
        <p className="text-sm text-muted-foreground">
          상자는 20px이고 누르는 영역은 44×44다.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox /> 기본
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox defaultChecked /> 체크됨
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox disabled /> 비활성
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox aria-invalid /> 오류
          </label>
        </div>
      </Section>

      <Section title="Input">
        <p className="text-sm text-muted-foreground">
          높이 44px, 글자 16px(iOS 확대 방지).
        </p>
        <div className="grid max-w-sm gap-3">
          <Input placeholder="기본" />
          <Input defaultValue="입력한 값" />
          <Input placeholder="비활성" disabled />
          <Input defaultValue="오류" aria-invalid />
        </div>
      </Section>

      <Section title="Switch">
        <p className="text-sm text-muted-foreground">
          스위치는 작고, 누르는 영역은 위아래로 넓혀 44px 이상이다.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex min-h-11 items-center gap-3">
            <Switch /> 꺼짐
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <Switch defaultChecked /> 켜짐
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <Switch disabled /> 비활성
          </label>
        </div>
      </Section>

      <Section title="DropdownMenu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">메뉴 열기</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto">
            <DropdownMenuItem>기본 항목</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">지우기</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section title="ZoneBadge (entities/mission)">
        <div className="flex flex-wrap gap-2">
          <ZoneBadge zone={{ name: "책상·작업공간", icon: "monitor" }} />
          <ZoneBadge zone={{ name: "욕실", icon: "bath" }} />
          <ZoneBadge zone={null} />
        </div>
      </Section>

      <Section title="MissionCard (entities/mission)">
        <div className="grid gap-2 mid:grid-cols-2">
          {MISSION_STATUSES.map((status) => (
            <MissionCard
              key={status}
              status={status}
              name={`책상 위 컵 치우기 · ${status}`}
              meta="매일"
            />
          ))}
          <MissionCard
            size="compact"
            name="compact"
            meta="3일마다"
            actions={<Switch defaultChecked aria-label="켜기" />}
          />
          <MissionCard
            size="compact"
            active={false}
            name="compact · active=false"
            meta="꺼 둠"
            actions={<Switch aria-label="켜기" />}
          />
        </div>
      </Section>

      <Section title="CharacterFigure (entities/character, 임시 도형)">
        <div className="flex flex-wrap gap-4">
          {["dust-bunny", "cat", "hamster"].map((id) => (
            <div key={id} className="flex flex-col items-center gap-1">
              <CharacterFigure typeId={id} label={id} className="size-20" />
              <span className="text-xs text-muted-foreground">{id}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="GoogleSignInButton (features/sign-in)">
        <p className="text-sm text-muted-foreground">
          구글 브랜드 가이드 값이라 토큰을 바꿔도 색이 따라가지 않는다. 누르면
          실제로 로그인한다.
        </p>
        <div className="max-w-sm">
          <GoogleSignInButton />
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
