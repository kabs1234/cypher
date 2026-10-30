from django.contrib import admin

from .models import Album, Artist, Term, Track, TrackReference


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ["name", "city_region", "active_since"]
    search_fields = ["name"]


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "release_year", "overview_status"]
    list_filter = ["overview_status", "artist"]
    search_fields = ["title"]


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ["track_number", "title", "album", "duration_seconds"]
    list_filter = ["album"]
    search_fields = ["title"]


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "status"]
    list_filter = ["type", "status"]
    search_fields = ["name", "explanation"]


@admin.register(TrackReference)
class TrackReferenceAdmin(admin.ModelAdmin):
    list_display = ["track", "timestamp_seconds", "term", "context_note"]
    list_filter = ["track__album", "term__type"]
    search_fields = ["term__name", "track__title", "context_note"]
