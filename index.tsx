import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Importamos el CSS aquí para que Vite lo procese e inyecte correctamente
// Asegúrate de que este archivo exista en tu carpeta raíz
import './index.css'; 

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);