import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'
import { onAuthStateChanged } from 'firebase/auth'

import App from './App.vue'
import router from './router'

import vuetify from './plugins/vuetify'
import { auth } from './firebase/config'
import { useAuthStore } from './stores/authStore'

import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuetify)
app.use(VueApexCharts)

const authStore = useAuthStore(pinia)

new Promise((resolve) => {
  let resolved = false

  onAuthStateChanged(auth, (user) => {
    authStore.setUser(user)

    if (!resolved) {
      resolved = true
      resolve()
    }
  })
}).then(() => {
  // router performs its initial navigation as soon as it's installed,
  // so it must run after auth state is known or the route guard redirects
  // to /login before the persisted session is restored
  app.use(router)
  app.mount('#app')
})