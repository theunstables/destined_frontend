import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import { isMockMode } from '@/config/env'
import { SETTINGS_SECURITY_COPY as COPY } from '@/copy/settingsSecurity'
import { DangerRow } from '@/design-system/patterns/DangerRow'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsRow } from '@/design-system/patterns/SettingsRow'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { SettingsToggleRow } from '@/design-system/patterns/SettingsToggleRow'
import { Text } from '@/design-system/primitives/Text'
import { MOCK_SESSIONS } from '@/modules/module-05-profile/data/mock'

/**
 * M05-S08 — Settings → Security & Sessions.
 *
 * Session and two-factor controls are previewable in mock mode. API-backed
 * builds render honest informational rows because no remote-session or 2FA
 * contract exists; security-sensitive local simulation must never look real.
 *
 * Change password and two-factor are rows without destinations in this plan.
 * Both are auth operations, `services/auth` is a mock, and inventing a
 * password-change screen that changes nothing would be the one place in this
 * cluster where the UI lies about what happened.
 */
export function SecurityScreen() {
  const router = useRouter()
  const [sessions, setSessions] = useState(MOCK_SESSIONS)
  const [twoFactor, setTwoFactor] = useState(false)
  const [signedOutOthers, setSignedOutOthers] = useState(false)

  const goBack = useCallback(() => router.back(), [router])

  const signOutOthers = useCallback(() => {
    setSessions((current) => current.filter((session) => session.isCurrent))
    setSignedOutOthers(true)
  }, [])

  const hasOthers = sessions.some((session) => !session.isCurrent)

  return (
    <SettingsScreenLayout title={COPY.title} lede={COPY.lede} onBack={goBack}>
      <SectionPanel title={COPY.credentialsGroup}>
        <SettingsRow
          icon="key"
          label={COPY.changePassword}
          detail={COPY.changePasswordDetail}
        />
        {isMockMode ? (
          <SettingsToggleRow
            icon="shield"
            label={COPY.twoFactor}
            detail={COPY.twoFactorDetail}
            value={twoFactor}
            onValueChange={setTwoFactor}
          />
        ) : (
          <SettingsRow
            icon="shield"
            label={COPY.twoFactor}
            detail={`${COPY.twoFactorDetail} ${COPY.unavailable}`}
          />
        )}
      </SectionPanel>

      <SectionPanel title={COPY.sessionsGroup}>
        {isMockMode ? (
          sessions.map((session) => (
            <SettingsRow
              key={session.id}
              icon={session.isCurrent ? 'smartphone' : 'monitor'}
              label={session.device}
              detail={`${session.location} · ${COPY.lastActivePrefix} ${session.lastActive}`}
              value={session.isCurrent ? COPY.thisDevice : undefined}
            />
          ))
        ) : (
          <Text variant="body" tone="body">
            {COPY.sessionsUnavailable}
          </Text>
        )}
      </SectionPanel>

      {isMockMode && hasOthers ? (
        <SectionPanel title={COPY.dangerGroup}>
          <DangerRow
            icon="log-out"
            label={COPY.signOutAll}
            detail={COPY.signOutAllDetail}
            confirmTitle={COPY.signOutAllTitle}
            confirmBody={COPY.signOutAllBody}
            cancelLabel={COPY.signOutAllCancel}
            confirmLabel={COPY.signOutAllConfirm}
            onConfirm={signOutOthers}
          />
        </SectionPanel>
      ) : null}

      {isMockMode && signedOutOthers ? (
        <Text variant="footnote" tone="success">
          {COPY.signedOutAll}
        </Text>
      ) : null}
    </SettingsScreenLayout>
  )
}
