import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Album, Artist, Term, Track, TrackReference

SEED_DATA_DIR = Path(__file__).resolve().parents[2] / "seed_data"


class Command(BaseCommand):
    help = "Load every album file in catalog/seed_data/ if the database is empty."

    def handle(self, *args: str, **options: str) -> None:
        if Artist.objects.exists():
            self.stdout.write("Database already has data, skipping seed.")
            return
        for seed_file in sorted(SEED_DATA_DIR.glob("*.json")):
            album = load_album_file(seed_file)
            self.stdout.write(self.style.SUCCESS(f"Seeded {album} from {seed_file.name}"))


@transaction.atomic
def load_album_file(seed_file: Path) -> Album:
    data = json.loads(seed_file.read_text(encoding="utf-8"))
    artist = get_or_create_artist(data["artist"])
    album = Album.objects.create(artist=artist, **data["album"])
    tracks_by_number = {
        track["track_number"]: Track.objects.create(album=album, **track) for track in data["tracks"]
    }
    for term in data["terms"]:
        get_or_create_term(term)
    for reference in data["references"]:
        create_reference(reference, tracks_by_number)
    return album


def get_or_create_artist(artist_data: dict) -> Artist:
    artist, _ = Artist.objects.get_or_create(name=artist_data["name"], defaults=artist_data)
    return artist


def get_or_create_term(term_data: dict) -> Term:
    defaults = {**term_data, "sources": "\n".join(term_data["sources"])}
    term, _ = Term.objects.get_or_create(name=term_data["name"], defaults=defaults)
    return term


def create_reference(reference_data: dict, tracks_by_number: dict[int, Track]) -> TrackReference:
    reference = TrackReference(
        track=tracks_by_number[reference_data["track_number"]],
        term=Term.objects.get(name=reference_data["term"]),
        timestamp_seconds=reference_data["timestamp_seconds"],
        context_note=reference_data["context_note"],
    )
    reference.full_clean()
    reference.save()
    return reference
