ALTER TABLE "activities"
  DROP CONSTRAINT "activities_required_fields_when_published";

ALTER TABLE "activities"
  ADD CONSTRAINT "activities_required_fields_when_published"
    CHECK (
      "status" <> 'PUBLISHED'
      OR (
        "title" IS NOT NULL
        AND length(trim("title")) > 0
        AND "slug" IS NOT NULL
        AND length(trim("slug")) > 0
      )
    );
