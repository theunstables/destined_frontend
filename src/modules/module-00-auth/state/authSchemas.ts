import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .email('Enter a valid email address')

/**
 * The password rules, as data.
 *
 * M00-S03 renders these as a live checklist and M00-S06 as a strength meter.
 * Deriving the checklist, the meter and the schema from one list is what stops
 * them disagreeing — a user being told every rule passes while the form refuses
 * to submit.
 *
 * These are the approved A03 product rules: 8–128 characters, at least one
 * number, and at least one non-whitespace special character. The client and
 * backend derive their validation from this same contract so the live checklist
 * cannot claim a password is ready and then receive a server rejection.
 */
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: '8–128 characters',
    test: (v: string) => v.length >= 8 && v.length <= 128,
  },
  { id: 'number', label: 'One number', test: (v: string) => /\d/.test(v) },
  {
    id: 'special',
    label: 'One special character',
    test: (v: string) => /[^A-Za-z0-9\s]/.test(v),
  },
] as const

const strongPassword = PASSWORD_RULES.reduce<z.ZodType<string>>(
  (schema, rule) => schema.refine(rule.test, { message: rule.label }),
  z.string(),
)

export const signInSchema = z.object({
  email,
  // No strength rules here: rejecting a weak password a user already has is a
  // dead end.
  password: z.string().min(1, 'Enter your password'),
})

export const signUpSchema = z.object({
  email,
  password: strongPassword,
})

export const emailOnlySchema = z.object({ email })

/**
 * M00-S06 Reset Password.
 *
 * `confirmPassword` is a client-side guard only — `POST /auth/password/reset`
 * takes `{token, newPassword}` and knows nothing about it. It exists because a
 * mistyped password the user cannot see is a lockout they have to run the whole
 * reset flow again to escape.
 *
 * The match check is a `superRefine` guarded on the password being valid, so a
 * weak-but-matching pair reports only the real problem. Reporting a mismatch
 * that is not there sends someone hunting for a typo they never made.
 */
export const resetPasswordSchema = z
  .object({
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const passwordIsValid = strongPassword.safeParse(values.newPassword).success

    if (!passwordIsValid) return

    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        // On the confirm field, not the form: the user must know which box to fix.
        path: ['confirmPassword'],
        message: 'Both passwords need to match.',
      })
    }
  })

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type EmailOnlyValues = z.infer<typeof emailOnlySchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
