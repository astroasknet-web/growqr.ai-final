"use client";

import { useActionState } from "react";
import {
  loginAction, mfaLoginAction, signupAction, forgotAction, resetAction, logoutAction, resendVerificationAction, mfaEnableAction, mfaDisableAction, type FormState,
} from "@/app/(portal)/actions";
import { CollegeField } from "./college-field";
import { COLLEGE_STATES } from "./college-states";
import { Alert, BotCheck, Field, Honeypot, LinkText, PasswordField, SubmitButton } from "./ui";

const none: FormState = {};

export function LoginForm({ next }: { next: string }) {
  const [s, action] = useActionState(loginAction, none);
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <input type="hidden" name="next" value={next} />
      <Honeypot />
      <Field label="Email address" name="email" type="email" inputMode="email" autoComplete="username" defaultValue={s.values?.email} error={s.fields?.email} autoFocus />
      <PasswordField error={s.fields?.password} />
      <p className="-mt-2 mb-5 text-[13px]"><LinkText href="/forgot-password">Forgot your password?</LinkText></p>
      <BotCheck />
      <SubmitButton pendingText="Logging in...">Log in</SubmitButton>
    </form>
  );
}

export function MfaLoginForm() {
  const [s, action] = useActionState(mfaLoginAction, none);
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <Field label="Verification code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={14} autoFocus hint="The 6-digit code from your authenticator app, or a recovery code." />
      <SubmitButton pendingText="Checking...">Verify and log in</SubmitButton>
    </form>
  );
}

export function SignupForm({ role }: { role: "student" | "employer" }) {
  const [s, action] = useActionState(signupAction, none);
  const isE = role === "employer";
  const f = s.fields ?? {};
  const v = s.values ?? {};
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <input type="hidden" name="role" value={role} />
      <Honeypot />
      <Field label="Full name" name="name" autoComplete="name" defaultValue={v.name} error={f.name} />
      <Field label={isE ? "Work email" : "Email address"} name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} error={f.email} />
      {isE ? (
        <>
          <Field label="Company" name="company" autoComplete="organization" defaultValue={v.company} error={f.company} />
          <Field label="Your role at the company" name="designation" autoComplete="organization-title" defaultValue={v.designation} error={f.designation} />
        </>
      ) : (
        <CollegeField defaultValue={v.college} error={f.college} states={COLLEGE_STATES} />
      )}
      <PasswordField label="Create a password" autoComplete="new-password" error={f.password} hint="At least 8 characters. A short phrase of unrelated words works well." />
      <div className="mb-5">
        <label className="flex gap-3 items-start text-[14px] text-ink-3 min-h-[44px]">
          <input type="checkbox" name="terms" className="mt-1 w-5 h-5 shrink-0 accent-orange" required />
          <span>I agree to the <LinkText href="/privacy-policy">Privacy Policy</LinkText> and terms of use.</span>
        </label>
        {f.terms ? <p className="text-[13px] text-red-700 mt-1">{f.terms}</p> : null}
      </div>
      <BotCheck />
      <SubmitButton pendingText="Creating your account...">Create account</SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const [s, action] = useActionState(forgotAction, none);
  if (s.ok) {
    return (
      <Alert kind="success">
        If an account exists for <b>{s.values?.email}</b>, we have sent a link to reset the password. It works once and lasts 60 minutes. Check your spam folder if it does not arrive.
      </Alert>
    );
  }
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <Honeypot />
      <Field label="Email address" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={s.values?.email} error={s.fields?.email} autoFocus />
      <BotCheck />
      <SubmitButton pendingText="Sending...">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [s, action] = useActionState(resetAction, none);
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <input type="hidden" name="token" value={token} />
      <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters. A short phrase of unrelated words works well." />
      <SubmitButton pendingText="Saving...">Save new password</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  const [s, action] = useActionState(resendVerificationAction, none);
  return (
    <form action={action}>
      {s.error ? <Alert>{s.error}</Alert> : null}
      {s.ok ? <Alert kind="success">{s.message}</Alert> : null}
      <SubmitButton pendingText="Sending...">Send me a new link</SubmitButton>
    </form>
  );
}

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className || "min-h-[44px] px-4 rounded-lg border border-black/[0.15] text-[14px] font-medium text-ink-2 hover:bg-cream-2"}>Log out</button>
    </form>
  );
}

export function MfaEnableForm() {
  const [s, action] = useActionState(mfaEnableAction, none);
  if (s.ok && s.codes) {
    return (
      <div>
        <Alert kind="success">Two-step verification is on.</Alert>
        <h2 className="text-[16px] font-semibold text-ink mb-2">Save your recovery codes</h2>
        <p className="text-[14px] text-ink-3 mb-4">If you lose your phone, each of these codes lets you log in once. They are shown only now: store them somewhere safe.</p>
        <ul className="grid grid-cols-2 gap-x-6 font-mono text-[15px] leading-8 mb-6">{s.codes.map((c) => <li key={c}>{c}</li>)}</ul>
        <a href="/account" className="inline-flex items-center justify-center w-full min-h-[48px] rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]">Continue</a>
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} autoFocus />
      <SubmitButton pendingText="Checking...">Turn on two-step verification</SubmitButton>
    </form>
  );
}

export function MfaDisableForm() {
  const [s, action] = useActionState(mfaDisableAction, none);
  if (s.ok) return <Alert kind="success">{s.message}</Alert>;
  return (
    <form action={action} noValidate>
      {s.error ? <Alert>{s.error}</Alert> : null}
      <PasswordField />
      <Field label="Current code or recovery code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={14} />
      <SubmitButton pendingText="Checking...">Turn off</SubmitButton>
    </form>
  );
}
