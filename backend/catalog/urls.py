from rest_framework.routers import DefaultRouter

from .views import AlbumViewSet, ArtistViewSet, TermViewSet, TrackReferenceViewSet, TrackViewSet

router = DefaultRouter()
router.register("artists", ArtistViewSet)
router.register("albums", AlbumViewSet)
router.register("tracks", TrackViewSet)
router.register("terms", TermViewSet)
router.register("references", TrackReferenceViewSet)

urlpatterns = router.urls
