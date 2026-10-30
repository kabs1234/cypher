from rest_framework import serializers

from .models import (
    Album,
    Artist,
    Term,
    Track,
    TrackReference,
    format_seconds,
    timestamp_out_of_range_message,
)

TIMESTAMP_FIELDS = ["created_at", "updated_at"]


class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ["id", "name", "city_region", "active_since", "bio", *TIMESTAMP_FIELDS]


class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.name", read_only=True)

    class Meta:
        model = Album
        fields = [
            "id",
            "title",
            "release_year",
            "artist",
            "artist_name",
            "overview",
            "overview_status",
            *TIMESTAMP_FIELDS,
        ]


class TrackSerializer(serializers.ModelSerializer):
    album_title = serializers.CharField(source="album.title", read_only=True)

    class Meta:
        model = Track
        fields = [
            "id",
            "title",
            "album",
            "album_title",
            "track_number",
            "duration_seconds",
            *TIMESTAMP_FIELDS,
        ]


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = [
            "id",
            "name",
            "type",
            "explanation",
            "explanation_ru",
            "sources",
            "status",
            "notes",
            *TIMESTAMP_FIELDS,
        ]


class TrackReferenceSerializer(serializers.ModelSerializer):
    track_title = serializers.CharField(source="track.title", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    term_type = serializers.CharField(source="term.type", read_only=True)
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = TrackReference
        fields = [
            "id",
            "track",
            "track_title",
            "term",
            "term_name",
            "term_type",
            "timestamp_seconds",
            "timestamp",
            "context_note",
            *TIMESTAMP_FIELDS,
        ]

    def get_timestamp(self, reference: TrackReference) -> str:
        return format_seconds(reference.timestamp_seconds)

    def validate(self, attrs: dict) -> dict:
        track = attrs.get("track", getattr(self.instance, "track", None))
        timestamp_seconds = attrs.get(
            "timestamp_seconds", getattr(self.instance, "timestamp_seconds", None)
        )
        if timestamp_seconds > track.duration_seconds:
            raise serializers.ValidationError(
                {"timestamp_seconds": timestamp_out_of_range_message(track)}
            )
        return attrs
