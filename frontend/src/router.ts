import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from 'vue-router';

import AlbumListView from '@/views/AlbumListView.vue';
import AlbumView from '@/views/AlbumView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import TermFormView from '@/views/TermFormView.vue';
import TermListView from '@/views/TermListView.vue';
import TermView from '@/views/TermView.vue';
import TrackView from '@/views/TrackView.vue';

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'albums', component: AlbumListView },
    {
      path: '/albums/:id(\\d+)',
      name: 'album',
      component: AlbumView,
      props: readIdParam,
    },
    {
      path: '/tracks/:id(\\d+)',
      name: 'track',
      component: TrackView,
      props: readIdParam,
    },
    { path: '/terms', name: 'terms', component: TermListView },
    { path: '/terms/new', name: 'term-new', component: TermFormView },
    {
      path: '/terms/:id(\\d+)',
      name: 'term',
      component: TermView,
      props: readIdParam,
    },
    {
      path: '/terms/:id(\\d+)/edit',
      name: 'term-edit',
      component: TermFormView,
      props: readIdParam,
    },
    { path: '/:path(.*)*', name: 'not-found', component: NotFoundView },
  ],
});

function readIdParam(route: RouteLocationNormalized): { id: number } {
  return { id: Number(route.params.id) };
}
