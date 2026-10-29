import { PlusIcon } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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
