import type { HttpCore } from '../http'

export interface UrlOptions {
  adminUrl: string
  postPermalink?: string
  serverUrl: string
  webUrl: string
  wsUrl: string
}

export class OptionsResource {
  constructor(private readonly http: HttpCore) {}

  url() {
    return this.http.request<UrlOptions>('GET', '/options/url')
  }
}
