<?php

namespace App\Helpers;

use App\Models\Service;
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
            $category = \App\Models\ServiceCategory::find($categoryId);
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
        
        while (Service::where('code', $code)->exists()) {
            $code = $baseCode . '-' . str_pad($counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }
        
        return $code;
    }

    /**
     * Remueve acentos y caracteres especiales
     *
     * @param string $string
     * @return string
     */
    private static function removeAccents(string $string): string
    {
        $unwanted_array = [
            'Š'=>'S', 'š'=>'s', 'Ž'=>'Z', 'ž'=>'z', 'À'=>'A', 'Á'=>'A', 'Â'=>'A', 'Ã'=>'A', 'Ä'=>'A', 'Å'=>'A',
            'Æ'=>'A', 'Ç'=>'C', 'È'=>'E', 'É'=>'E', 'Ê'=>'E', 'Ë'=>'E', 'Ì'=>'I', 'Í'=>'I', 'Î'=>'I', 'Ï'=>'I',
            'Ñ'=>'N', 'Ò'=>'O', 'Ó'=>'O', 'Ô'=>'O', 'Õ'=>'O', 'Ö'=>'O', 'Ø'=>'O', 'Ù'=>'U', 'Ú'=>'U', 'Û'=>'U',
            'Ü'=>'U', 'Ý'=>'Y', 'Þ'=>'B', 'ß'=>'Ss', 'à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'å'=>'a',
            'æ'=>'a', 'ç'=>'c', 'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e', 'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i',
            'ð'=>'o', 'ñ'=>'n', 'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o', 'ø'=>'o', 'ù'=>'u', 'ú'=>'u',
            'û'=>'u', 'ý'=>'y', 'þ'=>'b', 'ÿ'=>'y'
        ];
        
        return strtr($string, $unwanted_array);
    }

    /**
     * Sanitiza un nombre de servicio: elimina acentos y convierte a Title Case
     * Ejemplo: "ACOMPAÃ'AMIENTO DE RN A TRASLADO" -> "Acompanamiento De Rn A Traslado"
     *
     * @param string $name
     * @return string
     */
    public static function sanitizeServiceName(string $name): string
    {
        // Primero, remover acentos y caracteres corruptos
        $sanitized = self::removeAccents($name);
        
        // Convertir a minúsculas primero
        $sanitized = Str::lower($sanitized);
        
        // Convertir a Title Case (primera letra mayúscula de cada palabra)
        $sanitized = ucwords($sanitized);
        
        // Limpiar espacios múltiples
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
}