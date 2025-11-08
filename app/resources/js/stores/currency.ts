import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CURRENCY_CONFIG, type CurrencyConfig } from '@/services/currency';

interface CurrencyStore {
    config: CurrencyConfig;
    updateConfig: (newConfig: Partial<CurrencyConfig>) => void;
    resetConfig: () => void;
}

/**
 * Global Currency Configuration Store
 * 
 * Manages currency configuration across the entire application.
 * Persists settings in localStorage for user preferences.
 */
export const useCurrencyStore = create<CurrencyStore>()(
    persist(
        (set) => ({
            // Default to Paraguay Guaraní configuration
            config: CURRENCY_CONFIG,

            /**
             * Update currency configuration
             */
            updateConfig: (newConfig: Partial<CurrencyConfig>) => {
                set((state: CurrencyStore) => ({
                    config: { ...state.config, ...newConfig },
                }));
            },

            /**
             * Reset to default Paraguay configuration
             */
            resetConfig: () => {
                set({ config: CURRENCY_CONFIG });
            },
        }),
        {
            name: 'currency-config', // localStorage key
            version: 1, // for future migrations
        }
    )
);

// Convenient hook for getting just the config
export const useCurrencyConfig = () => useCurrencyStore((state: CurrencyStore) => state.config);

// Convenient hook for formatting functions with current config
export const useCurrencyFormatter = () => {
    const config = useCurrencyConfig();
    
    return {
        format: (amount: number | string, forceDecimals?: boolean) => {
            const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
            
            if (isNaN(numericAmount)) {
                return config.format.replace('{amount}', '0');
            }

            // Check if we should show decimals (smart formatting)
            const hasSignificantDecimals = numericAmount % 1 !== 0;
            const shouldShowDecimals = forceDecimals || hasSignificantDecimals;
            
            // Format with appropriate decimal places
            const decimalPlaces = shouldShowDecimals ? config.decimalPlaces : 0;
            const fixedAmount = numericAmount.toFixed(decimalPlaces);
            
            if (shouldShowDecimals) {
                const [integerPart, decimalPart] = fixedAmount.split('.');
                const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
                const formattedAmount = formattedInteger + config.decimalSeparator + decimalPart;
                return config.format.replace('{amount}', formattedAmount);
            } else {
                // No decimals - just format the integer part
                const formattedInteger = Math.floor(numericAmount).toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
                return config.format.replace('{amount}', formattedInteger);
            }
        },
        
        parse: (currencyString: string): number => {
            if (!currencyString) return 0;
            
            let cleanString = currencyString.replace(config.symbol, '').trim();
            cleanString = cleanString
                .replace(new RegExp('\\' + config.thousandsSeparator, 'g'), '')
                .replace(config.decimalSeparator, '.');
            
            return parseFloat(cleanString) || 0;
        },

        symbol: config.symbol,
        config,
    };
};

export default useCurrencyStore;