import { unstable_cache } from 'next/cache'

const BUFFER_API_URL = 'https://api.buffer.com/graphql'
export const BUFFER_CACHE_TAG = 'buffer-social'

export type BufferChannel = {
  id: string
  name: string
  service: 'instagram' | 'facebook' | 'linkedin' | 'twitter'
  avatar: string
}

export type BufferPost = {
  id: string
  text: string
  channelId: string
  dueAt: string
  status: 'scheduled' | 'sent' | 'error'
  assets: { url: string }[]
}

export type CreatePostInput = {
  text: string
  channels: { id: string; service: BufferChannel['service'] }[]
  dueAt?: string
  mode: 'addToQueue' | 'customScheduled'
  mediaUrls?: string[]
}

function metadataForService(service: BufferChannel['service']): string {
  switch (service) {
    case 'facebook':
      return 'metadata: { facebook: { type: post } }'
    case 'instagram':
      return 'metadata: { instagram: { type: post, shouldShareToFeed: true } }'
    default:
      return ''
  }
}

export type BufferRateLimit = {
  dailyRemaining: number
  dailyLimit: number
  dailyResetSeconds: number
  windowRemaining: number
  windowLimit: number
}

let lastRateLimit: BufferRateLimit | null = null

function parseRateLimit(headers: Headers): BufferRateLimit | null {
  // Headers come as multiple "ratelimit" values like '"100-in-15min"; r=99; t=900'
  const all = headers.get('ratelimit')
  if (!all) return null
  // fetch combines duplicate headers with comma. Split by comma at top level.
  const entries = all.split(/,(?=\s*"\d+-in)/).map(s => s.trim())
  let dailyR = 0, dailyL = 0, dailyT = 0, winR = 0, winL = 0
  for (const e of entries) {
    const m = e.match(/"(\d+)-in-(15min|1day|30days)";\s*r=(\d+);\s*t=(\d+)/)
    if (!m) continue
    const limit = Number(m[1]); const window = m[2]; const r = Number(m[3]); const t = Number(m[4])
    if (window === '1day') { dailyL = limit; dailyR = r; dailyT = t }
    else if (window === '15min') { winL = limit; winR = r }
  }
  if (!dailyL && !winL) return null
  return { dailyRemaining: dailyR, dailyLimit: dailyL, dailyResetSeconds: dailyT, windowRemaining: winR, windowLimit: winL }
}

export function getLastBufferRateLimit(): BufferRateLimit | null {
  return lastRateLimit
}

function getApiKey(): string {
  const key = process.env.BUFFER_API_KEY
  if (!key) {
    throw new Error(
      'BUFFER_API_KEY not configured. Add it to your environment variables.'
    )
  }
  return key
}

async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const key = getApiKey()
  const res = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const parsed = parseRateLimit(res.headers)
  if (parsed) lastRateLimit = parsed
  if (!res.ok) {
    throw new Error(`Buffer API error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }
  return json.data as T
}

async function fetchChannels(orgId: string): Promise<BufferChannel[]> {
  const data = await gqlRequest<{ channels: BufferChannel[] }>(
    `{ channels(input: { organizationId: "${orgId}" }) { id name service avatar } }`,
    {}
  )
  return data.channels ?? []
}

export const getChannels = unstable_cache(
  async (orgId: string) => fetchChannels(orgId),
  ['buffer-channels'],
  { tags: [BUFFER_CACHE_TAG], revalidate: 3600 }
)

type RawPostNode = {
  id: string
  text: string
  channelId: string
  dueAt: string
  status: BufferPost['status']
  assets?: { __typename: string; thumbnail?: string; source?: string }[]
}

const POST_FIELDS = `id text channelId dueAt status assets {
  __typename
  ... on ImageAsset { thumbnail source }
  ... on VideoAsset { thumbnail }
}`

function mapPost(node: RawPostNode): BufferPost {
  return {
    id: node.id,
    text: node.text,
    channelId: node.channelId,
    dueAt: node.dueAt,
    status: node.status,
    assets: (node.assets ?? [])
      .map(a => ({ url: a.thumbnail || a.source || '' }))
      .filter(a => a.url),
  }
}

async function fetchScheduledPosts(orgId: string): Promise<BufferPost[]> {
  const data = await gqlRequest<{ posts: { edges: { node: RawPostNode }[] } }>(
    `{ posts(first: 50, input: { organizationId: "${orgId}", filter: { status: [scheduled] } }) { edges { node { ${POST_FIELDS} } } } }`,
    {}
  )
  return data.posts?.edges?.map(e => mapPost(e.node)) ?? []
}

export const getScheduledPosts = unstable_cache(
  async (orgId: string) => fetchScheduledPosts(orgId),
  ['buffer-scheduled-posts'],
  { tags: [BUFFER_CACHE_TAG], revalidate: 600 }
)

async function fetchSentPosts(orgId: string, limit: number): Promise<BufferPost[]> {
  const data = await gqlRequest<{ posts: { edges: { node: RawPostNode }[] } }>(
    `{ posts(first: ${limit}, input: { organizationId: "${orgId}", filter: { status: [sent] } }) { edges { node { ${POST_FIELDS} } } } }`,
    {}
  )
  return data.posts?.edges?.map(e => mapPost(e.node)) ?? []
}

export const getSentPosts = unstable_cache(
  async (orgId: string, limit = 10) => fetchSentPosts(orgId, limit),
  ['buffer-sent-posts'],
  { tags: [BUFFER_CACHE_TAG], revalidate: 600 }
)

export async function createPost(
  input: CreatePostInput
): Promise<{ id: string; dueAt: string }[]> {
  const results: { id: string; dueAt: string }[] = []
  for (const channel of input.channels) {
    if (channel.service === 'instagram' && !input.mediaUrls?.length) {
      throw new Error('Instagram posts require an image — attach one and try again')
    }
    const dueAtField = input.dueAt ? `, dueAt: "${input.dueAt}"` : ''
    const metadataField = metadataForService(channel.service)
    const assetsField = input.mediaUrls?.length
      ? `, assets: { images: [${input.mediaUrls.map(u => `{ url: ${JSON.stringify(u)} }`).join(', ')}] }`
      : ''
    const data = await gqlRequest<{
      createPost: { post?: { id: string; dueAt: string }; message?: string }
    }>(
      `mutation {
        createPost(input: {
          channelId: "${channel.id}"
          text: ${JSON.stringify(input.text)}
          mode: ${input.mode}
          schedulingType: automatic
          ${dueAtField}
          ${metadataField ? ',' + metadataField : ''}
          ${assetsField}
        }) {
          ... on PostActionSuccess { post { id dueAt } }
          ... on MutationError { message }
        }
      }`,
      {}
    )
    if (data.createPost.message) {
      throw new Error(`${channel.service}: ${data.createPost.message}`)
    }
    if (data.createPost.post) {
      results.push(data.createPost.post)
    }
  }
  return results
}

export async function editPost(input: {
  postId: string
  text: string
  service: BufferChannel['service']
  dueAt?: string
  mode: 'addToQueue' | 'customScheduled'
  mediaUrls?: string[]
}): Promise<void> {
  const dueAtField = input.dueAt ? `, dueAt: "${input.dueAt}"` : ''
  const metadataField = metadataForService(input.service)
  const assetsField = input.mediaUrls?.length
    ? `, assets: { images: [${input.mediaUrls.map(u => `{ url: ${JSON.stringify(u)} }`).join(', ')}] }`
    : ''
  const data = await gqlRequest<{
    editPost: { post?: { id: string; dueAt: string }; message?: string }
  }>(
    `mutation {
      editPost(input: {
        id: "${input.postId}"
        text: ${JSON.stringify(input.text)}
        mode: ${input.mode}
        schedulingType: automatic
        ${dueAtField}
        ${metadataField ? ',' + metadataField : ''}
        ${assetsField}
      }) {
        ... on PostActionSuccess { post { id dueAt } }
        ... on MutationError { message }
      }
    }`,
    {}
  )
  if (data.editPost.message) {
    throw new Error(data.editPost.message)
  }
}

export async function deletePost(postId: string): Promise<void> {
  const data = await gqlRequest<{
    deletePost: { id?: string; message?: string }
  }>(
    `mutation { deletePost(input: { id: "${postId}" }) {
      ... on DeletePostSuccess { id }
      ... on VoidMutationError { message }
    } }`,
    {}
  )
  if (data.deletePost.message) {
    throw new Error(data.deletePost.message)
  }
}

export async function createIdea(
  orgId: string,
  title: string,
  text: string
): Promise<{ id: string }> {
  const data = await gqlRequest<{ createIdea: { id?: string; message?: string } }>(
    `mutation CreateIdea($input: CreateIdeaInput!) {
      createIdea(input: $input) {
        ... on Idea { id }
        ... on InvalidInputError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
      }
    }`,
    { input: { organizationId: orgId, content: { title, text } } }
  )
  if (data.createIdea.message) throw new Error(data.createIdea.message)
  return { id: data.createIdea.id! }
}
