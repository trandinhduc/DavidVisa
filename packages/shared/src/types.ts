import { STATUS_FLOW } from './constants'

export type ApplicationStatus = typeof STATUS_FLOW[number]

export interface ApplicationData {
  id: string
  appId: string
  lastName: string | null
  firstName: string | null
  email: string | null
  arrivalDate: string
  status: ApplicationStatus
  portraitPath: string | null
  passportPath: string | null
  registrationDuration: number | null
  entryType: 'single' | 'multiple' | null
  religion: string | null
  placeOfBirth: string | null
  visaValidFrom: string | null
  passportType: string | null
  passportExpiryDate: string | null
  passportIssueDate: string | null
  permanentAddress: string | null
  contactAddress: string | null
  telephone: string | null
  emergencyName: string | null
  emergencyAddress: string | null
  emergencyTelephone: string | null
  emergencyRelationship: string | null
  purposeOfEntry: string | null
  intendedDateOfEntry: string | null
  intendedLengthOfStay: string | null
  residentialAddressInVietnam: string | null
  provinceCity: string | null
  wardCommune: string | null
  entryGate: string | null
  exitGate: string | null
  createdAt: string
  updatedAt: string
}

export interface PushToEvisaMessage {
  type: 'PUSH_TO_EVISA'
  applicationId: string
  appId: string
  lastName: string | null
  firstName: string | null
  email: string | null
  arrivalDate: string
  portraitSignedUrl: string | null
  passportSignedUrl: string | null
  registrationDuration: number | null
  entryType: 'single' | 'multiple' | null
  religion: string | null
  placeOfBirth: string | null
  visaValidFrom: string | null
  passportType: string | null
  passportExpiryDate: string | null
  passportIssueDate: string | null
  permanentAddress: string | null
  contactAddress: string | null
  telephone: string | null
  emergencyName: string | null
  emergencyAddress: string | null
  emergencyTelephone: string | null
  emergencyRelationship: string | null
  purposeOfEntry: string | null
  intendedDateOfEntry: string | null
  intendedLengthOfStay: string | null
  residentialAddressInVietnam: string | null
  provinceCity: string | null
  wardCommune: string | null
  entryGate: string | null
  exitGate: string | null
}

export interface ClearPendingApplicationMessage {
  type: 'CLEAR_PENDING_APPLICATION'
}

export type ExtensionMessage = PushToEvisaMessage | ClearPendingApplicationMessage
