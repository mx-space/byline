import type { OnModuleInit } from '@nestjs/common'
import { Injectable, Logger } from '@nestjs/common'
import type { Sharp } from 'sharp'
import { rgbaToThumbHash } from 'thumbhash'

import { ConfigsService } from '~/modules/configs/configs.service'
import { assertPublicHttpUrl } from '~/utils/ssrf.util'
import { requireDepsWithInstall } from '~/utils/tool.util'

import { HttpService } from './helper.http.service'

@Injectable()
export class ImageService implements OnModuleInit {
  private logger: Logger
  constructor(
    private readonly httpService: HttpService,
    private readonly configsService: ConfigsService,
  ) {
    this.logger = new Logger(ImageService.name)
  }

  onModuleInit() {
    requireDepsWithInstall('sharp').catch((error: any) => {
      this.logger.error(`sharp install failed: ${error.message}`)
      console.error(error)
    })
  }

  getOnlineImageSizeAndMeta = async (image: string) => {
    const {
      url: { webUrl },
    } = await this.configsService.waitForConfigReady()
    // Image URLs are author-supplied; guard the outbound fetch and
    // disable redirect following so a public host cannot 30x us into one.
    await assertPublicHttpUrl(image, { allowHttp: true })
    const response = await this.httpService.fetch.raw<
      ArrayBuffer,
      'arrayBuffer'
    >(image, {
      responseType: 'arrayBuffer',
      timeout: 10_000,
      redirect: 'error',
      retry: 0,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        referer: webUrl,
      },
    })

    const imageType = response.headers.get('content-type') ?? ''

    const buffer = Buffer.from(response._data as ArrayBuffer)
    const sharp = await requireDepsWithInstall('sharp')
    const sharped = sharp(buffer) as Sharp
    const metadata = await sharped.metadata()
    const size = {
      height: metadata.height,
      width: metadata.width,
      type: imageType,
    }
    const { dominant } = await sharped.stats()

    // get accent color
    // r g b number to hex
    const accent = `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`

    const thumbhash = await encodeImageToThumbhash(sharped)

    return { size, accent, thumbhash }
  }
}

const encodeImageToThumbhash = (sharped: Sharp) =>
  new Promise<string>((resolve, reject) => {
    sharped
      .raw()
      .ensureAlpha()
      .resize(100, 100, { fit: 'inside' })
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err)
        const u8 = rgbaToThumbHash(width, height, buffer)
        resolve(Buffer.from(u8).toString('base64'))
      })
  })
