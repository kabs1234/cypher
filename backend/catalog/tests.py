from rest_framework import status
from rest_framework.test import APITestCase

from .models import Album, Artist, Term, TermType, Track, TrackReference

TRACK_DURATION_SECONDS = 120


class TrackReferenceApiTests(APITestCase):
    def setUp(self) -> None:
        artist = Artist.objects.create(name="Test Artist", active_since=2000)
        album = Album.objects.create(title="Test Album", release_year=2020, artist=artist)
        self.track = Track.objects.create(
            title="Song", album=album, track_number=1, duration_seconds=TRACK_DURATION_SECONDS
        )
        self.term = Term.objects.create(
            name="Compton", type=TermType.PLACE, explanation="A city.", sources="https://example.com"
        )

    def post_reference(self, timestamp_seconds: int):
        return self.client.post(
            "/api/references/",
            {
                "track": self.track.id,
                "term": self.term.id,
                "timestamp_seconds": timestamp_seconds,
                "context_note": "note",
            },
            format="json",
        )

    def test_create_returns_names_alongside_ids(self) -> None:
        response = self.post_reference(65)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["track"], self.track.id)
        self.assertEqual(response.data["track_title"], "Song")
        self.assertEqual(response.data["term_name"], "Compton")
        self.assertEqual(response.data["term_type"], "place")
        self.assertEqual(response.data["timestamp"], "1:05")

    def test_timestamp_equal_to_duration_is_accepted(self) -> None:
        response = self.post_reference(TRACK_DURATION_SECONDS)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_timestamp_past_duration_is_rejected(self) -> None:
        response = self.post_reference(TRACK_DURATION_SECONDS + 1)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("timestamp_seconds", response.data)

    def test_negative_timestamp_is_rejected(self) -> None:
        response = self.post_reference(-1)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("timestamp_seconds", response.data)

    def test_duplicate_reference_is_rejected(self) -> None:
        self.post_reference(30)

        response = self.post_reference(30)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_timestamp_past_duration_is_rejected(self) -> None:
        reference = TrackReference.objects.create(
            track=self.track, term=self.term, timestamp_seconds=10, context_note="note"
        )

        response = self.client.patch(
            f"/api/references/{reference.id}/", {"timestamp_seconds": 500}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_term(self) -> None:
        other_term = Term.objects.create(
            name="Fox News", type=TermType.BRAND, explanation="A channel.", sources="https://example.com"
        )
        TrackReference.objects.create(track=self.track, term=self.term, timestamp_seconds=10, context_note="a")
        TrackReference.objects.create(track=self.track, term=other_term, timestamp_seconds=20, context_note="b")

        response = self.client.get(f"/api/references/?term={other_term.id}")

        self.assertEqual([item["term_name"] for item in response.data], ["Fox News"])


class TermApiTests(APITestCase):
    def test_new_term_defaults_to_draft(self) -> None:
        response = self.client.post(
            "/api/terms/",
            {"name": "Compton", "type": "place", "explanation": "A city.", "sources": "https://example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "draft")

    def test_filter_by_type_and_status(self) -> None:
        Term.objects.create(name="Compton", type=TermType.PLACE, explanation="x", sources="https://a.example")
        Term.objects.create(name="Fox News", type=TermType.BRAND, explanation="x", sources="https://b.example")

        response = self.client.get("/api/terms/?type=place&status=draft")

        self.assertEqual([item["name"] for item in response.data], ["Compton"])

    def test_invalid_type_filter_is_rejected(self) -> None:
        response = self.client.get("/api/terms/?type=not-a-type")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_term_returns_404(self) -> None:
        response = self.client.get("/api/terms/999999/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
