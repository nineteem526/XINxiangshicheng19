import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import ssl from '@vitejs/plugin-basic-ssl';
export default defineConfig({plugins:[react(),ssl()],server:{host:true,port:5174,strictPort:true,proxy:{'/depth':{target:'http://127.0.0.1:8013',xfwd:true},'/api':{target:'http://127.0.0.1:8012',ws:true,xfwd:true}}}});

