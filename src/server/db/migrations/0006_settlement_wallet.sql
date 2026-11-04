CREATE TYPE "public"."wallet_reason" AS ENUM('personal_reward', 'shared_reward', 'purchase', 'gacha', 'gacha_refund', 'bonus_roulette');--> statement-breakpoint
CREATE TABLE "daily_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"rewarded_count" smallint NOT NULL,
	"amount" integer NOT NULL,
	"settled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_settlements_amount_non_negative" CHECK ("daily_settlements"."amount" >= 0 and "daily_settlements"."rewarded_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" "wallet_reason" NOT NULL,
	"related_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_amount_nonzero" CHECK ("wallet_transactions"."amount" <> 0)
);
--> statement-breakpoint
ALTER TABLE "daily_settlements" ADD CONSTRAINT "daily_settlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_settlements_user_date_unique" ON "daily_settlements" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE INDEX "wallet_transactions_user_idx" ON "wallet_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_transactions_reward_once" ON "wallet_transactions" USING btree ("user_id","reason","related_id") WHERE "wallet_transactions"."reason" in ('personal_reward', 'shared_reward') and "wallet_transactions"."related_id" is not null;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_settlement_id_daily_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."daily_settlements"("id") ON DELETE no action ON UPDATE no action;