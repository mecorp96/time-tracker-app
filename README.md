# Time Tracker App

Aplicación web React para tracking de tiempo y ganancias en tiempo real.

## 🚀 Características

- ✅ **Tracking de tiempo en tiempo real** - Monitorea tus horas trabajadas al instante
- ✅ **Múltiples trabajos simultáneos** - Gestiona varios proyectos a la vez
- ✅ **Auto-inicio según horarios** - Se inicia automáticamente según tu programación
- ✅ **Gestión de vacaciones** - Controla días libres y ausencias
- ✅ **Estadísticas detalladas** - Resúmenes semanales y mensuales
- ✅ **100% offline** - Funciona sin conexión usando localStorage
- ✅ **Interfaz moderna** - Diseño responsive con TailwindCSS
- ✅ **Docker ready** - Despliegue fácil con contenedores

## 🚀 Despliegue con Docker

### Opción 1: Docker Compose (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/mecorp96/time-tracker-app.git
cd time-tracker-app

# Construir y ejecutar con Docker Compose
docker-compose up -d

# La aplicación estará disponible en:
# http://localhost:9090
```

### Opción 2: Docker Build Manual

```bash
# Construir la imagen
docker build -t time-tracker-app .

# Ejecutar el contenedor
docker run -d -p 9090:80 --name time-tracker-app time-tracker-app

# La aplicación estará disponible en:
# http://localhost:9090
```

### Opción 3: Portainer

1. **Subir el código a un repositorio Git**
2. **En Portainer:**
   - Ir a Stacks
   - Crear nuevo stack
   - Usar el archivo `docker-compose.yml`
   - Deploy

## 🔧 Configuración

### Variables de Entorno

```bash
NODE_ENV=production
```

### Puertos

- **Puerto por defecto:** 9090
- **Puerto interno:** 80 (nginx)

### Health Check

La aplicación incluye un endpoint de health check:
- **URL:** `http://localhost:9090/health`
- **Respuesta:** `healthy`

## 📁 Estructura del Proyecto

```
New_Project/
├── src/                    # Código fuente React
├── public/                 # Archivos estáticos
├── Dockerfile             # Configuración Docker
├── docker-compose.yml     # Orquestación Docker
├── nginx.conf             # Configuración Nginx
├── .dockerignore          # Archivos ignorados en Docker
└── README.md              # Este archivo
```

## 🛠️ Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/mecorp96/time-tracker-app.git
cd time-tracker-app

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview

# Ejecutar linting
npm run lint
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Puerto ocupado:**
   ```bash
   # Cambiar puerto en docker-compose.yml
   ports:
     - "9091:80"  # Cambiar 9090 por 9091
   ```

2. **Permisos de Docker:**
   ```bash
   # Asegurar permisos
   sudo usermod -aG docker $USER
   ```

3. **Limpiar contenedores:**
   ```bash
   docker-compose down
   docker system prune -f
   ```

### Logs

```bash
# Ver logs del contenedor
docker-compose logs -f time-tracker

# Ver logs de nginx
docker exec time-tracker-app tail -f /var/log/nginx/access.log
```

## 📱 Acceso

Una vez desplegado, la aplicación estará disponible en:
- **URL:** http://localhost:9090
- **Health Check:** http://localhost:9090/health
