import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';


import { createApp } from 'vue';
import Aura from '@primevue/themes/aura';

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    },
});

import App from './App.vue'


app.use(ToastService);



app.mount('#app');
