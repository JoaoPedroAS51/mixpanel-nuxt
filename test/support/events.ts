import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface CapturedEvent {
  event?: string
  properties?: Record<string, unknown>
}

export function decodeEvents(url: string, body: string): CapturedEvent[] {
  const data = new URL(url).searchParams.get('data') || new URLSearchParams(body).get('data') || body

  if (!data) {
    return []
  }

  let parsed: CapturedEvent | CapturedEvent[]

  try {
    parsed = JSON.parse(data)
  }
  catch {
    parsed = JSON.parse(Buffer.from(data, 'base64').toString())
  }

  return Array.isArray(parsed) ? parsed : [parsed]
}

export async function createCollector() {
  const events: CapturedEvent[] = []
  const server = createServer(async (request, response) => {
    let body = ''

    for await (const chunk of request) {
      body += chunk
    }

    const received = decodeEvents(`http://localhost${request.url}`, body)
    events.push(...received)
    response.end(received.some(event => event.properties?.fail) ? '0' : '1')
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  return {
    events,
    port: (server.address() as AddressInfo).port,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    }),
  }
}
