from django.core.exceptions import ValidationError
from django.db import models

SECONDS_PER_MINUTE = 60


def format_seconds(total_seconds: int) -> str:
    minutes, seconds = divmod(total_seconds, SECONDS_PER_MINUTE)
    return f"{minutes}:{seconds:02d}"


class ContentStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    VERIFIED = "verified", "Verified"


class TermType(models.TextChoices):
    SLANG = "slang", "Slang"
    PERSON = "person", "Person"
    PLACE = "place", "Place"
    EVENT = "event", "Event"
    BRAND = "brand", "Brand"
    RELIGION = "religion", "Religion"
    OTHER = "other", "Other"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Artist(TimeStampedModel):
    name = models.CharField(max_length=200, unique=True)
    city_region = models.CharField(max_length=200, blank=True)
    active_since = models.PositiveSmallIntegerField()
    bio = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Album(TimeStampedModel):
    title = models.CharField(max_length=200)
    release_year = models.PositiveSmallIntegerField()
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="albums")
    overview = models.TextField(blank=True)
    overview_status = models.CharField(
        max_length=10, choices=ContentStatus.choices, default=ContentStatus.DRAFT
    )

    class Meta:
        ordering = ["artist__name", "release_year"]
        constraints = [
            models.UniqueConstraint(fields=["artist", "title"], name="unique_album_title_per_artist"),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.release_year})"


class Track(TimeStampedModel):
    title = models.CharField(max_length=200)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="tracks")
    track_number = models.PositiveSmallIntegerField()
    duration_seconds = models.PositiveIntegerField()

    class Meta:
        ordering = ["album", "track_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["album", "track_number"], name="unique_track_number_per_album"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.track_number}. {self.title}"


class Term(TimeStampedModel):
    name = models.CharField(max_length=200, unique=True)
    type = models.CharField(max_length=10, choices=TermType.choices)
    explanation = models.TextField()
    explanation_ru = models.TextField(blank=True)
    sources = models.TextField()
    status = models.CharField(
        max_length=10, choices=ContentStatus.choices, default=ContentStatus.DRAFT
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"


class TrackReference(TimeStampedModel):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="references")
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="references")
    timestamp_seconds = models.PositiveIntegerField()
    context_note = models.CharField(max_length=300)

    class Meta:
        ordering = ["track", "timestamp_seconds"]
        constraints = [
            models.UniqueConstraint(
                fields=["track", "term", "timestamp_seconds"],
                name="unique_reference_per_track_term_timestamp",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.track.title} @ {format_seconds(self.timestamp_seconds)}: {self.term.name}"

    def clean(self) -> None:
        if self.track_id is None or self.timestamp_seconds is None:
            return
        if self.timestamp_seconds > self.track.duration_seconds:
            raise ValidationError(
                {"timestamp_seconds": timestamp_out_of_range_message(self.track)}
            )


def timestamp_out_of_range_message(track: Track) -> str:
    return (
        f"Timestamp must be between 0 and the track duration "
        f"({track.duration_seconds} seconds) for '{track.title}'."
    )
