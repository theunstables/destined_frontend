import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { z } from 'zod'

import { isMockMode } from '@/config/env'
import { SETTINGS_PERSONAL_DETAILS_COPY as COPY } from '@/copy/settingsPersonalDetails'
import { PhotoPicker } from '@/design-system/patterns/PhotoPicker'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsRow } from '@/design-system/patterns/SettingsRow'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { DateField } from '@/design-system/primitives/DateField'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import { usePhotoPick } from '@/hooks/usePhotoPick'
import { pairingService } from '@/services/pairing'
import { useRelationshipStore } from '@/state/relationshipStore'
import { useSessionStore } from '@/state/sessionStore'
import { isPhoneNumber } from '@/utils/phone'

const schema = z.object({
  name: z.string().trim().min(1, COPY.nameRequired),
  nickname: z.string().trim().optional(),
  birthday: z.string().trim().optional(),
  pronouns: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isPhoneNumber(value), COPY.phoneInvalid),
})

type FormValues = z.infer<typeof schema>

/**
 * M05-S02 — Settings → Personal Details.
 *
 * The same fields `CreateProfileScreen` collects, in a settings frame — this is
 * where you change what you told the app during onboarding. The form stays in
 * `react-hook-form`; the pairing provider persists supported fields and only
 * its authoritative result reaches `relationshipStore`.
 *
 * EMAIL IS READ-ONLY. It is the sign-in credential, and changing it is a
 * security operation with its own confirmation — it belongs on Security &
 * Sessions, not in a form that saves five other things at once.
 *
 * Phone collection/verification has no backend contract, so it remains a
 * mock-preview control and is absent from API-backed builds.
 */
export function PersonalDetailsScreen() {
  const router = useRouter()
  const profile = useRelationshipStore((state) => state.profile)
  const setProfile = useRelationshipStore((state) => state.setProfile)
  const email = useSessionStore((state) => state.session?.email)
  const [photoUri, setPhotoUri] = useState<string | null>(profile?.photoUri ?? null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const { pick, error: photoError } = usePhotoPick(setPhotoUri, {
    allowsEditing: true,
    aspect: [1, 1],
  })

  const { control, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.name ?? '',
      nickname: profile?.nickname ?? '',
      birthday: profile?.birthday ?? '',
      pronouns: profile?.pronouns ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const phone = watch('phone')
  const isVerified = Boolean(profile?.phoneVerified) && phone === profile?.phone

  const goBack = useCallback(() => router.back(), [router])
  const goToVerify = useCallback(() => router.push('/(app)/settings/verify-phone'), [router])

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setSaveState('saving')
      const phoneChanged = values.phone !== profile?.phone
      const result = await pairingService.createProfile({
        name: values.name,
        nickname: values.nickname || undefined,
        birthday: values.birthday || undefined,
        pronouns: values.pronouns || undefined,
        photoUri: photoUri ?? undefined,
        phone: values.phone || undefined,
        phoneVerified: phoneChanged ? false : profile?.phoneVerified,
      })

      if (!result.ok) {
        setSaveState('error')
        return
      }

      setProfile(result.value)
      setPhotoUri(result.value.photoUri ?? null)
      setSaveState('saved')
    },
    [photoUri, profile, setProfile],
  )

  return (
    <SettingsScreenLayout title={COPY.title} lede={COPY.lede} onBack={goBack}>
      <View style={styles.photo}>
        <PhotoPicker
          label={COPY.photoLabel}
          name={profile?.name ?? ''}
          uri={photoUri}
          onPick={pick}
        />
        {photoError ? (
          <Text variant="footnote" tone="error" align="center">
            {photoError}
          </Text>
        ) : null}
      </View>

      <SectionPanel title={COPY.aboutGroup}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Input
              label={COPY.nameLabel}
              placeholder={COPY.namePlaceholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="nickname"
          render={({ field }) => (
            <Input
              label={COPY.nicknameLabel}
              placeholder={COPY.nicknamePlaceholder}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="birthday"
          render={({ field, fieldState }) => (
            <DateField
              label={COPY.birthdayLabel}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="pronouns"
          render={({ field }) => (
            <Input
              label={COPY.pronounsLabel}
              placeholder={COPY.pronounsPlaceholder}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
            />
          )}
        />
      </SectionPanel>

      <SectionPanel title={COPY.contactGroup}>
        {email ? (
          <Input
            label={COPY.emailLabel}
            value={email}
            onChangeText={() => {}}
            editable={false}
          />
        ) : null}
        <Text variant="footnote" tone="body">
          {COPY.emailLocked}
        </Text>

        {isMockMode ? (
          <>
            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <Input
                  label={COPY.phoneLabel}
                  placeholder={COPY.phonePlaceholder}
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              )}
            />

            <Text variant="footnote" tone="body">
              {COPY.phoneHelp}
            </Text>

            <SettingsRow
              icon={isVerified ? 'check-circle' : 'alert-circle'}
              label={COPY.verifyAction}
              detail={isVerified ? COPY.phoneVerified : COPY.phoneUnverified}
              onPress={goToVerify}
            />
          </>
        ) : null}
      </SectionPanel>

      <Button
        label={COPY.save}
        onPress={handleSubmit(onSubmit)}
        loading={formState.isSubmitting || saveState === 'saving'}
      />

      {saveState === 'saved' ? (
        <Text variant="footnote" tone="success" accessibilityLiveRegion="polite">
          {COPY.saved}
        </Text>
      ) : saveState === 'error' ? (
        <Text variant="footnote" tone="error" accessibilityRole="alert">
          {COPY.saveError}
        </Text>
      ) : null}
    </SettingsScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  photo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
}))
