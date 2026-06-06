import { STATUS_FLOW } from './constants'

export type ApplicationStatus = typeof STATUS_FLOW[number]

export interface ApplicationData {
  id: string
  appId: string
  lastName: string
  firstName: string
  email: string
  arrivalDate: string
  status: ApplicationStatus
  portraitPath: string | null
  passportPath: string | null
  createdAt: string
  updatedAt: string
}

export interface PushToEvisaMessage {
  type: 'PUSH_TO_EVISA'
  applicationId: string
  appId: string
  lastName: string
  firstName: string
  arrivalDate: string
  portraitSignedUrl: string | null
  passportSignedUrl: string | null
}

export interface ClearPendingApplicationMessage {
  type: 'CLEAR_PENDING_APPLICATION'
}

export type ExtensionMessage = PushToEvisaMessage | ClearPendingApplicationMessage
