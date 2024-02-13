export interface TokenData {
  uid: string
  email: string
  name?: string | null
}

export interface User extends TokenData {
  userType: 'company' | 'admin'
  currentYear?: string
  studyProgram?: string
  companyUID?: string
  updated: number
  dietaryRestrictions?: any
  resume: string
}
