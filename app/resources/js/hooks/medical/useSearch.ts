import { useState, useCallback } from 'react'

interface SearchResult {
  id: number
  label: string
  subtitle?: string
}

export interface PatientSearchResult extends SearchResult {
  full_name: string
  document: string
  age: number
  insurance_info: string
  has_valid_insurance: boolean
}

export interface ServiceSearchResult extends SearchResult {
  code: string
  base_price: number
  estimated_duration: number
  category: string
}

export interface ProfessionalSearchResult extends SearchResult {
  full_name: string
  specialties?: string
  commission_percentage?: number
}

export interface UseSearchReturn {
  // Patient search
  searchPatients: (query: string) => Promise<PatientSearchResult[]>
  
  // Service search
  searchServices: (query: string) => Promise<ServiceSearchResult[]>
  
  // Professional search
  searchProfessionals: (query: string) => Promise<ProfessionalSearchResult[]>
  
  // Loading states
  isSearchingPatients: boolean
  isSearchingServices: boolean
  isSearchingProfessionals: boolean
  
  // Error handling
  searchError: string | null
}

export const useSearch = (): UseSearchReturn => {
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const [isSearchingServices, setIsSearchingServices] = useState(false)
  const [isSearchingProfessionals, setIsSearchingProfessionals] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const searchPatients = useCallback(async (query: string): Promise<PatientSearchResult[]> => {
    try {
      setIsSearchingPatients(true)
      setSearchError(null)

      const response = await fetch(`/medical/patients-search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // The endpoint now returns data in the correct format
      return data.map((patient: PatientSearchResult) => ({
        id: patient.id,
        label: patient.label,
        subtitle: patient.subtitle,
        full_name: patient.full_name,
        document: patient.document,
        age: patient.age,
        insurance_info: patient.insurance_info,
        has_valid_insurance: patient.has_valid_insurance
      }))
    } catch (error) {
      console.error('Error searching patients:', error)
      setSearchError('Error al buscar pacientes')
      return []
    } finally {
      setIsSearchingPatients(false)
    }
  }, [])

  const searchServices = useCallback(async (query: string): Promise<ServiceSearchResult[]> => {
    try {
      setIsSearchingServices(true)
      setSearchError(null)

      const response = await fetch(`/medical/medical-services-search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return data.map((service: ServiceSearchResult) => ({
        id: service.id,
        label: service.label,
        subtitle: service.subtitle,
        code: service.code,
        base_price: service.base_price,
        estimated_duration: service.estimated_duration,
        category: service.category
      }))
    } catch (error) {
      console.error('Error searching services:', error)
      setSearchError('Error al buscar servicios')
      return []
    } finally {
      setIsSearchingServices(false)
    }
  }, [])

  const searchProfessionals = useCallback(async (query: string): Promise<ProfessionalSearchResult[]> => {
    try {
      setIsSearchingProfessionals(true)
      setSearchError(null)

      const response = await fetch(`/medical/professionals-search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return data.map((professional: ProfessionalSearchResult) => ({
        id: professional.id,
        label: professional.label,
        subtitle: professional.subtitle,
        full_name: professional.full_name,
        specialties: professional.specialties,
        commission_percentage: professional.commission_percentage
      }))
    } catch (error) {
      console.error('Error searching professionals:', error)
      setSearchError('Error al buscar profesionales')
      return []
    } finally {
      setIsSearchingProfessionals(false)
    }
  }, [])

  return {
    searchPatients,
    searchServices,
    searchProfessionals,
    isSearchingPatients,
    isSearchingServices,
    isSearchingProfessionals,
    searchError
  }
}