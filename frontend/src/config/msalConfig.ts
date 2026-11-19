import { type Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser'

// Read settings from Vite environment variables
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID || '00000000-0000-0000-0000-000000000000'
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID || '00000000-0000-0000-0000-000000000000'
const redirectUri = import.meta.env.VITE_ENTRA_REDIRECT_URI || window.location.origin + '/login'
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE || 'openid profile email User.Read'

/**
 * Returns true if real, non-placeholder Microsoft Entra configuration has been supplied.
 */
export function isMsalConfigured(): boolean {
  return (
    !!clientId &&
    !clientId.startsWith('00000000') &&
    !!tenantId &&
    !tenantId.startsWith('00000000')
  )
}

/**
 * Microsoft Authentication Library (MSAL) Browser Configuration.
 * Uses Authorization Code Flow with PKCE for single-page applications.
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: isMsalConfigured() ? clientId : '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${isMsalConfigured() ? tenantId : 'common'}`,
    redirectUri: redirectUri,
    postLogoutRedirectUri: redirectUri
  },
  cache: {
    cacheLocation: 'sessionStorage'
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error('MSAL Error:', message)
            break
          case LogLevel.Warning:
            console.warn('MSAL Warning:', message)
            break
          default:
            break
        }
      },
      logLevel: LogLevel.Warning
    }
  }
}

/**
 * Scopes requested during Microsoft Authentication.
 */
export const loginRequest = {
  scopes: apiScope.split(' ').filter(Boolean)
}

// Single instance of MSAL PublicClientApplication
let msalInstance: PublicClientApplication | null = null

export function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig)
  }
  return msalInstance
}
