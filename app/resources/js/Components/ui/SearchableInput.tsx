import { useState, useRef, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

interface SearchResult {
  id: number
  label: string
  subtitle?: string
}

interface SearchableInputProps {
  placeholder?: string
  value?: string
  onSelect: (item: SearchResult) => void
  onSearch: (query: string) => Promise<SearchResult[]>
  loading?: boolean
  disabled?: boolean
  maxResults?: number
  minSearchLength?: number
  className?: string
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const LoadingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

export default function SearchableInput({
  placeholder = 'Buscar...',
  value = '',
  onSelect,
  onSearch,
  loading = false,
  disabled = false,
  maxResults = 5,
  minSearchLength = 2,
  className = ''
}: SearchableInputProps) {
  const [inputValue, setInputValue] = useState(value || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      const searchFn = debounce(async (q: string) => {
        // Allow empty search if minSearchLength is 0 or less
        if (q.length === 0 && minSearchLength > 0) {
          setResults([])
          setIsLoading(false)
          return
        }

        // Require minimum search length for non-empty queries
        if (q.length > 0 && q.length < minSearchLength) {
          setResults([])
          setIsLoading(false)
          return
        }

        try {
          setIsLoading(true)
          const searchResults = await onSearch(q)
          setResults(searchResults.slice(0, maxResults))
          setShowDropdown(true)
        } catch (error) {
          console.error('Error searching:', error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      }, 300)
      
      searchFn(query)
    },
    [onSearch, maxResults, minSearchLength]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (newValue.trim()) {
      debouncedSearch(newValue.trim())
    } else {
      setResults([])
      setShowDropdown(false)
      setIsLoading(false)
    }
  }

  // Handle item selection
  const handleItemSelect = (item: SearchResult) => {
    setInputValue(item.label)
    setShowDropdown(false)
    setResults([])
    onSelect(item)
  }

  // Handle focus
  const handleFocus = () => {
    // When focused, search with empty query to show all results
    if (inputValue === '' && minSearchLength <= 0) {
      debouncedSearch('')
    } else if (results.length > 0) {
      setShowDropdown(true)
    }
  }

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <LoadingIcon className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <SearchIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemSelect(item)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.subtitle && (
                <div className="text-sm text-gray-500 mt-1">{item.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && !isLoading && inputValue.length >= minSearchLength && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
        >
          <div className="px-4 py-3 text-gray-500 text-center">
            No se encontraron resultados
          </div>
        </div>
      )}
    </div>
  )
}