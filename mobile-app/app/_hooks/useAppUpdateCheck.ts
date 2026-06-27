import { useEffect, useMemo, useState } from 'react'
import Constants from 'expo-constants'
import { APP_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { ApiError, apiFetch } from '@/app/_utils/apiClient'

type UpdateInfo = {
  latestVersion: string
  apkUrl: string
  forceUpdate: boolean
  releaseNotes?: string
}

type UpdateCheckState = {
  checking: boolean
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string | null
  apkUrl: string | null
  forceUpdate: boolean
  releaseNotes: string | null
}

const normalizeVersion = (version: string) => version.trim().replace(/^v/i, '')

const compareVersions = (currentVersion: string, latestVersion: string) => {
  const currentParts = normalizeVersion(currentVersion).split('.').map(part => Number.parseInt(part, 10) || 0)
  const latestParts = normalizeVersion(latestVersion).split('.').map(part => Number.parseInt(part, 10) || 0)
  const maxLength = Math.max(currentParts.length, latestParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const currentValue = currentParts[index] ?? 0
    const latestValue = latestParts[index] ?? 0

    if (currentValue < latestValue) return -1
    if (currentValue > latestValue) return 1
  }

  return 0
}

const getCurrentAppVersion = () => Constants.expoConfig?.version || '0.0.0'

export function useAppUpdateCheck() {
  const currentVersion = useMemo(() => getCurrentAppVersion(), [])
  const [state, setState] = useState<UpdateCheckState>({
    checking: true,
    updateAvailable: false,
    currentVersion,
    latestVersion: null,
    apkUrl: null,
    forceUpdate: false,
    releaseNotes: null,
  })

  useEffect(() => {
    let cancelled = false

    const checkForUpdate = async () => {
      try {
        const response = await apiFetch(APP_ENDPOINTS.updateInfo, {
          auth: false,
          timeout: 10000,
        })

        const payload = await response.json()
        const updateInfo = payload?.data ?? payload

        if (cancelled) return

        const latestVersion = typeof updateInfo?.latestVersion === 'string' ? updateInfo.latestVersion : null
        const apkUrl = typeof updateInfo?.apkUrl === 'string' ? updateInfo.apkUrl : null
        const forceUpdate = Boolean(updateInfo?.forceUpdate)
        const releaseNotes = typeof updateInfo?.releaseNotes === 'string' ? updateInfo.releaseNotes : null

        const updateAvailable = Boolean(
          latestVersion && compareVersions(currentVersion, latestVersion) < 0 && apkUrl
        )

        setState({
          checking: false,
          updateAvailable,
          currentVersion,
          latestVersion,
          apkUrl,
          forceUpdate,
          releaseNotes,
        })
      } catch (error) {
        if (cancelled) return

        const isExpectedFailure = error instanceof ApiError || error instanceof TypeError
        if (!isExpectedFailure) {
          console.error('Failed to check for app update:', error)
        }

        setState((previous) => ({
          ...previous,
          checking: false,
        }))
      }
    }

    checkForUpdate()

    return () => {
      cancelled = true
    }
  }, [currentVersion])

  return state
}
