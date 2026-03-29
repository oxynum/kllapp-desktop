CREATE TYPE "public"."absence_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."absence_type" AS ENUM('vacation', 'sick', 'training', 'remote', 'other');--> statement-breakpoint
CREATE TYPE "public"."calendar_provider" AS ENUM('google', 'outlook', 'apple', 'other');--> statement-breakpoint
CREATE TYPE "public"."email_category" AS ENUM('magic_link', 'invitation', 'notification');--> statement-breakpoint
CREATE TYPE "public"."expense_category_type" AS ENUM('salary', 'freelance', 'general', 'investment');--> statement-breakpoint
CREATE TYPE "public"."expense_type" AS ENUM('actual', 'forecast');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('pending', 'active', 'declined');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('service', 'product', 'training', 'internal');--> statement-breakpoint
CREATE TYPE "public"."recurrence" AS ENUM('once', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."time_entry_type" AS ENUM('worked', 'forecast', 'pipeline');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'collaborator');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."workplace_type" AS ENUM('remote', 'office', 'client');--> statement-breakpoint
CREATE TABLE "absences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" numeric(3, 2) NOT NULL,
	"type" "absence_type" NOT NULL,
	"note" text,
	"approved_by" uuid,
	"status" "absence_status" DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" "calendar_provider" NOT NULL,
	"ics_url" text NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_integration_id" uuid NOT NULL,
	"shared_with_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"email" text,
	"billing_rate" numeric(10, 2),
	"is_absence" boolean DEFAULT false,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "desk_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"desk_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" date NOT NULL,
	"booked_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "desks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"floor_plan_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"label" text NOT NULL,
	"x" numeric(10, 2) NOT NULL,
	"y" numeric(10, 2) NOT NULL,
	"rotation" numeric(6, 2) DEFAULT '0' NOT NULL,
	"width" numeric(10, 2) DEFAULT '60' NOT NULL,
	"height" numeric(10, 2) DEFAULT '40' NOT NULL,
	"is_available" boolean DEFAULT true,
	"zone" text,
	"group_id" text,
	"visible" boolean DEFAULT true,
	"locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "email_category" NOT NULL,
	"recipient_email" text NOT NULL,
	"organization_id" uuid,
	"sent_by" uuid,
	"subject" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "expense_category_type" NOT NULL,
	"parent_id" uuid,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"recurrence" "recurrence" DEFAULT 'once',
	"type" "expense_type" DEFAULT 'actual',
	"description" text,
	"attachment_url" text,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "floor_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workplace_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"floor_number" integer DEFAULT 0 NOT NULL,
	"layout" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"width" integer DEFAULT 1200 NOT NULL,
	"height" integer DEFAULT 800 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'collaborator',
	"is_owner" boolean DEFAULT false,
	"status" "member_status" DEFAULT 'pending',
	"invited_at" timestamp DEFAULT now(),
	"joined_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text,
	"daily_rate" numeric,
	"daily_cost" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "project_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_project_id" uuid NOT NULL,
	"target_project_id" uuid NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"client_id" uuid,
	"parent_id" uuid,
	"type" "project_type" DEFAULT 'service',
	"daily_rate" numeric,
	"fixed_price" numeric,
	"budget" numeric,
	"billable" boolean DEFAULT true NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" "project_status" DEFAULT 'draft',
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" numeric(5, 2) NOT NULL,
	"type" time_entry_type DEFAULT 'worked',
	"probability" integer,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_workplaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workplace_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"email" text,
	"name" text,
	"role" "user_role" DEFAULT 'collaborator',
	"hourly_cost" numeric(10, 2),
	"daily_cost" numeric(10, 2),
	"hours_per_day" numeric(4, 2) DEFAULT '7',
	"status" "user_status" DEFAULT 'active',
	"locale" text DEFAULT 'fr',
	"current_organization_id" uuid,
	"default_workplace_id" uuid,
	"is_super_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "workplaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "workplace_type" DEFAULT 'office' NOT NULL,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"color" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_shares" ADD CONSTRAINT "calendar_shares_calendar_integration_id_calendar_integrations_id_fk" FOREIGN KEY ("calendar_integration_id") REFERENCES "public"."calendar_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_shares" ADD CONSTRAINT "calendar_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desk_bookings" ADD CONSTRAINT "desk_bookings_desk_id_desks_id_fk" FOREIGN KEY ("desk_id") REFERENCES "public"."desks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desk_bookings" ADD CONSTRAINT "desk_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desk_bookings" ADD CONSTRAINT "desk_bookings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desk_bookings" ADD CONSTRAINT "desk_bookings_booked_by_users_id_fk" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desks" ADD CONSTRAINT "desks_floor_plan_id_floor_plans_id_fk" FOREIGN KEY ("floor_plan_id") REFERENCES "public"."floor_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desks" ADD CONSTRAINT "desks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_workplace_id_workplaces_id_fk" FOREIGN KEY ("workplace_id") REFERENCES "public"."workplaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_dependencies" ADD CONSTRAINT "project_dependencies_source_project_id_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_dependencies" ADD CONSTRAINT "project_dependencies_target_project_id_projects_id_fk" FOREIGN KEY ("target_project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_dependencies" ADD CONSTRAINT "project_dependencies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_forecasts" ADD CONSTRAINT "project_forecasts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_forecasts" ADD CONSTRAINT "project_forecasts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workplaces" ADD CONSTRAINT "user_workplaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workplaces" ADD CONSTRAINT "user_workplaces_workplace_id_workplaces_id_fk" FOREIGN KEY ("workplace_id") REFERENCES "public"."workplaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workplaces" ADD CONSTRAINT "user_workplaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_current_organization_id_organizations_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_default_workplace_id_workplaces_id_fk" FOREIGN KEY ("default_workplace_id") REFERENCES "public"."workplaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workplaces" ADD CONSTRAINT "workplaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_shares_unique" ON "calendar_shares" USING btree ("calendar_integration_id","shared_with_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "desk_bookings_desk_date_idx" ON "desk_bookings" USING btree ("desk_id","date");--> statement-breakpoint
CREATE INDEX "desk_bookings_user_date_idx" ON "desk_bookings" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "floor_plans_workplace_floor_idx" ON "floor_plans" USING btree ("workplace_id","floor_number");--> statement-breakpoint
CREATE UNIQUE INDEX "project_dependencies_source_target_idx" ON "project_dependencies" USING btree ("source_project_id","target_project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_forecasts_unique" ON "project_forecasts" USING btree ("project_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "time_entries_user_project_date_idx" ON "time_entries" USING btree ("user_id","project_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_workplaces_unique" ON "user_workplaces" USING btree ("user_id","date");