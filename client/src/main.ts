import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './assets/css/main.css'

axios.defaults.withCredentials = true
axios.defaults.baseURL = '/api'

const app = createApp(App)
app.use(router)
app.mount('#root')
