CREATE TYPE "public"."household" AS ENUM('solo', 'shared');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."assignment_mode" AS ENUM('anyone', 'assigned');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('low', 'mid', 'high');--> statement-breakpoint
CREATE TYPE "public"."list_owner_type" AS ENUM('user', 'group');--> statement-breakpoint
CREATE TYPE "public"."mission_creator" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TYPE "public"."mission_kind" AS ENUM('recurring', 'once');--> statement-breakpoint
CREATE TABLE "user_rest_days" (
	"user_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	CONSTRAINT "user_rest_days_user_id_weekday_pk" PRIMARY KEY("user_id","weekday"),
	CONSTRAINT "user_rest_days_weekday_range" CHECK ("user_rest_days"."weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "character_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" smallint NOT NULL,
	"asset_path" text
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"character_type_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "characters_name_length" CHECK (char_length("characters"."name") between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "mission_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "list_owner_type" NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"zone_id" text NOT NULL,
	"name" text NOT NULL,
	"check_criteria" text NOT NULL,
	"cycle_days" integer NOT NULL,
	"estimated_minutes" smallint NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"condition_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"seasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"shareable" boolean NOT NULL,
	"default_on" boolean NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"template_id" text,
	"template_version" integer,
	"kind" "mission_kind" NOT NULL,
	"name" text NOT NULL,
	"zone_id" text,
	"check_criteria" text NOT NULL,
	"user_modified" boolean DEFAULT false NOT NULL,
	"cycle_days" integer,
	"due_date" date,
	"created_by" "mission_creator" DEFAULT 'user' NOT NULL,
	"assignment_mode" "assignment_mode",
	"assignee_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missions_kind_fields" CHECK (("missions"."kind" = 'recurring' and "missions"."cycle_days" > 0 and "missions"."due_date" is null)
        or ("missions"."kind" = 'once' and "missions"."due_date" is not null and "missions"."cycle_days" is null)),
	CONSTRAINT "missions_name_length" CHECK (char_length("missions"."name") between 1 and 40),
	CONSTRAINT "missions_check_criteria_length" CHECK (char_length("missions"."check_criteria") between 1 and 80),
	CONSTRAINT "missions_template_version_pair" CHECK (("missions"."template_id" is null) = ("missions"."template_version" is null))
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" smallint NOT NULL,
	"condition_tag" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'Asia/Seoul' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "household" "household";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "condition_tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_time" time;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_recommend_count" smallint DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "scheduled_notify_message_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_agreed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_rest_days" ADD CONSTRAINT "user_rest_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_character_type_id_character_types_id_fk" FOREIGN KEY ("character_type_id") REFERENCES "public"."character_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_templates" ADD CONSTRAINT "mission_templates_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_list_id_mission_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."mission_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_template_id_mission_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."mission_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "characters_user_unique" ON "characters" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mission_lists_owner_unique" ON "mission_lists" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "missions_list_id_idx" ON "missions" USING btree ("list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "missions_list_template_unique" ON "missions" USING btree ("list_id","template_id") WHERE "missions"."template_id" is not null and "missions"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_daily_recommend_count_range" CHECK ("users"."daily_recommend_count" between 1 and 10);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_deactivated_at_matches_status" CHECK (("users"."status" = 'deactivated') = ("users"."deactivated_at" is not null));