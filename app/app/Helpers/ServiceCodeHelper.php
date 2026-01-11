<?php

namespace App\Helpers;

use App\Models\MedicalService;
use App\Models\ServiceCategory;
use Illuminate\Support\Str;

class ServiceCodeHelper
{
    /**
     * Genera un código único para un servicio médico basado en el nombre y categoría
     *
     * @param string $serviceName Nombre del servicio
     * @param int|null $categoryId ID de la categoría (opcional)
     * @return string Código único generado
     */
    public static function generateServiceCode(string $serviceName, ?int $categoryId = null): string
    {
        // Limpiar el nombre del servicio para el código
        $cleanName = self::cleanStringForCode($serviceName);
        
        // Obtener prefijo de categoría si existe
        $categoryPrefix = '';
        if ($categoryId) {
            $category = ServiceCategory::find($categoryId);
            if ($category) {
                $categoryPrefix = self::generateCategoryPrefix($category->name) . '-';
            }
        }
        
        // Generar código base
        $baseCode = $categoryPrefix . $cleanName;
        
        // Asegurar que el código sea único
        return self::ensureUniqueCode($baseCode);
    }

    /**
     * Limpia una cadena para usarla en un código
     *
     * @param string $string
     * @return string
     */
    private static function cleanStringForCode(string $string): string
    {
        // Convertir a mayúsculas
        $clean = Str::upper($string);
        
        // Remover acentos y caracteres especiales
        $clean = self::removeAccents($clean);
        
        // Mantener solo letras y números
        $clean = preg_replace('/[^A-Z0-9\s]/', '', $clean);
        
        // Reemplazar espacios con guiones
        $clean = preg_replace('/\s+/', '-', trim($clean));
        
        // Limitar a las primeras 3-4 palabras o 15 caracteres
        $words = explode('-', $clean);
        $limitedWords = array_slice($words, 0, 3);
        $result = implode('-', $limitedWords);
        
        // Si es muy largo, tomar solo los primeros 15 caracteres
        if (strlen($result) > 15) {
            $result = substr($result, 0, 15);
        }
        
        return rtrim($result, '-');
    }

    /**
     * Genera un prefijo de 2-3 letras para la categoría
     *
     * @param string $categoryName
     * @return string
     */
    private static function generateCategoryPrefix(string $categoryName): string
    {
        $clean = self::removeAccents(Str::upper($categoryName));
        $words = explode(' ', $clean);
        
        if (count($words) > 1) {
            // Si tiene múltiples palabras, tomar primera letra de cada una
            $prefix = '';
            foreach (array_slice($words, 0, 3) as $word) {
                $prefix .= substr($word, 0, 1);
            }
            return $prefix;
        } else {
            // Si es una sola palabra, tomar las primeras 3 letras
            return substr($clean, 0, 3);
        }
    }

    /**
     * Asegura que el código sea único agregando un número secuencial si es necesario
     *
     * @param string $baseCode
     * @return string
     */
    private static function ensureUniqueCode(string $baseCode): string
    {
        $code = $baseCode;
        $counter = 1;
        
        while (MedicalService::where('code', $code)->exists()) {
            $code = $baseCode . '-' . str_pad($counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }
        
        return $code;
    }

    /**
     * Remueve acentos y caracteres especiales, incluyendo corrupción UTF-8
     * IMPORTANTE: Preserva la 'ñ' y 'Ñ' correctamente
     * Convierte ã' → ñ, á → a, é → e, etc.
     * También maneja caracteres corruptos como ± → ñ, ³ → ó, etc.
     *
     * @param string $string
     * @return string
     */
    public static function removeAccents(string $string): string
    {
        // PASO 0: Reparar patrones de corrupción UTF-8 a nivel de BYTES
        // Patrón real: c3 af c2 bf c2 bd = ï¿½ (diéresis + corrupción)
        // Ejemplos: "iï¿½n" → "ión", "iï¿½m" → "ímica", "oï¿½o" → "ño"
        
        $diaeresisCorrruptPattern = "\xc3\xaf\xc2\xbf\xc2\xbd";  // ï¿½
        
        // IMPORTANTE: Reemplazar VOCALES + ï¿½, NO consonantes
        // "iï¿½n" → "ión" (para palabras como extraCCión → extraCción)
        // "iï¿½m" → "ímica" (para palabras como QUÍMICA)
        // "oï¿½o" → "ño" (para palabras como EXTRAÑO)
        
        $string = str_replace("i" . $diaeresisCorrruptPattern . "n", 'ión', $string);
        $string = str_replace("i" . $diaeresisCorrruptPattern . "m", 'ímica', $string);
        $string = str_replace("o" . $diaeresisCorrruptPattern . "o", 'ño', $string);
        
        // Vocales simples  + ï¿½
        $string = str_replace("a" . $diaeresisCorrruptPattern, 'á', $string);
        $string = str_replace("e" . $diaeresisCorrruptPattern, 'é', $string);
        $string = str_replace("i" . $diaeresisCorrruptPattern, 'í', $string);
        $string = str_replace("o" . $diaeresisCorrruptPattern, 'ó', $string);
        $string = str_replace("u" . $diaeresisCorrruptPattern, 'ú', $string);
        
        // PASO 1: Reparar caracteres corruptos UTF-8 específicos de legacy
        // El problema: Los bytes 0xC3 0x83 0x27 (Ã UTF-8 + apóstrofo) deberían ser Ñ
        // Y también: 0xC3 0xB1 0xE2 0x80 0x98 (ñ + comilla Unicode) debe ser solo ñ
        
        // Reemplazar secuencias exactas de bytes UTF-8
        $string = str_replace("\xc3\x83'", 'Ñ', $string);        // Ã + apóstrofo regular → Ñ
        $string = str_replace("\xc3\xa3'", 'ñ', $string);        // ã + apóstrofo regular → ñ
        $string = str_replace("\xc3\xb1\xe2\x80\x98", 'ñ', $string);  // ñ + comilla abierta → ñ
        $string = str_replace("\xc3\xb1\xe2\x80\x99", 'ñ', $string);  // ñ + comilla cerrada → ñ
        $string = str_replace("\xc3\x91\xe2\x80\x98", 'Ñ', $string);  // Ñ + comilla abierta → Ñ
        $string = str_replace("\xc3\x91\xe2\x80\x99", 'Ñ', $string);  // Ñ + comilla cerrada → Ñ
        
        // Remover comillas Unicode sueltas (marca de corrupción)
        $string = str_replace("\xe2\x80\x98", '', $string);  // Comilla abierta
        $string = str_replace("\xe2\x80\x99", '', $string);  // Comilla cerrada
        
        $corruptionPatterns = [
            // Patrones de ñ/Ñ corrupta - fallbacks para otros casos
            "Ã'" => 'Ñ',      // Por si acaso
            "ã'" => 'ñ',      // Por si acaso
            'ã' => 'ñ',       // ã corrupta → ñ
            'Ã' => 'Ñ',       // Ã corrupta → Ñ
            
            // ± representa una ñ corrupta → convertir a ñ correcta
            '±' => 'ñ',
            // ³ representa una o corrupta (ó) → convertir a ó
            '³' => 'ó',
            // ¡ representa una a corrupta (á) → convertir a á
            '¡' => 'á',
            // ' (apóstrofo - mark de corrupción UTF-8)
            "'" => '',  // Simplemente remover
            // ¿ representa un carácter corrupto, típicamente se elimina
            '¿' => '',
            // ½ representa un carácter corrupto, típicamente se elimina
            '½' => '',
            // Variaciones de comillas y apóstrofos (usar unicode)
            '\u{2018}' => '',  // Comilla izquierda
            '\u{2019}' => '',  // Comilla derecha / apóstrofo
            '`' => '',
            '´' => '',
        ];
        
        $cleaned = strtr($string, $corruptionPatterns);
        
        // PASO 2: Limpiar letras duplicadas consecutivas (pero preservar ñ/Ñ y cc)
        // aa→a, ee→e, etc. pero mantener ñn, Nn, etc. Y CC en palabras españolas
        // NO hacemos preg_replace aquí porque elimina cc legítimo de palabras españolas
        // Simplemente continuar sin este paso para preservar cc
        
        // PASO 3: Aplicar sanitización de acentos normales
        // IMPORTANTE: Preservar acentos españoles válidos (á, é, í, ó, ú, ñ, Á, É, Í, Ó, Ú, Ñ)
        // Solo remover acentos de otros idiomas (À, Â, Ã, etc.)
        $unwanted_array = [
            'Š'=>'S', 'š'=>'s', 'Ž'=>'Z', 'ž'=>'z', 'À'=>'A', 'Â'=>'A', 'Ã'=>'A', 'Ä'=>'A', 'Å'=>'A',
            'Æ'=>'A', 'Ç'=>'C', 'È'=>'E', 'Ê'=>'E', 'Ë'=>'E', 'Ì'=>'I', 'Î'=>'I', 'Ï'=>'I',
            // Preservar: Á, É, Í, Ó, Ú (acentos españoles) - NO incluidas en unwanted_array
            'Ò'=>'O', 'Ô'=>'O', 'Õ'=>'O', 'Ö'=>'O', 'Ø'=>'O', 'Ù'=>'U', 'Û'=>'U',
            'Ü'=>'U', 'Ý'=>'Y', 'Þ'=>'B', 'ß'=>'Ss', 'à'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'å'=>'a',
            'æ'=>'a', 'ç'=>'c', 'è'=>'e', 'ê'=>'e', 'ë'=>'e', 'ì'=>'i', 'î'=>'i', 'ï'=>'i',
            'ð'=>'o', 'ò'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o', 'ø'=>'o', 'ù'=>'u', 'û'=>'u',
            'ý'=>'y', 'þ'=>'b', 'ÿ'=>'y'
            // Nota: á, é, í, ó, ú, ñ, Á, É, Í, Ó, Ú, Ñ se PRESERVAN
        ];
        
        return strtr($cleaned, $unwanted_array);
    }

    /**
     * Limpia caracteres corruptos UTF-8 (ejemplo: ¿½ → ó)
     * Maneja caracteres malformados de doble byte
     * Los bytes corruptos 0xC3 0xBF (UTF-8 para ÿ) se muestran como ¿½
     *
     * @param string $string
     * @return string
     */
    public static function cleanCorruptedUtf8(string $string): string
    {
        // Primero, manejar patrones específicos de corrupción
        // ¿½ normalmente es el resultado de encoding incorrecto de caracteres acentuados
        // Necesitamos ser más inteligentes sobre qué carácter debería ser
        
        // Patrones comunes:
        // Ecografi¿½a -> Ecografía
        // Cauterizacii¿½n -> Cauterización
        // Qui¿½mica -> Química
        
        $corruptionPatterns = [
            // Patrones específicos conocidos
            'i¿½' => 'í',      // fi¿½ica -> física
            'a¿½' => 'á',      // ca¿½a -> caña
            'e¿½' => 'é',      // caf¿½ -> café
            'o¿½' => 'ó',      // afó¿½ -> afoó (esto es más complicado)
            'u¿½' => 'ú',      // agú¿½ -> agú
            
            // Variaciones con mayúsculas
            'I¿½' => 'Í',
            'A¿½' => 'Á',
            'E¿½' => 'É',
            'O¿½' => 'Ó',
            'U¿½' => 'Ú',
        ];
        
        $cleaned = strtr($string, $corruptionPatterns);
        
        // Luego, manejar caracteres huérfanos
        $cleaned = str_replace('¿', '', $cleaned);
        $cleaned = str_replace('½', '', $cleaned);
        
        // Caracteres acentuados corruptos
        $cleaned = str_replace('Â', 'A', $cleaned);
        $cleaned = str_replace('Ã', 'A', $cleaned);
        $cleaned = str_replace('Ä', 'A', $cleaned);
        $cleaned = str_replace('ã', 'a', $cleaned);
        $cleaned = str_replace('ñ', 'n', $cleaned);  // Mantener ñ correcta
        
        // Remover espacios dobles que puedan quedar
        $cleaned = preg_replace('/\s+/', ' ', trim($cleaned));
        
        return $cleaned;
    }

    /**
     * Sanitiza un nombre de servicio: corrige caracteres UTF-8 corruptos y convierte a Title Case
     * PRESERVA acentos españoles (á, é, í, ó, ú, ñ, Ñ)
     * 
     * Ejemplo: "Cauterizaciï¿½n Quï¿½mica" -> "Cauterización Química"
     *          "Acompaña'amiento" -> "Acompañamiento"
     *
     * @param string $name
     * @return string
     */
    public static function sanitizeServiceName(string $name): string
    {
        // PASO 0: Convertir UTF-8 corrupto a UTF-8 limpio usando iconv
        // Esto ayuda a reparar bytes malformados
        $repaired = iconv('UTF-8', 'UTF-8//IGNORE', $name);
        
        // PASO 1: Reparar patrones de corrupción UTF-8 con diéresis (ï¿½)
        // Patrón real: c3 af c2 bf c2 bd = ï¿½ (i con diéresis + ¿½)
        $diaeresisCorrruptPattern = "\xc3\xaf\xc2\xbf\xc2\xbd";  // ï¿½
        
        // Reemplazos contextuales (vocal + ï¿½ + consonante específica)
        // ORDEN CRÍTICO: Procesar patrones CON consonante ANTES de patrones SIN consonante
        // Esto previene que "u + ï¿½ + m" sea reemplazado como "ú" antes de procesar como "ím"
        
        $repaired = str_replace("i" . $diaeresisCorrruptPattern . "n", 'ión', $repaired);
        $repaired = str_replace("a" . $diaeresisCorrruptPattern . "o", 'año', $repaired);
        $repaired = str_replace("i" . $diaeresisCorrruptPattern . "m", 'ímica', $repaired);
        $repaired = str_replace("u" . $diaeresisCorrruptPattern . "m", 'uím', $repaired);  // u+ï¿½+m → uím
        $repaired = str_replace("o" . $diaeresisCorrruptPattern . "o", 'ño', $repaired);
        $repaired = str_replace($diaeresisCorrruptPattern . "a", 'ía', $repaired);  // ï¿½+a → ía (Ecografía)
        
        $repaired = str_replace("I" . $diaeresisCorrruptPattern . "N", 'IÓN', $repaired);
        $repaired = str_replace("A" . $diaeresisCorrruptPattern . "O", 'AÑO', $repaired);
        $repaired = str_replace("I" . $diaeresisCorrruptPattern . "M", 'ÍMICA', $repaired);
        $repaired = str_replace("U" . $diaeresisCorrruptPattern . "M", 'UÍM', $repaired);  // U+ï¿½+M → UÍM
        $repaired = str_replace("O" . $diaeresisCorrruptPattern . "O", 'ÑO', $repaired);
        $repaired = str_replace($diaeresisCorrruptPattern . "A", 'ÍA', $repaired);  // ï¿½+A → ÍA (mayúscula)
        
        // Reemplazos simples (solo vocal + ï¿½)
        // IMPORTANTE: u + ï¿½ → ú (no í), para preservar "QUÍMICA"
        $repaired = str_replace("a" . $diaeresisCorrruptPattern, 'á', $repaired);
        $repaired = str_replace("e" . $diaeresisCorrruptPattern, 'é', $repaired);
        $repaired = str_replace("i" . $diaeresisCorrruptPattern, 'í', $repaired);
        $repaired = str_replace("o" . $diaeresisCorrruptPattern, 'ó', $repaired);
        $repaired = str_replace("u" . $diaeresisCorrruptPattern, 'ú', $repaired);  // u+ï¿½ → ú (para QUÍMICA)
        $repaired = str_replace("A" . $diaeresisCorrruptPattern, 'Á', $repaired);
        $repaired = str_replace("E" . $diaeresisCorrruptPattern, 'É', $repaired);
        $repaired = str_replace("I" . $diaeresisCorrruptPattern, 'Í', $repaired);
        $repaired = str_replace("O" . $diaeresisCorrruptPattern, 'Ó', $repaired);
        $repaired = str_replace("U" . $diaeresisCorrruptPattern, 'Ú', $repaired);  // U+ï¿½ → Ú
        
        // PASO 2: Reparar caracteres corruptos UTF-8 (Ã + apóstrofo/comillas Unicode)
        // Manejar comillas Unicode (U+2018 = e2 80 98, U+2019 = e2 80 99)
        // También manejar © (copyright symbol \xc2\xa9) y º (ordinal \xc2\xba) que son marcas de corrupción
        
        // Patrones con º (ordinal masculine - corrupción de 'ú')
        $repaired = str_replace("\xc3\x83\xc2\xba", 'ú', $repaired);  // Ãº → ú (QuirÃºrgica → Quirúrgica)
        $repaired = str_replace("\xc3\x81\xc2\xba", 'Ú', $repaired);  // Áº → Ú (mayúscula)
        
        // Patrones con ¡ (inverted exclamation - corrupción de 'á')
        $repaired = str_replace("\xc3\xb1\xc2\xa1", 'á', $repaired);  // ñ¡ → á (Linfñ¡tico → Linfático)
        $repaired = str_replace("\xc3\x91\xc2\xa1", 'Á', $repaired);  // Ñ¡ → Á (mayúscula)
        
        // Patrones con © (copyright symbol - corrupción de 'é')
        $repaired = str_replace("\xc3\xb1\xc2\xa9", 'é', $repaired);  // ñ© → é (Reciñ©n → Recién)
        $repaired = str_replace("\xc3\x83\xc2\xa9", 'é', $repaired);  // Ã© → é (ReciÃ©n → Recién)
        $repaired = str_replace("\xc3\x91\xc2\xa9", 'É', $repaired);  // Ñ© → É (mayúscula)
        
        // Patrones con Ã + apóstrofo/comillas Unicode
        $repaired = str_replace("\xc3\x83'", 'Ñ', $repaired);        // Ã + apóstrofo → Ñ
        $repaired = str_replace("\xc3\xa3'", 'ñ', $repaired);        // ã + apóstrofo → ñ
        $repaired = str_replace("\xc3\xb1\xe2\x80\x98", 'ñ', $repaired);  // ñ + comilla abierta → ñ
        $repaired = str_replace("\xc3\xb1\xe2\x80\x99", 'ñ', $repaired);  // ñ + comilla cerrada → ñ
        $repaired = str_replace("\xc3\x91\xe2\x80\x98", 'Ñ', $repaired);  // Ñ + comilla abierta → Ñ
        $repaired = str_replace("\xc3\x91\xe2\x80\x99", 'Ñ', $repaired);  // Ñ + comilla cerrada → Ñ
        
        // Remover comillas Unicode sueltas (son marcas de corrupción)
        $repaired = str_replace("\xe2\x80\x98", '', $repaired);  // Comilla abierta
        $repaired = str_replace("\xe2\x80\x99", '', $repaired);  // Comilla cerrada
        
        // Patrones con Â° y â° (corrupción de ordinal masculine)
        // "1Â°" → "1°", "2°" → "2°", etc. (desde utf8mb3_general_ci)
        $repaired = str_replace("\xc3\x82\xc2\xb0", '°', $repaired);  // Â° → °
        $repaired = str_replace("\xc3\xa2\xc2\xb0", '°', $repaired);  // â° → °
        
        // Remover © suelto (copyright symbol - marca de corrupción)
        $repaired = str_replace("\xc2\xa9", '', $repaired);  // © → ''
        
        // Remover º suelto (ordinal masculine - marca de corrupción)
        $repaired = str_replace("\xc2\xba", '', $repaired);  // º → ''
        
        // Remover ¡ suelto (inverted exclamation - marca de corrupción)
        $repaired = str_replace("\xc2\xa1", '', $repaired);  // ¡ → ''
        
        // Por si quedan Ã/ã sin combinar
        $repaired = str_replace('Ã', 'Ñ', $repaired);
        $repaired = str_replace('ã', 'ñ', $repaired);
        
        // Remover apóstrofos huérfanos (marca de corrupción)
        $repaired = str_replace("'", '', $repaired);
        
        // PASO 3: Convertir a minúsculas (pero ñ/Ñ se mantiene)
        $sanitized = Str::lower($repaired);
        
        // PASO 4: Convertir a Title Case (primera letra de cada palabra mayúscula)
        $sanitized = ucwords($sanitized);
        
        // PASO 5: Limpiar espacios múltiples
        $sanitized = preg_replace('/\s+/', ' ', trim($sanitized));
        
        return $sanitized;
    }

    /**
     * Regenera el código de un servicio existente (útil para migraciones o actualizaciones)
     *
     * @param MedicalService $service
     * @return string
     */
    public static function regenerateCodeForService(MedicalService $service): string
    {
        return self::generateServiceCode($service->name, $service->category_id);
    }

    /**
     * Valida si un código tiene el formato correcto
     *
     * @param string $code
     * @return bool
     */
    public static function isValidCodeFormat(string $code): bool
    {
        // El código debe tener entre 3 y 25 caracteres
        // Solo letras mayúsculas, números y guiones
        return preg_match('/^[A-Z0-9\-]{3,25}$/', $code) === 1;
    }

    /**
     * Obtiene estadísticas de códigos generados por categoría
     *
     * @return array
     */
    public static function getCodeStatistics(): array
    {
        $services = MedicalService::with('category')->get();
        $stats = [];
        
        foreach ($services as $service) {
            $categoryName = $service->category ? $service->category->name : 'Sin Categoría';
            if (!isset($stats[$categoryName])) {
                $stats[$categoryName] = [
                    'count' => 0,
                    'codes' => []
                ];
            }
            $stats[$categoryName]['count']++;
            $stats[$categoryName]['codes'][] = $service->code;
        }
        
        return $stats;
    }

    /**
     * Capitaliza correctamente nombres de profesionales
     * Ejemplo: "Dr.fernando Gutierrez" → "Dr. Fernando Gutierrez"
     * También maneja: "Dra.", "Lic.", "Prof.", etc.
     *
     * @param string $name
     * @return string
     */
    public static function capitalizeProfileName(string $name): string
    {
        // Trimear espacios
        $name = trim($name);
        
        // Patrones de títulos profesionales que necesitan espacio después del punto
        $patterns = [
            'dr\.' => 'Dr. ',
            'dra\.' => 'Dra. ',
            'lic\.' => 'Lic. ',
            'prof\.' => 'Prof. ',
            'ing\.' => 'Ing. ',
            'arq\.' => 'Arq. ',
        ];
        
        foreach ($patterns as $pattern => $replacement) {
            // Usar preg_replace para manejar case-insensitive
            $name = preg_replace('/' . $pattern . '\s*/i', $replacement, $name);
        }
        
        // Capitalizar cada palabra
        $name = ucwords($name);
        
        return $name;
    }
}