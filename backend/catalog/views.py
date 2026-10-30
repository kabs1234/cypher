from rest_framework import viewsets

from .models import Album, Artist, Term, Track, TrackReference
from .serializers import (
    AlbumSerializer,
    ArtistSerializer,
    TermSerializer,
    TrackReferenceSerializer,
    TrackSerializer,
)


class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer


class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.select_related("artist")
    serializer_class = AlbumSerializer
    filterset_fields = ["artist"]


class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.select_related("album")
    serializer_class = TrackSerializer
    filterset_fields = ["album"]


class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all()
    serializer_class = TermSerializer
    filterset_fields = ["type", "status"]


class TrackReferenceViewSet(viewsets.ModelViewSet):
    queryset = TrackReference.objects.select_related("track", "term")
    serializer_class = TrackReferenceSerializer
    filterset_fields = ["track", "term"]
