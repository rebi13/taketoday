import { z } from "zod";

// 시드 데이터 스키마. 앱에서는 src/server/db/seed 단계에서 이 스키마로 검증한 뒤 삽입한다.

export const zoneIdSchema = z.enum([
  "desk",
  "bedroom",
  "closet",
  "kitchen",
  "fridge",
  "bathroom",
  "living",
  "entrance",
  "laundry",
  "trash",
  "supplies",
  "pet",
  "plant",
  "car",
]);

export const conditionTagSchema = z.enum([
  "pet",
  "plant",
  "car",
  "aircon",
  "humidifier",
]);
export const seasonSchema = z.enum(["spring", "summer", "autumn", "winter"]);

export const zoneSchema = z.object({
  id: zoneIdSchema,
  name: z.string().min(1),
  icon: z.string().min(1), // lucide-react 아이콘 이름
  order: z.number().int().positive(),
  conditionTag: conditionTagSchema.nullable(), // 조건 구역(반려동물·식물·차량)만 값이 있음
});

export const missionTemplateSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  zoneId: zoneIdSchema,
  name: z.string().min(1).max(40),
  checkCriteria: z.string().min(1).max(80),
  cycleDays: z.number().int().positive(),
  estimatedMinutes: z.number().int().min(1).max(10),
  difficulty: z.enum(["low", "mid", "high"]),
  conditionTags: z.array(conditionTagSchema),
  seasons: z.array(seasonSchema), // 비어 있으면 계절 무관
  shareable: z.boolean(), // 2단계 공유 리스트 템플릿 후보
  defaultOn: z.boolean(), // 온보딩에서 처음부터 켬
});

export const slotTypeSchema = z.enum([
  "wallpaper",
  "floor",
  "window",
  "furniture_left",
  "furniture_right",
  "wall_deco",
  "floor_deco",
  "costume",
]);

export const itemSchema = z.object({
  id: z.string().regex(/^(starter|shop)-\d{2}$/),
  name: z.string().min(1),
  slotType: slotTypeSchema,
  category: z.enum([
    "wallpaper",
    "floor",
    "window_view",
    "furniture_large",
    "furniture",
    "prop",
    "costume",
  ]),
  price: z.number().int().min(0),
  acquisition: z.enum(["starter", "shop"]),
  setId: z.enum(["cozy-morning", "green-room", "night-desk"]).nullable(),
  designNote: z.string().min(1),
  costumeAnchor: z.enum(["head", "body", "paws"]).nullable(),
  asset: z.string().nullable(), // 에셋 제작 전에는 null
});

export const itemSetSchema = z.object({
  id: z.enum(["cozy-morning", "green-room", "night-desk"]),
  name: z.string(),
  mood: z.string(),
});

const boxSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100),
  h: z.number().min(0).max(100),
});

export const roomSlotsSchema = z.object({
  canvas: z.object({
    aspectRatio: z.literal("4:3"),
    unit: z.literal("percent"),
  }),
  defaults: z.record(z.string(), z.string()),
  slots: z
    .array(
      z.object({
        key: z.string(),
        slotType: slotTypeSchema,
        label: z.string(),
        z: z.number().int(),
        box: boxSchema.nullable(),
        note: z.string().optional(),
      }),
    )
    .length(10),
});

export const charactersSchema = z.object({
  types: z
    .array(z.object({ id: z.string(), name: z.string(), concept: z.string() }))
    .length(3),
  parts: z.array(z.string()),
  anchors: z.array(z.enum(["head", "body", "paws"])),
  reactions: z
    .array(
      z.object({
        key: z.string(),
        name: z.string(),
        when: z.string(),
        stage: z.enum(["mvp", "phase2"]),
      }),
    )
    .length(7),
  idleMotion: z.object({
    periodSeconds: z.tuple([z.number(), z.number()]),
    moves: z.array(z.string()),
    respectReducedMotion: z.boolean(),
    pauseWhenHidden: z.boolean(),
  }),
});

export type Zone = z.infer<typeof zoneSchema>;
export type MissionTemplate = z.infer<typeof missionTemplateSchema>;
export type Item = z.infer<typeof itemSchema>;
