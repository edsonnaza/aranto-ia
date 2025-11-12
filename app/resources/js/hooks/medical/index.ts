// Medical Module Hooks - Data Access Layer
// Following the pattern: Frontend -> Hooks -> Backend -> Database

// Service Requests Hooks
export { useServiceRequests } from './useServiceRequests'
export type { 
  ServiceRequest, 
  ServiceRequestFilters, 
  ServiceRequestsIndexData,
  CreateServiceRequestData, 
  UseServiceRequestsReturn 
} from './useServiceRequests'

// Service Code Generator Hook
export { useServiceCodeGenerator } from './useServiceCodeGenerator'
export type { UseServiceCodeGeneratorReturn } from './useServiceCodeGenerator'

// Reception Module Hooks  
export { useReception } from './useReception'
export type { 
  ReceptionStats, 
  RecentRequest, 
  PatientOption, 
  ServiceCategory, 
  ProfessionalOption, 
  InsuranceOption, 
  ReceptionCreateData,
  UseReceptionReturn 
} from './useReception'

// Search Hooks
export { useSearch } from './useSearch'
export type {
  PatientSearchResult,
  ServiceSearchResult, 
  UseSearchReturn
} from './useSearch'

// Usage Example:
// 
// ✅ CORRECT - Component uses hook for data access
// const ServiceRequestsIndex = () => {
//   const { loading, error, navigateToCreate, confirmServiceRequest } = useServiceRequests()
//   // Only UI logic here
// }
//
// ❌ INCORRECT - Component has direct route responsibility
// const ServiceRequestsIndex = () => {
//   const handleCreate = () => {
//     router.get('/medical/service-requests/create') // ❌ NO!
//   }
// }

// Service Pricing Hooks
export { useServicePricing } from './useServicePricing'
export type { UseServicePricingReturn } from './useServicePricing'