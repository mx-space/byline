import { type ClientOptions, HttpCore } from './http'
import {
  CategoriesResource,
  DynamicComponentsResource,
  FilesResource,
  TranslationsResource,
} from './resources/content'
import { DraftsResource } from './resources/drafts'
import { PostsResource } from './resources/posts'
import { PublishJobsResource, TasksResource } from './resources/tasks'
import { InvitesResource, UsersResource } from './resources/users'

export class BylineClient {
  readonly http: HttpCore
  readonly posts: PostsResource
  readonly drafts: DraftsResource
  readonly publishJobs: PublishJobsResource
  readonly tasks: TasksResource
  readonly categories: CategoriesResource
  readonly translations: TranslationsResource
  readonly users: UsersResource
  readonly invites: InvitesResource
  readonly dynamicComponents: DynamicComponentsResource
  readonly files: FilesResource

  constructor(options: ClientOptions) {
    this.http = new HttpCore(options)
    this.drafts = new DraftsResource(this.http)
    this.tasks = new TasksResource(this.http)
    this.publishJobs = new PublishJobsResource(this.http, this.tasks)
    this.posts = new PostsResource(this.http, this.drafts, this.publishJobs)
    this.categories = new CategoriesResource(this.http)
    this.translations = new TranslationsResource(this.http)
    this.users = new UsersResource(this.http)
    this.invites = new InvitesResource(this.http)
    this.dynamicComponents = new DynamicComponentsResource(this.http)
    this.files = new FilesResource(this.http)
  }
}

export const createClient = (options: ClientOptions) =>
  new BylineClient(options)
