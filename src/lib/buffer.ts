const BUFFER_API_URL = 'https://api.buffer.com/graphql'

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
  channelIds: string[]
  dueAt?: string
  mode: 'addToQueue' | 'customScheduled'
  mediaUrls?: string[]
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
  if (!res.ok) {
    throw new Error(`Buffer API error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }
  return json.data as T
}

export async function getChannels(orgId: string): Promise<BufferChannel[]> {
  const data = await gqlRequest<{ channels: BufferChannel[] }>(
    `{ channels(input: { organizationId: "${orgId}" }) { id name service avatar } }`,
    {}
  )
  return data.channels ?? []
}

export async function getScheduledPosts(orgId: string): Promise<BufferPost[]> {
  const data = await gqlRequest<{ posts: BufferPost[] }>(
    `{ posts(first: 50, input: { organizationId: "${orgId}", filter: { status: [scheduled] } }) { id text channelId dueAt status assets { url } } }`,
    {}
  )
  return data.posts ?? []
}

export async function getSentPosts(
  orgId: string,
  limit = 10
): Promise<BufferPost[]> {
  const data = await gqlRequest<{ posts: BufferPost[] }>(
    `{ posts(first: ${limit}, input: { organizationId: "${orgId}", filter: { status: [sent] } }) { id text channelId dueAt status assets { url } } }`,
    {}
  )
  return data.posts ?? []
}

export async function createPost(
  input: CreatePostInput
): Promise<{ id: string; dueAt: string }[]> {
  const results: { id: string; dueAt: string }[] = []
  for (const channelId of input.channelIds) {
    const data = await gqlRequest<{
      createPost: {
        __typename: string
        post?: { id: string; dueAt: string }
        error?: { message: string }
      }
    }>(
      `mutation CreatePost(
        $channelId: String!
        $text: String!
        $dueAt: String
        $mode: String!
      ) {
        createPost(input: {
          channelId: $channelId
          text: $text
          dueAt: $dueAt
          mode: $mode
        }) {
          ... on PostActionSuccess {
            post { id dueAt }
          }
          ... on MutationError {
            error { message }
          }
        }
      }`,
      { channelId, text: input.text, dueAt: input.dueAt ?? null, mode: input.mode }
    )
    if (data.createPost.__typename === 'MutationError') {
      throw new Error(data.createPost.error?.message ?? 'Buffer mutation failed')
    }
    if (data.createPost.post) {
      results.push(data.createPost.post)
    }
  }
  return results
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
