# 🔧 Comandos de Desarrollo - Aranto-ia

## 🚀 **Manejo de Vite (Recomendado)**

### **Usando el script helper:**
```bash
# Iniciar Vite de forma segura
./vite-manager.sh start

# Verificar si está corriendo
./vite-manager.sh status

# Detener Vite
./vite-manager.sh stop

# Reiniciar Vite
./vite-manager.sh restart
```

### **Comandos Docker directos:**

#### **✅ Método Seguro (Verificar primero):**
```bash
# 1. Verificar si Vite ya está corriendo
docker compose exec app ps aux | grep -E "(vite|npm.*dev)" | grep -v grep

# 2. Si está corriendo, detenerlo
docker compose exec app pkill -f "npm.*dev"

# 3. Iniciar Vite limpio
docker compose exec app npm run dev
```

#### **🔧 One-liner para reinicio seguro:**
```bash
# Detener procesos existentes e iniciar limpio
docker compose exec app bash -c "pkill -f 'npm.*dev' || true; sleep 1; npm run dev"
```

## 🐛 **Solución de Problemas Comunes**

### **Puerto en uso:**
```bash
# Verificar qué está usando el puerto
docker compose exec app netstat -tlnp | grep :5173
docker compose exec app netstat -tlnp | grep :5174

# Liberar puertos
docker compose exec app fuser -k 5173/tcp
docker compose exec app fuser -k 5174/tcp
```

### **Procesos zombi:**
```bash
# Limpiar todos los procesos de Node/Vite
docker compose exec app pkill -f "node"
docker compose exec app pkill -f "vite"
```

### **Restart completo:**
```bash
# Reiniciar contenedor completo
docker compose restart app
docker compose exec app npm run dev
```

## 📝 **Buenas Prácticas**

1. **Siempre verificar antes de iniciar:** Usa `./vite-manager.sh status`
2. **Un solo terminal:** Usa solo una terminal para Vite
3. **Background vs Foreground:** Para desarrollo usa foreground, para CI/CD usa background con `&`
4. **Logs:** Verificar logs si hay problemas: `docker compose logs app`

### 👀 React Compiler (advertencia "Compilation Skipped")

Si en desarrollo ves la advertencia "Compilation Skipped: Use of incompatible library" proveniente del React Compiler, puedes ocultarla sin afectar producción:

- Editamos `app/vite.config.ts` para solo habilitar `babel-plugin-react-compiler` en producción (es donde aporta optimizaciones). Esto evita mensajes molestos en dev.
- Si prefieres habilitarlo en desarrollo usa la variable `ENABLE_REACT_COMPILER=true` en tu entorno.

Ejemplo: si ves el mensaje en dev, corre `./vite-manager.sh restart` para recoger la nueva configuración.

## 🎯 **Workflow Recomendado**

```bash
# 1. Levantar contenedores
docker compose up -d

# 2. Iniciar desarrollo de forma segura
./vite-manager.sh start

# 3. Para detener desarrollo
./vite-manager.sh stop

# 4. Para reiniciar si hay cambios en configuración
./vite-manager.sh restart
```

## ⚡ **Shortcuts para .zshrc/.bashrc**

Agregar al final de tu `~/.zshrc` o `~/.bashrc`:

```bash
# Aranto-ia Development Shortcuts
alias aranto-dev="cd /Users/edsonnaza/Desktop/Aranto-ia && ./vite-manager.sh start"
alias aranto-stop="cd /Users/edsonnaza/Desktop/Aranto-ia && ./vite-manager.sh stop"
alias aranto-status="cd /Users/edsonnaza/Desktop/Aranto-ia && ./vite-manager.sh status"
alias aranto-restart="cd /Users/edsonnaza/Desktop/Aranto-ia && ./vite-manager.sh restart"
```

Luego recargar: `source ~/.zshrc`

Y usar simplemente:
```bash
aranto-dev      # Iniciar desarrollo
aranto-status   # Ver estado
aranto-restart  # Reiniciar
aranto-stop     # Detener
```