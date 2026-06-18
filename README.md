# Notala

> **Descripción:** Notala es una aplicación web de toma de notas potenciada con inteligencia artificial. Está orientada a cualquier persona que quiera capturar y organizar sus ideas de forma rápida, con la posibilidad de interactuar con modelos de lenguaje directamente desde el editor. La aplicación permite crear, editar y eliminar notas, y cuenta con un asistente de IA integrado a través de OpenRouter que ayuda a desarrollar, resumir o reformular el contenido de las notas.

## Aspectos tecnológicos

| **Tecnología**                  | **Descripción**                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------- |
| **Frontend**                    |                                                                                 |
| React + Vite + Tailwind CSS     | Para realizar la interfaz de usuario.                                           |
| Zustand                         | Para la gestión del estado global de la aplicación.                             |
| Lucide React                    | Librería de iconos utilizada en la interfaz.                                    |
| OpenAI SDK                      | Cliente HTTP utilizado para conectarse a la API de OpenRouter.                  |
| Despliegue en Vercel            | Para el despliegue de la aplicación.                                            |
| **Extras**                      |                                                                                 |
| OpenRouter                      | Plataforma de acceso a múltiples modelos de lenguaje (GPT-4o, Claude, etc.).   |

## Guía de Instalación

### Requisitos Previos

- Node.js **v18 o superior**
- npm (incluido con Node.js)
- Una API Key de [OpenRouter](https://openrouter.ai/keys) *(gratuita para empezar)*

---

### Procedimiento de Instalación

#### Clonar el repositorio

```
git clone https://github.com/gacastroo/Notala.git
```

#### Instalar dependencias e iniciar la aplicación

```
cd Notala

# Instalar dependencias
npm install

# Iniciar la aplicación en desarrollo
npm run dev
```

#### Accede a la aplicación

- **Frontend**: http://localhost:5173

---

## Sin Instalación Local (Producción)

Puedes acceder directamente sin instalar nada desde:

Frontend (Vercel): https://notala.vercel.app

---

## Estructura del Proyecto

```
Notala/
├── public/                 # Archivos estáticos públicos (favicon, etc.)
├── src/
│   ├── assets/             # Imágenes, fuentes y recursos estáticos
│   ├── components/         # Componentes reutilizables de la UI
│   ├── hooks/              # Custom hooks de React (lógica reutilizable)
│   ├── lib/                # Configuración del cliente de OpenRouter
│   ├── pages/              # Vistas/páginas principales de la app
│   ├── store/              # Estado global con Zustand
│   ├── App.css             # Estilos globales de la app
│   ├── App.jsx             # Componente raíz y definición de rutas
│   ├── index.css           # Estilos base y directivas de Tailwind
│   └── main.jsx            # Punto de entrada de la aplicación
├── .env                    # Variables de entorno (no subir al repo)
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Despliegue

La aplicación Notala está desplegada en Vercel para que puedas acceder y probarla fácilmente.

Frontend (Vercel)
URL: https://notala.vercel.app

Tecnologías usadas:
React · Vite · Tailwind CSS · Zustand · OpenRouter

Variables de entorno necesarias (para desarrollo local):

```
VITE_OPENROUTER_API_KEY=tu_api_key_aqui
```

> **Importante:** Nunca subas tu archivo `.env` a un repositorio público. Ya está incluido en `.gitignore`.
> Puedes obtener tu API Key en https://openrouter.ai/keys. OpenRouter da acceso a múltiples modelos desde una sola key.

---

## Autor

Guillermo Andrés Castro Abarca

## Enlace Repositorio

https://github.com/gacastroo/Notala

## Enlace Despliegue

https://notala.vercel.app
