ALTER TABLE "activities"
  ALTER COLUMN "title" DROP NOT NULL,
  ALTER COLUMN "slug" DROP NOT NULL,
  ALTER COLUMN "starts_at" DROP NOT NULL,
  ALTER COLUMN "registration_opens_at" DROP NOT NULL,
  ALTER COLUMN "registration_closes_at" DROP NOT NULL;

ALTER TABLE "activities"
  DROP CONSTRAINT "activities_title_not_empty",
  DROP CONSTRAINT "activities_slug_not_empty",
  DROP CONSTRAINT "activities_team_limits_valid";

ALTER TABLE "activities"
  ADD CONSTRAINT "activities_required_fields_when_published"
    CHECK (
      "status" <> 'PUBLISHED'
      OR (
        "title" IS NOT NULL
        AND length(trim("title")) > 0
        AND "slug" IS NOT NULL
        AND length(trim("slug")) > 0
        AND "starts_at" IS NOT NULL
        AND "registration_opens_at" IS NOT NULL
        AND "registration_closes_at" IS NOT NULL
      )
    ),
  ADD CONSTRAINT "activities_team_limits_valid"
    CHECK (
      "status" <> 'PUBLISHED'
      OR (
        ("registration_mode" = 'INDIVIDUAL' AND "min_team_members" IS NULL AND "max_team_members" IS NULL)
        OR ("registration_mode" = 'TEAM' AND "min_team_members" > 0 AND "max_team_members" >= "min_team_members")
      )
    );
