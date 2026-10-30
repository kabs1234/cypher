import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/source-serif-4/index.css';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import './styles.css';

import { createApp } from 'vue';

import App from './App.vue';
import { router } from './router';

createApp(App).use(router).mount('#app');
