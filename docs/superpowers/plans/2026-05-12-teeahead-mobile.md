# TeeAhead Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native (Expo) iOS app serving golfer members and course staff from a single codebase connected to the existing TeeAhead Supabase backend.

**Architecture:** Role detection after login routes users to either `(member)` or `(staff)` tab groups. All data comes from the same Supabase project as the web app (`raqarpvbcdpgojcrmpyh`); RLS policies already govern access. The app is read/write for existing users only — no signup, no course onboarding.

**Tech Stack:** Expo SDK 52, Expo Router v3, React Native + TypeScript, NativeWind v4, Zustand, @supabase/supabase-js v2, expo-camera, expo-secure-store, expo-notifications, react-native-qrcode-svg, @stripe/stripe-react-native

---

## Schema Corrections (spec vs reality)

The spec references two things that don't exist yet:
- `course_roles` table → actual table is **`course_admins`** (columns: `user_id`, `course_id`, `role`)
- `bookings.checked_in` → doesn't exist; `bookings.holes` → doesn't exist

**Task 0 handles a required DB migration before any app code.**

---

## File Structure

```
teeahead-mobile/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (member)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── courses.tsx
│   │   ├── bookings.tsx
│   │   ├── points.tsx
│   │   ├── card.tsx
│   │   ├── account.tsx
│   │   └── book/
│   │       ├── [courseSlug].tsx
│   │       └── confirm.tsx
│   └── (staff)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── checkin.tsx
│       ├── members.tsx
│       └── account.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Input.tsx
│   ├── member/
│   │   ├── MemberCard.tsx
│   │   ├── TeeTimeSlot.tsx
│   │   ├── BookingCard.tsx
│   │   └── PointsRow.tsx
│   └── staff/
│       ├── TeeSheetRow.tsx
│       ├── CheckInResult.tsx
│       └── MemberSearchResult.tsx
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── queries/
│       ├── member.ts
│       └── staff.ts
├── store/
│   └── auth.ts
├── types/
│   └── database.ts
└── constants/
    └── theme.ts
```

---

## Task 0: DB Migration (run against shared Supabase project)

**This must run before the app can check in members or record holes.**

- [ ] **Step 1: Apply migration from web repo**

From `/Users/barris/Desktop/MulliganLinks`, create `supabase/migrations/070_mobile_checkin.sql`:

```sql
-- Add check-in tracking and holes selection to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS holes integer DEFAULT 18 CHECK (holes IN (9, 18));

-- Course admins can update check-in status
CREATE POLICY IF NOT EXISTS "Course admins can check in bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tee_times tt
      JOIN public.course_admins ca ON ca.course_id = tt.course_id
      WHERE tt.id = bookings.tee_time_id
        AND ca.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Push migration**

```bash
cd /Users/barris/Desktop/MulliganLinks
npx supabase db push
```

Expected: migration applied to `raqarpvbcdpgojcrmpyh`.

---

## Task 1: Repo Setup

- [ ] **Step 1: Create Expo project**

```bash
cd ~/Desktop
npx create-expo-app@latest teeahead-mobile --template tabs
cd teeahead-mobile
```

- [ ] **Step 2: Install core dependencies**

```bash
npx expo install @supabase/supabase-js zustand nativewind react-native-reanimated
npx expo install expo-camera expo-secure-store expo-notifications expo-barcode-scanner
npx expo install @stripe/stripe-react-native
npx expo install react-native-svg
npm install react-native-qrcode-svg
npm install @react-native-community/datetimepicker
```

- [ ] **Step 3: Configure NativeWind**

Create `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2D6A4F',
        'primary-light': '#52B788',
        background: '#F8FAF9',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B7280',
        ace: '#1A1A1A',
        'ace-gold': '#D4AF37',
      },
    },
  },
  plugins: [],
}
```

Update `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

- [ ] **Step 4: Create `.env.local`**

```bash
# Copy values from /Users/barris/Desktop/MulliganLinks/.env.local
cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://raqarpvbcdpgojcrmpyh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<copy NEXT_PUBLIC_SUPABASE_ANON_KEY from web .env.local>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<copy NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY from web .env.local>
EOF
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: init expo project with all dependencies"
```

---

## Task 2: Types, Theme, Supabase Client

**Files:**
- Create: `types/database.ts`
- Create: `constants/theme.ts`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Write `types/database.ts`**

```typescript
export type MembershipTier = 'free' | 'eagle' | 'ace'
export type MembershipStatus = 'active' | 'canceled' | 'past_due'
export type BookingStatus = 'confirmed' | 'canceled' | 'completed' | 'no_show'
export type CourseStatus = 'active' | 'pending' | 'archived'
export type CourseAdminRole = 'owner' | 'manager' | 'staff'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  home_course_id: string | null
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  user_id: string
  tier: MembershipTier
  status: MembershipStatus
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_end: string | null
  created_at: string
  canceled_at: string | null
}

export interface Course {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  hero_image_url: string | null
  base_green_fee: number | null
  status: CourseStatus
  created_at: string
}

export interface TeeTime {
  id: string
  course_id: string
  scheduled_at: string
  max_players: number
  available_players: number
  base_price: number
  status: 'open' | 'booked' | 'blocked'
}

export interface Booking {
  id: string
  tee_time_id: string
  user_id: string
  players: number
  total_paid: number
  status: BookingStatus
  points_awarded: number
  checked_in: boolean
  checked_in_at: string | null
  holes: number | null
  created_at: string
  completed_at: string | null
}

export interface CourseAdmin {
  id: string
  user_id: string
  course_id: string
  role: CourseAdminRole
  created_at: string
}

export interface FairwayPoints {
  id: string
  user_id: string
  course_id: string | null
  booking_id: string | null
  amount: number
  reason: string
  created_at: string
}

export interface MemberCredit {
  id: string
  user_id: string
  type: 'monthly' | 'birthday' | 'free_round' | 'manual'
  amount_cents: number
  period: string | null
  status: 'available' | 'used' | 'expired'
  redeemed_booking_id: string | null
  expires_at: string | null
  created_at: string
}
```

- [ ] **Step 2: Write `constants/theme.ts`**

```typescript
export const Colors = {
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  background: '#F8FAF9',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  card: '#FFFFFF',
  eagle: '#2D6A4F',
  ace: '#1A1A1A',
  aceGold: '#D4AF37',
  fairway: '#6B7280',
  error: '#DC2626',
  success: '#16A34A',
} as const

export const tierColor = (tier: string) => {
  if (tier === 'eagle') return Colors.eagle
  if (tier === 'ace') return Colors.ace
  return Colors.fairway
}

export const tierLabel = (tier: string) => {
  if (tier === 'eagle') return 'Eagle'
  if (tier === 'ace') return 'Ace'
  return 'Fairway'
}
```

- [ ] **Step 3: Write `lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

- [ ] **Step 4: Commit**

```bash
git add types/database.ts constants/theme.ts lib/supabase.ts
git commit -m "feat: types, theme constants, supabase client"
```

---

## Task 3: Zustand Auth Store

**Files:**
- Create: `store/auth.ts`

- [ ] **Step 1: Write `store/auth.ts`**

```typescript
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, Membership, CourseAdmin } from '../types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  membership: Membership | null
  courseAdmin: CourseAdmin | null
  activeRole: 'member' | 'staff'
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setMembership: (membership: Membership | null) => void
  setCourseAdmin: (courseAdmin: CourseAdmin | null) => void
  setActiveRole: (role: 'member' | 'staff') => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  membership: null,
  courseAdmin: null,
  activeRole: 'member',
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setMembership: (membership) => set({ membership }),
  setCourseAdmin: (courseAdmin) => set({ courseAdmin }),
  setActiveRole: (activeRole) => set({ activeRole }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    user: null,
    profile: null,
    membership: null,
    courseAdmin: null,
    activeRole: 'member',
    isLoading: false,
  }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add store/auth.ts
git commit -m "feat: zustand auth store"
```

---

## Task 4: Auth Helpers

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Write `lib/auth.ts`**

```typescript
import { supabase } from './supabase'
import { useAuthStore } from '../store/auth'
import type { Profile, Membership, CourseAdmin } from '../types/database'

export async function loadUserData(userId: string) {
  const store = useAuthStore.getState()

  const [profileResult, membershipResult, courseAdminResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('memberships').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    supabase.from('course_admins').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const profile = profileResult.data as Profile | null
  const membership = membershipResult.data as Membership | null
  const courseAdmin = courseAdminResult.data as CourseAdmin | null

  store.setProfile(profile)
  store.setMembership(membership)
  store.setCourseAdmin(courseAdmin)

  // Default role: staff if they have a course_admin row, else member
  // If they have both, default to member (they can switch)
  if (courseAdmin && !membership) {
    store.setActiveRole('staff')
  } else {
    store.setActiveRole('member')
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  useAuthStore.getState().reset()
  await supabase.auth.signOut()
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: auth helpers with role detection"
```

---

## Task 5: Root Layout + Auth Gate

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Write `app/_layout.tsx`**

```typescript
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { supabase } from '../lib/supabase'
import { loadUserData } from '../lib/auth'
import { useAuthStore } from '../store/auth'

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser)
  const setIsLoading = useAuthStore((s) => s.setIsLoading)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadUserData(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadUserData(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(member)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: root layout with supabase auth listener"
```

---

## Task 6: Splash / Role Redirect

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Write `app/index.tsx`**

```typescript
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../store/auth'
import { Colors } from '../constants/theme'

export default function Index() {
  const router = useRouter()
  const { user, isLoading, activeRole } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/(auth)/login')
    } else if (activeRole === 'staff') {
      router.replace('/(staff)')
    } else {
      router.replace('/(member)')
    }
  }, [user, isLoading, activeRole])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: splash redirect with role-based routing"
```

---

## Task 7: Login Screen

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`

- [ ] **Step 1: Write `app/(auth)/_layout.tsx`**

```typescript
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 2: Write `app/(auth)/login.tsx`**

```typescript
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { signIn } from '../../lib/auth'
import { loadUserData } from '../../lib/auth'
import { useAuthStore } from '../../store/auth'
import { Colors } from '../../constants/theme'

export default function LoginScreen() {
  const router = useRouter()
  const { setUser, activeRole } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { user } = await signIn(email.trim().toLowerCase(), password)
      if (user) {
        setUser(user)
        await loadUserData(user.id)
        const { activeRole: role } = useAuthStore.getState()
        router.replace(role === 'staff' ? '/(staff)' : '/(member)')
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message ?? 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.primary, marginBottom: 8 }}>
          TeeAhead
        </Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 40 }}>
          Sign in to your account
        </Text>

        <TextInput
          style={{
            height: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
            paddingHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card,
            fontSize: 16, color: Colors.textPrimary,
          }}
          placeholder="Email"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={{
            height: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
            paddingHorizontal: 16, marginBottom: 24, backgroundColor: Colors.card,
            fontSize: 16, color: Colors.textPrimary,
          }}
          placeholder="Password"
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            height: 48, backgroundColor: Colors.primary, borderRadius: 8,
            justifyContent: 'center', alignItems: 'center', marginBottom: 16,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Visit teeahead.com to reset your password.')}>
          <Text style={{ color: Colors.primary, textAlign: 'center', fontSize: 14 }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
```

- [ ] **Step 3: Verify Phase 1**

```bash
npx expo start
```

Test with a known member account → should land on `/(member)`.
Test with a known staff account (has row in `course_admins`) → should land on `/(staff)`.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: login screen with role-based post-auth routing"
```

---

## Task 8: Shared UI Primitives

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Input.tsx`

- [ ] **Step 1: Write `components/ui/Button.tsx`**

```typescript
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { Colors } from '../../constants/theme'

interface ButtonProps {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ label, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const bg = variant === 'primary' ? Colors.primary : variant === 'secondary' ? Colors.card : 'transparent'
  const textColor = variant === 'primary' ? '#fff' : Colors.primary
  const borderColor = variant === 'secondary' ? Colors.primary : 'transparent'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor: bg, borderColor, borderWidth: variant === 'secondary' ? 1 : 0, opacity: disabled ? 0.5 : 1 }]}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  label: { fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 2: Write `components/ui/Card.tsx`**

```typescript
import { View, StyleSheet, ViewProps } from 'react-native'

export function Card({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
})
```

- [ ] **Step 3: Write `components/ui/Badge.tsx`**

```typescript
import { View, Text, StyleSheet } from 'react-native'

interface BadgeProps {
  label: string
  color?: string
  textColor?: string
}

export function Badge({ label, color = '#E5E7EB', textColor = '#374151' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '600' },
})
```

- [ ] **Step 4: Write `components/ui/Input.tsx`**

```typescript
import { TextInput, TextInputProps, StyleSheet } from 'react-native'
import { Colors } from '../../constants/theme'

export function Input(props: TextInputProps) {
  return (
    <TextInput
      style={[styles.input, props.style]}
      placeholderTextColor={Colors.textSecondary}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1A1A1A',
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: shared UI primitives (Button, Card, Badge, Input)"
```

---

## Task 9: Member Tab Navigator

**Files:**
- Create: `app/(member)/_layout.tsx`

- [ ] **Step 1: Write `app/(member)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/theme'

export default function MemberLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="courses" options={{ title: 'Courses', tabBarLabel: 'Courses' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarLabel: 'Bookings' }} />
      <Tabs.Screen name="points" options={{ title: 'Points', tabBarLabel: 'Points' }} />
      <Tabs.Screen name="card" options={{ title: 'My Card', tabBarLabel: 'My Card' }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarLabel: 'Account' }} />
      <Tabs.Screen name="book" options={{ href: null }} />
    </Tabs>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(member)/_layout.tsx
git commit -m "feat: member tab navigator"
```

---

## Task 10: Member Queries

**Files:**
- Create: `lib/queries/member.ts`

- [ ] **Step 1: Write `lib/queries/member.ts`**

```typescript
import { supabase } from '../supabase'
import type { Course, Booking, TeeTime, FairwayPoints, MemberCredit } from '../../types/database'

export async function getActiveCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export async function getTeeTimesForDate(courseId: string, date: string): Promise<TeeTime[]> {
  // date is YYYY-MM-DD
  const start = `${date}T00:00:00`
  const end = `${date}T23:59:59`
  const { data, error } = await supabase
    .from('tee_times')
    .select('*')
    .eq('course_id', courseId)
    .eq('status', 'open')
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .gt('available_players', 0)
    .order('scheduled_at')
  if (error) throw error
  return data ?? []
}

export async function getMyBookings(userId: string): Promise<(Booking & { tee_times: TeeTime & { courses: { name: string; city: string | null } } })[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      tee_times (
        *,
        courses ( name, city )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as any
}

export async function getPointsBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('fairway_points')
    .select('amount')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + row.amount, 0)
}

export async function getPointsHistory(userId: string): Promise<FairwayPoints[]> {
  const { data, error } = await supabase
    .from('fairway_points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function createBooking(params: {
  teeTimeId: string
  userId: string
  players: number
  holes: number
  totalPaid: number
}): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      tee_time_id: params.teeTimeId,
      user_id: params.userId,
      players: params.players,
      holes: params.holes,
      total_paid: params.totalPaid,
      status: 'confirmed',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'canceled' })
    .eq('id', bookingId)
  if (error) throw error
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/queries/member.ts
git commit -m "feat: member query helpers"
```

---

## Task 11: Member Dashboard

**Files:**
- Create: `app/(member)/index.tsx`

- [ ] **Step 1: Write `app/(member)/index.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { getMyBookings, getPointsBalance } from '../../lib/queries/member'
import { Colors, tierColor, tierLabel } from '../../constants/theme'

export default function MemberDashboard() {
  const router = useRouter()
  const { profile, membership } = useAuthStore()
  const [pointsBalance, setPointsBalance] = useState<number | null>(null)
  const [nextBooking, setNextBooking] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (!profile) return
    Promise.all([
      getPointsBalance(profile.id),
      getMyBookings(profile.id),
    ]).then(([pts, bookings]) => {
      setPointsBalance(pts)
      const upcoming = bookings.find((b) => b.status === 'confirmed' && new Date((b as any).tee_times.scheduled_at) > new Date())
      setNextBooking(upcoming ?? null)
    }).finally(() => setLoading(false))
  }, [profile])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    )
  }

  const tier = membership?.tier ?? 'free'

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginTop: 60 }}>
        {greeting}, {firstName}
      </Text>

      <Badge
        label={tierLabel(tier) + ' Member'}
        color={tierColor(tier)}
        textColor="#fff"
      />

      <Card style={{ marginTop: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Fairway Points</Text>
        <Text style={{ fontSize: 48, fontWeight: '700', color: Colors.primary }}>
          {pointsBalance ?? 0}
        </Text>
      </Card>

      {nextBooking ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>Next Booking</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.textPrimary }}>
            {nextBooking.tee_times.courses.name}
          </Text>
          <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>
            {new Date(nextBooking.tee_times.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {new Date(nextBooking.tee_times.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' · '}{nextBooking.players} players · {nextBooking.holes ?? 18} holes
          </Text>
        </Card>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.textSecondary }}>No upcoming bookings</Text>
        </Card>
      )}

      <Button
        label="Book a Tee Time"
        onPress={() => router.push('/(member)/courses')}
        variant="primary"
      />
    </ScrollView>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(member)/index.tsx
git commit -m "feat: member dashboard screen"
```

---

## Task 12: Member Card (QR Code)

**Files:**
- Create: `components/member/MemberCard.tsx`
- Create: `app/(member)/card.tsx`

This is the most strategically important screen — it unblocks course staff testing.

- [ ] **Step 1: Write `components/member/MemberCard.tsx`**

```typescript
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Badge } from '../ui/Badge'
import { Colors, tierColor, tierLabel } from '../../constants/theme'
import type { Profile, Membership } from '../../types/database'

interface MemberCardProps {
  profile: Profile
  membership: Membership | null
}

export function MemberCard({ profile, membership }: MemberCardProps) {
  const { width } = useWindowDimensions()
  const tier = membership?.tier ?? 'free'
  const isAce = tier === 'ace'
  const cardBg = isAce ? Colors.ace : Colors.primary
  const qrSize = width * 0.55

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {isAce && (
        <View style={styles.aceAccent} />
      )}

      <Text style={styles.name}>{profile.full_name ?? 'Member'}</Text>

      <Badge
        label={tierLabel(tier)}
        color={isAce ? Colors.aceGold : Colors.primaryLight}
        textColor={isAce ? Colors.ace : '#fff'}
      />

      <View style={styles.qrWrapper}>
        <QRCode
          value={profile.id}
          size={qrSize}
          color={Colors.textPrimary}
          backgroundColor="#fff"
        />
      </View>

      <Text style={styles.hint}>Show this to the starter to check in</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  aceAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#D4AF37',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
})
```

- [ ] **Step 2: Write `app/(member)/card.tsx`**

```typescript
import { useEffect } from 'react'
import { View, Text, ScrollView, Platform } from 'react-native'
import * as Brightness from 'expo-brightness'
import { useAuthStore } from '../../store/auth'
import { MemberCard } from '../../components/member/MemberCard'
import { Colors } from '../../constants/theme'

export default function CardScreen() {
  const { profile, membership } = useAuthStore()

  useEffect(() => {
    let originalBrightness: number
    Brightness.requestPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Brightness.getBrightnessAsync().then((b) => {
          originalBrightness = b
          Brightness.setBrightnessAsync(1.0)
        })
      }
    })
    return () => {
      if (originalBrightness !== undefined) {
        Brightness.setBrightnessAsync(originalBrightness)
      }
    }
  }, [])

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Loading your card...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingVertical: 60, paddingHorizontal: 0 }}
    >
      <MemberCard profile={profile} membership={membership} />
    </ScrollView>
  )
}
```

Note: `expo-brightness` needs to be installed:

```bash
npx expo install expo-brightness
```

- [ ] **Step 3: Commit**

```bash
git add components/member/MemberCard.tsx app/(member)/card.tsx
git commit -m "feat: member digital card with QR code"
```

---

## Task 13: Bookings Screen

**Files:**
- Create: `components/member/BookingCard.tsx`
- Create: `app/(member)/bookings.tsx`

- [ ] **Step 1: Write `components/member/BookingCard.tsx`**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Colors } from '../../constants/theme'

interface BookingCardProps {
  booking: any
  onCancel?: () => void
  cancellable?: boolean
}

export function BookingCard({ booking, onCancel, cancellable }: BookingCardProps) {
  const tt = booking.tee_times
  const date = new Date(tt.scheduled_at)
  const isPast = date < new Date()
  const statusColors: Record<string, string> = {
    confirmed: Colors.success,
    canceled: Colors.textSecondary,
    completed: Colors.primary,
    no_show: Colors.error,
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.courseName}>{tt.courses.name}</Text>
        <Badge
          label={booking.status}
          color={statusColors[booking.status] ?? Colors.textSecondary}
          textColor="#fff"
        />
      </View>
      <Text style={styles.detail}>
        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        {' · '}
        {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </Text>
      <Text style={styles.detail}>
        {booking.players} player{booking.players !== 1 ? 's' : ''} · {booking.holes ?? 18} holes
      </Text>
      {cancellable && !isPast && booking.status === 'confirmed' && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  courseName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  detail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  cancelBtn: { marginTop: 10 },
  cancelText: { color: Colors.error, fontSize: 14 },
})
```

- [ ] **Step 2: Write `app/(member)/bookings.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../store/auth'
import { getMyBookings, cancelBooking } from '../../lib/queries/member'
import { BookingCard } from '../../components/member/BookingCard'
import { Colors } from '../../constants/theme'

export default function BookingsScreen() {
  const { profile, membership } = useAuthStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const tier = membership?.tier ?? 'free'
  const canCancel = tier === 'eagle' || tier === 'ace'

  async function load() {
    if (!profile) return
    const data = await getMyBookings(profile.id)
    setBookings(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  function isCancellable(booking: any): boolean {
    if (!canCancel) return false
    const scheduled = new Date(booking.tee_times.scheduled_at)
    const cutoff = new Date(scheduled.getTime() - 60 * 60 * 1000) // 1 hour before
    return new Date() < cutoff
  }

  async function handleCancel(bookingId: string) {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'Keep Booking', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: async () => {
          await cancelBooking(bookingId)
          load()
        },
      },
    ])
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  }

  const now = new Date()
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.tee_times.scheduled_at) > now)
  const past = bookings.filter((b) => b.status !== 'confirmed' || new Date(b.tee_times.scheduled_at) <= now)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 60, marginBottom: 20 }}>
        My Bookings
      </Text>

      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 }}>Upcoming</Text>
      {upcoming.length === 0
        ? <Text style={{ color: Colors.textSecondary, marginBottom: 24 }}>No upcoming bookings</Text>
        : upcoming.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            cancellable={isCancellable(b)}
            onCancel={() => handleCancel(b.id)}
          />
        ))
      }

      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 16, marginBottom: 12 }}>Past</Text>
      {past.length === 0
        ? <Text style={{ color: Colors.textSecondary }}>No past bookings</Text>
        : past.map((b) => <BookingCard key={b.id} booking={b} />)
      }
    </ScrollView>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/member/BookingCard.tsx app/(member)/bookings.tsx
git commit -m "feat: member bookings screen"
```

---

## Task 14: Points Screen

**Files:**
- Create: `components/member/PointsRow.tsx`
- Create: `app/(member)/points.tsx`

- [ ] **Step 1: Write `components/member/PointsRow.tsx`**

```typescript
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/theme'
import type { FairwayPoints } from '../../types/database'

export function PointsRow({ item }: { item: FairwayPoints }) {
  const isEarned = item.amount > 0
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reason}>{item.reason}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.amount, { color: isEarned ? Colors.success : Colors.error }]}>
        {isEarned ? '+' : ''}{item.amount}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reason: { fontSize: 14, color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700' },
})
```

- [ ] **Step 2: Write `app/(member)/points.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../store/auth'
import { getPointsBalance, getPointsHistory } from '../../lib/queries/member'
import { PointsRow } from '../../components/member/PointsRow'
import { Card } from '../../components/ui/Card'
import { Colors } from '../../constants/theme'
import type { FairwayPoints } from '../../types/database'

const REWARD_THRESHOLDS = [500, 1000, 2500, 5000]

export default function PointsScreen() {
  const { profile } = useAuthStore()
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<FairwayPoints[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([getPointsBalance(profile.id), getPointsHistory(profile.id)])
      .then(([bal, hist]) => { setBalance(bal); setHistory(hist) })
      .finally(() => setLoading(false))
  }, [profile])

  const nextThreshold = REWARD_THRESHOLDS.find((t) => t > balance) ?? REWARD_THRESHOLDS[REWARD_THRESHOLDS.length - 1]
  const prevThreshold = REWARD_THRESHOLDS.filter((t) => t <= balance).pop() ?? 0
  const progress = nextThreshold > prevThreshold
    ? (balance - prevThreshold) / (nextThreshold - prevThreshold)
    : 1

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 60, marginBottom: 20 }}>
        Fairway Points
      </Text>

      <Card style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 56, fontWeight: '700', color: Colors.primary }}>{balance}</Text>
        <Text style={{ color: Colors.textSecondary }}>points balance</Text>

        <View style={{ width: '100%', marginTop: 16 }}>
          <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 }}>
            <View style={{ height: 8, width: `${Math.min(progress * 100, 100)}%`, backgroundColor: Colors.primary, borderRadius: 4 }} />
          </View>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            {balance} / {nextThreshold} pts to next reward
          </Text>
        </View>
      </Card>

      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 }}>History</Text>
      {history.length === 0
        ? <Text style={{ color: Colors.textSecondary }}>No points history yet</Text>
        : history.map((item) => <PointsRow key={item.id} item={item} />)
      }
    </ScrollView>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/member/PointsRow.tsx app/(member)/points.tsx
git commit -m "feat: member points screen with progress bar"
```

---

## Task 15: Member Account Screen

**Files:**
- Create: `app/(member)/account.tsx`

- [ ] **Step 1: Write `app/(member)/account.tsx`**

```typescript
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native'
import { useAuthStore } from '../../store/auth'
import { signOut } from '../../lib/auth'
import { useRouter } from 'expo-router'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Colors, tierColor, tierLabel } from '../../constants/theme'

export default function AccountScreen() {
  const router = useRouter()
  const { profile, membership, user, courseAdmin, setActiveRole } = useAuthStore()
  const tier = membership?.tier ?? 'free'

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  async function handleShareReferral() {
    if (!user) return
    await Share.share({
      message: `Join me on TeeAhead — golf memberships that pay for themselves. Sign up at https://teeahead.com/join?ref=${profile?.id}`,
    })
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 60, marginBottom: 20 }}>
        Account
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.textPrimary }}>{profile?.full_name ?? '—'}</Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>{user?.email}</Text>
        {profile?.phone && <Text style={{ color: Colors.textSecondary, marginTop: 2 }}>{profile.phone}</Text>}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>Membership</Text>
          <Badge label={tierLabel(tier)} color={tierColor(tier)} textColor="#fff" />
        </View>
        {membership?.current_period_end && (
          <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>
            Renews {new Date(membership.current_period_end).toLocaleDateString()}
          </Text>
        )}
      </Card>

      {courseAdmin && (
        <TouchableOpacity
          style={{ backgroundColor: Colors.primaryLight, borderRadius: 8, padding: 14, marginBottom: 16 }}
          onPress={() => { setActiveRole('staff'); router.replace('/(staff)') }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>Switch to Staff View</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={{ backgroundColor: Colors.card, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' }}
        onPress={handleShareReferral}
      >
        <Text style={{ color: Colors.primary, fontWeight: '600', textAlign: 'center' }}>Refer a Friend</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: '#FEF2F2', borderRadius: 8, padding: 14, marginTop: 8 }}
        onPress={handleSignOut}
      >
        <Text style={{ color: Colors.error, fontWeight: '600', textAlign: 'center' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(member)/account.tsx
git commit -m "feat: member account screen"
```

---

## Task 16: Courses List + Tee Time Picker

**Files:**
- Create: `app/(member)/courses.tsx`
- Create: `components/member/TeeTimeSlot.tsx`
- Create: `app/(member)/book/[courseSlug].tsx`
- Create: `app/(member)/book/confirm.tsx`

- [ ] **Step 1: Write `app/(member)/courses.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { getActiveCourses } from '../../lib/queries/member'
import { Card } from '../../components/ui/Card'
import { Colors } from '../../constants/theme'
import type { Course } from '../../types/database'

export default function CoursesScreen() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveCourses().then(setCourses).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 60, marginBottom: 20 }}>
        Partner Courses
      </Text>
      {courses.map((course) => (
        <TouchableOpacity key={course.id} onPress={() => router.push(`/(member)/book/${course.slug}`)}>
          <Card style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
            {course.hero_image_url && (
              <Image source={{ uri: course.hero_image_url }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
            )}
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>{course.name}</Text>
              {course.city && <Text style={{ color: Colors.textSecondary, marginTop: 2 }}>{course.city}, {course.state}</Text>}
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}
```

- [ ] **Step 2: Write `components/member/TeeTimeSlot.tsx`**

```typescript
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/theme'
import type { TeeTime } from '../../types/database'

interface TeeTimeSlotProps {
  teeTime: TeeTime
  membershipTier: string
  onPress: () => void
}

export function TeeTimeSlot({ teeTime, membershipTier, onPress }: TeeTimeSlotProps) {
  const free = membershipTier === 'eagle' || membershipTier === 'ace'
  const time = new Date(teeTime.scheduled_at)

  return (
    <TouchableOpacity style={styles.slot} onPress={onPress}>
      <Text style={styles.time}>
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </Text>
      <Text style={styles.spots}>{teeTime.available_players} spots</Text>
      <View style={[styles.priceBadge, { backgroundColor: free ? Colors.primary : '#F3F4F6' }]}>
        <Text style={[styles.price, { color: free ? '#fff' : Colors.textPrimary }]}>
          {free ? 'FREE' : `$${teeTime.base_price}`}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  slot: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  time: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  spots: { fontSize: 13, color: Colors.textSecondary, marginRight: 12 },
  priceBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  price: { fontWeight: '700', fontSize: 13 },
})
```

- [ ] **Step 3: Write `app/(member)/book/[courseSlug].tsx`**

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getCourseBySlug, getTeeTimesForDate } from '../../../lib/queries/member'
import { TeeTimeSlot } from '../../../components/member/TeeTimeSlot'
import { useAuthStore } from '../../../store/auth'
import { Colors } from '../../../constants/theme'
import type { Course, TeeTime } from '../../../types/database'

function getNext14Days(): string[] {
  const days: string[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function BookCourseScreen() {
  const { courseSlug } = useLocalSearchParams<{ courseSlug: string }>()
  const router = useRouter()
  const { membership } = useAuthStore()
  const tier = membership?.tier ?? 'free'

  const days = getNext14Days()
  const [selectedDate, setSelectedDate] = useState(days[0])
  const [players, setPlayers] = useState(1)
  const [holes, setHoles] = useState<9 | 18>(18)
  const [course, setCourse] = useState<Course | null>(null)
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [loading, setLoading] = useState(true)
  const [timesLoading, setTimesLoading] = useState(false)

  useEffect(() => {
    if (!courseSlug) return
    getCourseBySlug(courseSlug).then(setCourse).finally(() => setLoading(false))
  }, [courseSlug])

  useEffect(() => {
    if (!course) return
    setTimesLoading(true)
    getTeeTimesForDate(course.id, selectedDate)
      .then(setTeeTimes)
      .finally(() => setTimesLoading(false))
  }, [course, selectedDate])

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: Colors.primary }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#fff', marginBottom: 8 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>{course?.name}</Text>
      </View>

      {/* Date picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#fff', maxHeight: 80 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {days.map((day) => {
          const d = new Date(day + 'T12:00:00')
          const active = day === selectedDate
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDate(day)}
              style={{ marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: active ? Colors.primary : '#F3F4F6' }}
            >
              <Text style={{ fontSize: 12, color: active ? '#fff' : Colors.textSecondary }}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: active ? '#fff' : Colors.textPrimary }}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Players + holes */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 6 }}>Players</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPlayers(p)}
                style={{ width: 36, height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: players === p ? Colors.primary : '#F3F4F6' }}
              >
                <Text style={{ color: players === p ? '#fff' : Colors.textPrimary, fontWeight: '600' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 6 }}>Holes</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {([9, 18] as const).map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHoles(h)}
                style={{ paddingHorizontal: 14, height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: holes === h ? Colors.primary : '#F3F4F6' }}
              >
                <Text style={{ color: holes === h ? '#fff' : Colors.textPrimary, fontWeight: '600' }}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {timesLoading
          ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          : teeTimes.length === 0
            ? <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 40 }}>No available tee times</Text>
            : teeTimes.map((tt) => (
              <TeeTimeSlot
                key={tt.id}
                teeTime={tt}
                membershipTier={tier}
                onPress={() => router.push({ pathname: '/(member)/book/confirm', params: { teeTimeId: tt.id, courseId: course!.id, courseName: course!.name, scheduledAt: tt.scheduled_at, players: String(players), holes: String(holes), basePrice: String(tt.base_price) } })}
              />
            ))
        }
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 4: Write `app/(member)/book/confirm.tsx`**

```typescript
import { useState } from 'react'
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuthStore } from '../../../store/auth'
import { createBooking } from '../../../lib/queries/member'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Colors } from '../../../constants/theme'

export default function ConfirmBookingScreen() {
  const router = useRouter()
  const { profile, membership } = useAuthStore()
  const params = useLocalSearchParams<{
    teeTimeId: string; courseId: string; courseName: string
    scheduledAt: string; players: string; holes: string; basePrice: string
  }>()
  const [loading, setLoading] = useState(false)

  const tier = membership?.tier ?? 'free'
  const isFree = tier === 'eagle' || tier === 'ace'
  const fee = isFree ? 0 : parseFloat(params.basePrice ?? '0')
  const date = new Date(params.scheduledAt ?? '')

  async function handleConfirm() {
    if (!profile) return
    setLoading(true)
    try {
      await createBooking({
        teeTimeId: params.teeTimeId,
        userId: profile.id,
        players: parseInt(params.players ?? '1'),
        holes: parseInt(params.holes ?? '18'),
        totalPaid: fee,
      })
      Alert.alert('Booking Confirmed!', `You're booked at ${params.courseName}.`, [
        { text: 'View Bookings', onPress: () => router.replace('/(member)/bookings') },
      ])
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not complete booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 60, marginBottom: 20 }}>
        <Text style={{ color: Colors.primary }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 }}>Confirm Booking</Text>

      <Card style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 }}>{params.courseName}</Text>
        <Text style={{ color: Colors.textSecondary }}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>
          {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>
          {params.players} player{parseInt(params.players) !== 1 ? 's' : ''} · {params.holes} holes
        </Text>
        <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 16, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>Total</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: isFree ? Colors.success : Colors.textPrimary }}>
            {isFree ? 'FREE (included with membership)' : `$${fee.toFixed(2)}`}
          </Text>
        </View>
      </Card>

      <Button label="Confirm Booking" onPress={handleConfirm} loading={loading} />
    </ScrollView>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(member)/courses.tsx components/member/TeeTimeSlot.tsx app/(member)/book/
git commit -m "feat: course list, tee time picker, booking confirmation"
```

---

## Task 17: Staff Tab Navigator + Queries

**Files:**
- Create: `app/(staff)/_layout.tsx`
- Create: `lib/queries/staff.ts`

- [ ] **Step 1: Write `app/(staff)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/theme'

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tee Sheet', tabBarLabel: 'Tee Sheet' }} />
      <Tabs.Screen name="checkin" options={{ title: 'Check In', tabBarLabel: 'Check In' }} />
      <Tabs.Screen name="members" options={{ title: 'Members', tabBarLabel: 'Members' }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarLabel: 'Account' }} />
    </Tabs>
  )
}
```

- [ ] **Step 2: Write `lib/queries/staff.ts`**

```typescript
import { supabase } from '../supabase'

export async function getTodaysTeeSheet(courseId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('tee_times')
    .select(`
      *,
      bookings (
        *,
        profiles ( id, full_name )
      )
    `)
    .eq('course_id', courseId)
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)
    .order('scheduled_at')
  if (error) throw error
  return data ?? []
}

export async function checkInByProfileId(profileId: string, courseId: string) {
  // Find today's confirmed booking for this member at this course
  const today = new Date().toISOString().split('T')[0]
  const { data: teeTimesData } = await supabase
    .from('tee_times')
    .select('id')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)

  const teeTimeIds = (teeTimesData ?? []).map((t: any) => t.id)
  if (teeTimeIds.length === 0) return null

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`*, profiles ( full_name ), tee_times ( scheduled_at )`)
    .eq('user_id', profileId)
    .eq('status', 'confirmed')
    .in('tee_time_id', teeTimeIds)
    .maybeSingle()

  if (error) throw error
  return booking
}

export async function markCheckedIn(bookingId: string) {
  const { error } = await supabase
    .from('bookings')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', bookingId)
  if (error) throw error
}

export async function searchMembers(courseId: string, query: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      memberships ( tier, status ),
      bookings (
        *,
        tee_times!inner ( course_id, scheduled_at )
      )
    `)
    .or(`full_name.ilike.%${query}%`)
    .limit(20)
  if (error) throw error
  return data ?? []
}

export async function getProfileById(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`*, memberships ( tier, status )`)
    .eq('id', profileId)
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(staff)/_layout.tsx lib/queries/staff.ts
git commit -m "feat: staff tab layout and query helpers"
```

---

## Task 18: Staff Tee Sheet

**Files:**
- Create: `components/staff/TeeSheetRow.tsx`
- Create: `app/(staff)/index.tsx`

- [ ] **Step 1: Write `components/staff/TeeSheetRow.tsx`**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../constants/theme'

interface TeeSheetRowProps {
  teeTime: any
  onToggleCheckin: (bookingId: string, current: boolean) => void
}

export function TeeSheetRow({ teeTime, onToggleCheckin }: TeeSheetRowProps) {
  const time = new Date(teeTime.scheduled_at)
  const bookings: any[] = teeTime.bookings ?? []

  return (
    <View style={styles.container}>
      <Text style={styles.time}>
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </Text>
      {bookings.length === 0
        ? <Text style={styles.empty}>Open</Text>
        : bookings.map((b: any) => (
          <TouchableOpacity
            key={b.id}
            style={styles.booking}
            onPress={() => onToggleCheckin(b.id, b.checked_in)}
          >
            <View style={[styles.dot, { backgroundColor: b.checked_in ? Colors.success : '#D1D5DB' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{b.profiles?.full_name ?? 'Unknown'}</Text>
              <Text style={styles.detail}>{b.players} players · {b.holes ?? 18} holes</Text>
            </View>
          </TouchableOpacity>
        ))
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  time: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  empty: { fontSize: 14, color: Colors.textSecondary },
  booking: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  detail: { fontSize: 12, color: Colors.textSecondary },
})
```

- [ ] **Step 2: Write `app/(staff)/index.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../store/auth'
import { getTodaysTeeSheet, markCheckedIn } from '../../lib/queries/staff'
import { TeeSheetRow } from '../../components/staff/TeeSheetRow'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/theme'

export default function StaffTeeSheet() {
  const { courseAdmin } = useAuthStore()
  const courseId = courseAdmin?.course_id
  const [teeSheet, setTeeSheet] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!courseId) return
    const data = await getTodaysTeeSheet(courseId)
    setTeeSheet(data)
    setLoading(false)
  }

  useEffect(() => {
    load()

    if (!courseId) return
    const channel = supabase
      .channel('tee-sheet-today')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [courseId])

  async function handleToggleCheckin(bookingId: string, current: boolean) {
    if (current) {
      Alert.alert('Already Checked In', 'This guest has already checked in.')
      return
    }
    await markCheckedIn(bookingId)
    load()
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: Colors.primary }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>Today's Tee Sheet</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{today}</Text>
      </View>
      <ScrollView>
        {teeSheet.length === 0
          ? <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 40 }}>No tee times today</Text>
          : teeSheet.map((tt: any) => (
            <TeeSheetRow key={tt.id} teeTime={tt} onToggleCheckin={handleToggleCheckin} />
          ))
        }
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/staff/TeeSheetRow.tsx app/(staff)/index.tsx
git commit -m "feat: staff tee sheet with realtime updates"
```

---

## Task 19: QR Check-In Scanner

**Files:**
- Create: `components/staff/CheckInResult.tsx`
- Create: `app/(staff)/checkin.tsx`

- [ ] **Step 1: Write `components/staff/CheckInResult.tsx`**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, tierLabel, tierColor } from '../../constants/theme'
import { Badge } from '../ui/Badge'

interface CheckInResultProps {
  type: 'success' | 'already' | 'not_found' | 'error'
  memberName?: string
  tier?: string
  checkedInAt?: string
  message?: string
  onDismiss: () => void
}

export function CheckInResult({ type, memberName, tier, checkedInAt, message, onDismiss }: CheckInResultProps) {
  const isSuccess = type === 'success'
  const bgColor = isSuccess ? Colors.success : type === 'already' ? Colors.primary : Colors.error

  return (
    <View style={[styles.overlay, { backgroundColor: bgColor }]}>
      <Text style={styles.icon}>{isSuccess ? '✓' : type === 'already' ? '↩' : '✗'}</Text>
      {isSuccess && memberName && (
        <>
          <Text style={styles.name}>{memberName}</Text>
          {tier && <Badge label={tierLabel(tier)} color="rgba(255,255,255,0.25)" textColor="#fff" />}
          <Text style={styles.subtitle}>Checked in!</Text>
        </>
      )}
      {type === 'already' && (
        <>
          <Text style={styles.name}>{memberName}</Text>
          <Text style={styles.subtitle}>Already checked in{checkedInAt ? ` at ${new Date(checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}</Text>
        </>
      )}
      {(type === 'not_found' || type === 'error') && (
        <Text style={styles.name}>{message ?? 'No booking found for today'}</Text>
      )}
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissText}>Tap to scan again</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 32, zIndex: 10 },
  icon: { fontSize: 72, color: '#fff', marginBottom: 16 },
  name: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8 },
  dismissBtn: { marginTop: 40, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  dismissText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 2: Write `app/(staff)/checkin.tsx`**

```typescript
import { useState, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '../../store/auth'
import { checkInByProfileId, markCheckedIn, getProfileById } from '../../lib/queries/staff'
import { CheckInResult } from '../../components/staff/CheckInResult'
import { Button } from '../../components/ui/Button'
import { Colors } from '../../constants/theme'

type ResultState = {
  type: 'success' | 'already' | 'not_found' | 'error'
  memberName?: string
  tier?: string
  checkedInAt?: string
  message?: string
} | null

export default function CheckInScreen() {
  const { courseAdmin } = useAuthStore()
  const [permission, requestPermission] = useCameraPermissions()
  const [result, setResult] = useState<ResultState>(null)
  const scanning = useRef(false)

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanning.current || result) return
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data)) return

    scanning.current = true

    try {
      const [profile, booking] = await Promise.all([
        getProfileById(data),
        checkInByProfileId(data, courseAdmin!.course_id),
      ])

      if (!booking) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setResult({ type: 'not_found', memberName: profile?.full_name ?? undefined, message: `${profile?.full_name ?? 'Member'} — no booking found for today` })
        return
      }

      if (booking.checked_in) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        setResult({ type: 'already', memberName: profile?.full_name ?? undefined, checkedInAt: booking.checked_in_at })
        return
      }

      await markCheckedIn(booking.id)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const tier = (booking as any).memberships?.tier ?? 'free'
      setResult({ type: 'success', memberName: profile?.full_name ?? undefined, tier })
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setResult({ type: 'error', message: err.message ?? 'Something went wrong' })
    }
  }

  function handleDismiss() {
    setResult(null)
    scanning.current = false
  }

  if (!permission) return <View style={{ flex: 1 }} />

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ textAlign: 'center', color: Colors.textPrimary, marginBottom: 20 }}>
          Camera access is required to scan member QR codes.
        </Text>
        <Button label="Grant Camera Access" onPress={requestPermission} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={result ? undefined : handleBarCodeScanned}
      />

      {/* Viewfinder overlay */}
      <View style={styles.overlay}>
        <Text style={styles.header}>Scan Member Card</Text>
        <View style={styles.frame} />
        <Text style={styles.hint}>Point camera at member's QR code</Text>
      </View>

      {result && (
        <CheckInResult {...result} onDismiss={handleDismiss} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'space-around', alignItems: 'center', padding: 32 },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 60 },
  frame: { width: 240, height: 240, borderWidth: 3, borderColor: '#fff', borderRadius: 16 },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
})
```

Note: `expo-haptics` needs installing:

```bash
npx expo install expo-haptics
```

- [ ] **Step 3: Commit**

```bash
git add components/staff/CheckInResult.tsx app/(staff)/checkin.tsx
git commit -m "feat: QR check-in scanner with haptic feedback"
```

---

## Task 20: Staff Member Search + Account

**Files:**
- Create: `components/staff/MemberSearchResult.tsx`
- Create: `app/(staff)/members.tsx`
- Create: `app/(staff)/account.tsx`

- [ ] **Step 1: Write `components/staff/MemberSearchResult.tsx`**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, tierLabel, tierColor } from '../../constants/theme'
import { Badge } from '../ui/Badge'

interface MemberSearchResultProps {
  member: any
  onPress: () => void
}

export function MemberSearchResult({ member, onPress }: MemberSearchResultProps) {
  const tier = member.memberships?.[0]?.tier ?? 'free'
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{member.full_name ?? '—'}</Text>
      </View>
      <Badge label={tierLabel(tier)} color={tierColor(tier)} textColor="#fff" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  name: { fontSize: 15, color: Colors.textPrimary },
})
```

- [ ] **Step 2: Write `app/(staff)/members.tsx`**

```typescript
import { useState } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../store/auth'
import { searchMembers } from '../../lib/queries/staff'
import { MemberSearchResult } from '../../components/staff/MemberSearchResult'
import { Colors } from '../../constants/theme'

export default function MembersScreen() {
  const { courseAdmin } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(text: string) {
    setQuery(text)
    if (text.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const data = await searchMembers(courseAdmin?.course_id ?? '', text)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: Colors.primary }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 }}>Member Lookup</Text>
        <TextInput
          style={{ height: 44, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, fontSize: 15 }}
          placeholder="Search by name..."
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
        />
      </View>
      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemberSearchResult member={item} onPress={() => {}} />}
        ListEmptyComponent={
          query.length >= 2 && !loading
            ? <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 40 }}>No members found</Text>
            : null
        }
      />
    </View>
  )
}
```

- [ ] **Step 3: Write `app/(staff)/account.tsx`**

```typescript
import { View, Text, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { signOut } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Colors } from '../../constants/theme'

export default function StaffAccount() {
  const router = useRouter()
  const { profile, courseAdmin, user, membership, setActiveRole } = useAuthStore()

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login') } },
    ])
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 60, marginBottom: 20 }}>
        Staff Account
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.textPrimary }}>{profile?.full_name ?? '—'}</Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>{user?.email}</Text>
        {courseAdmin && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Badge label={courseAdmin.role} color={Colors.primary} textColor="#fff" />
          </View>
        )}
      </Card>

      {membership && (
        <Button
          label="Switch to Member View"
          onPress={() => { setActiveRole('member'); router.replace('/(member)') }}
          variant="secondary"
        />
      )}

      <View style={{ marginTop: 12 }}>
        <Button label="Sign Out" onPress={handleSignOut} variant="ghost" />
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/staff/MemberSearchResult.tsx app/(staff)/members.tsx app/(staff)/account.tsx
git commit -m "feat: staff member search and account screen"
```

---

## Task 21: Phase 5 — Push Notifications

**Files:**
- Create: `lib/notifications.ts`

- [ ] **Step 1: Write `lib/notifications.ts`**

```typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data

  // Store token in Supabase so server-side can send notifications
  await supabase
    .from('profiles')
    .update({ push_token: token } as any)
    .eq('id', userId)

  return token
}

export async function scheduleLocalTeeTimeReminder(scheduledAt: string, courseName: string, bookingId: string) {
  const teeTime = new Date(scheduledAt)
  const reminderTime = new Date(teeTime.getTime() - 60 * 60 * 1000) // 1 hour before

  if (reminderTime <= new Date()) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tee time in 1 hour',
      body: `Your tee time at ${courseName} is coming up!`,
      data: { bookingId },
    },
    trigger: { date: reminderTime },
  })
}
```

Note: `expo-device` needs installing:

```bash
npx expo install expo-device
```

Wire `registerForPushNotifications` into `app/_layout.tsx` after `loadUserData` succeeds:

```typescript
// In _layout.tsx, inside the session check:
if (session?.user) {
  setUser(session.user)
  loadUserData(session.user.id).then(() => {
    registerForPushNotifications(session.user.id)
  }).finally(() => setIsLoading(false))
}
```

Note: `push_token` column doesn't exist yet on `profiles`. Add to migration 070 or create 071:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token text;
```

- [ ] **Step 2: Commit**

```bash
git add lib/notifications.ts
git commit -m "feat: push notification registration and local tee time reminders"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Repo setup, all deps | Task 1 |
| Supabase client (SecureStore) | Task 2 |
| Zustand auth store | Task 3 |
| Auth helpers + role detection | Task 4 |
| Root layout + auth listener | Task 5 |
| Splash redirect | Task 6 |
| Login screen | Task 7 |
| Member tab navigator | Task 9 |
| Member dashboard | Task 11 |
| Digital member card (QR) | Task 12 |
| Bookings screen | Task 13 |
| Points screen | Task 14 |
| Member account | Task 15 |
| Course list | Task 16 |
| Tee time picker | Task 16 |
| Booking confirmation | Task 16 |
| Staff tab navigator | Task 17 |
| Today's tee sheet + Realtime | Task 18 |
| QR scanner check-in | Task 19 |
| Member lookup | Task 20 |
| Staff account | Task 20 |
| Push notifications | Task 21 |
| DB migration for checked_in/holes | Task 0 |
| Haptic feedback | Task 19 (check-in), partial |
| Eagle cancel 1hr / Fairway no cancel | Task 13 |
| Screen brightness on card tab | Task 12 |
| Role switcher (member+staff) | Tasks 4, 15, 20 |
| Realtime tee sheet | Task 18 |

### Schema note embedded

The spec calls the staff table `course_roles`. The actual table is `course_admins`. Every task in this plan uses `course_admins`.

### Type consistency

- `CourseAdmin.course_id` used in Tasks 17, 18, 19, 20 ✓
- `Booking.checked_in` / `checked_in_at` defined in Task 2, used in Tasks 0, 19 ✓
- `Booking.holes` defined in Task 2, used in Tasks 0, 13, 16 ✓
- `getProfileById` returns profile with `memberships` join — used in checkin.tsx for tier display ✓

### Placeholders

None found.
