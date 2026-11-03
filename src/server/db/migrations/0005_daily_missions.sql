CREATE TYPE "public"."daily_mission_status" AS ENUM('pending', 'done', 'postponed', 'canceled');--> statement-breakpoint
CREATE TABLE "completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"canceled_at" timestamp with time zone,
	"settlement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"status" "daily_mission_status" DEFAULT 'pending' NOT NULL,
	"recommended" boolean NOT NULL,
	"recommend_rank" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_missions_rank_matches_recommended" CHECK ("daily_missions"."recommended" = ("daily_missions"."recommend_rank" is not null))
);
--> statement-breakpoint
CREATE TABLE "recommendation_days" (
	"user_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_days_user_id_local_date_pk" PRIMARY KEY("user_id","local_date")
);
--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_daily_mission_id_daily_missions_id_fk" FOREIGN KEY ("daily_mission_id") REFERENCES "public"."daily_missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_missions" ADD CONSTRAINT "daily_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_missions" ADD CONSTRAINT "daily_missions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_days" ADD CONSTRAINT "recommendation_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "completions_local_date_idx" ON "completions" USING btree ("local_date");--> statement-breakpoint
CREATE INDEX "completions_user_date_idx" ON "completions" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE UNIQUE INDEX "completions_daily_mission_active_unique" ON "completions" USING btree ("daily_mission_id") WHERE "completions"."canceled_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_missions_user_mission_date_unique" ON "daily_missions" USING btree ("user_id","mission_id","local_date");--> statement-breakpoint
CREATE INDEX "daily_missions_user_date_idx" ON "daily_missions" USING btree ("user_id","local_date");