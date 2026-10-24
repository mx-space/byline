import zeroperlWasmUrl from '@6over3/zeroperl-ts/zeroperl.wasm?url'
import { createStaticStyles, toast } from '@lobehub/ui'
import { gps } from 'exifr'
import { ExternalLink, MapPin, ShieldCheck } from 'lucide-react'

import { translate } from '~/i18n/translate'
import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ued384759: css`
    display: flex;
    width: 100%;
    flex-direction: column;
  `,
  uc7317dd6: css`
    display: grid;
    gap: 1rem;
    padding-inline: 1.25rem;
    padding-block: 1rem;
  `,
  uf59d50f5: css`
    display: grid;
    gap: 0.375rem;
  `,
  uf1d3f85e: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    line-height: 1.5rem;
    color: ${cssVar.colorText};
  `,
  ud10f4996: css`
    word-break: break-all;
    border-radius: 10px;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u534ec33a: css`
    display: grid;
    gap: 0.5rem;
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
  `,
  u34d63445: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  `,
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  u15bc8269: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  uc539837b: css`
    margin-top: 0.25rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
  u510f41ee: css`
    display: inline-flex;
    height: 2rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding-inline: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorText};
    box-shadow: ${cssVar.boxShadowTertiary};
    outline: none;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  u734f95fa: css`
    border-radius: 10px;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u3830042a: css`
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
}))

type GpsPrivacyDecision = 'keep' | 'strip'

interface ImageGpsLocation {
  latitude: number
  longitude: number
}

interface ImageGpsPrivacyDialogProps {
  fileName: string
  location: ImageGpsLocation
}

function ImageGpsPrivacyDialog(props: ImageGpsPrivacyDialogProps) {
  const modal = useModal<GpsPrivacyDecision>()
  const coordinates = formatGpsCoordinates(props.location)
  const mapUrl = getMapUrl(props.location)

  return (
    <div className={lobeStyles.ued384759}>
      <ModalHeader
        icon={MapPin}
        title={translate('imageUploadPrivacy.dialog.title')}
      />

      <div className={lobeStyles.uc7317dd6}>
        <div className={lobeStyles.uf59d50f5}>
          <p className={lobeStyles.uf1d3f85e}>
            {translate('imageUploadPrivacy.dialog.description')}
          </p>
          <p className={lobeStyles.ud10f4996}>{props.fileName}</p>
        </div>

        <div className={lobeStyles.u534ec33a}>
          <div className={lobeStyles.u34d63445}>
            <div className={lobeStyles.u7e0b7cdf}>
              <div className={lobeStyles.u15bc8269}>
                {translate('imageUploadPrivacy.dialog.coordinatesTitle')}
              </div>
              <div className={lobeStyles.uc539837b}>{coordinates}</div>
            </div>
            <a
              className={lobeStyles.u510f41ee}
              href={mapUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink
                aria-hidden="true"
                className={lobeStyles.u783b0d9d}
              />
              {translate('imageUploadPrivacy.dialog.openMap')}
            </a>
          </div>
        </div>

        <div className={lobeStyles.u734f95fa}>
          <div className={lobeStyles.u3830042a}>
            <ShieldCheck aria-hidden="true" className={lobeStyles.u783b0d9d} />
            {translate('imageUploadPrivacy.dialog.safetyTitle')}
          </div>
          {translate('imageUploadPrivacy.dialog.safetyDescription')}
        </div>
      </div>

      <ModalFooter>
        <Button onClick={() => modal.dismiss()} type="button" variant="subtle">
          {translate('common.cancel')}
        </Button>
        <Button
          onClick={() => modal.close('keep')}
          type="button"
          variant="secondary"
        >
          {translate('imageUploadPrivacy.dialog.keepGps')}
        </Button>
        <Button onClick={() => modal.close('strip')} type="button">
          {translate('imageUploadPrivacy.dialog.stripGps')}
        </Button>
      </ModalFooter>
    </div>
  )
}

async function presentImageGpsPrivacyDialog(
  file: File,
  location: ImageGpsLocation,
): Promise<GpsPrivacyDecision | undefined> {
  return await present<ImageGpsPrivacyDialogProps, GpsPrivacyDecision>(
    ImageGpsPrivacyDialog,
    { fileName: file.name, location },
    {
      modalProps: { popupStyle: { width: 'min(92vw, 30rem)' } },
    },
  )
}

async function readGpsLocation(file: File): Promise<ImageGpsLocation | null> {
  try {
    const location = await gps(file)
    if (
      Number.isFinite(location?.latitude) &&
      Number.isFinite(location?.longitude)
    ) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      }
    }
  } catch {
    // Invalid or partially corrupt metadata should not block normal uploads.
  }
  return null
}

async function stripGpsMetadata(file: File): Promise<File> {
  const { writeMetadata } = await import('@uswriting/exiftool')
  const result = await writeMetadata(
    file,
    {
      'GPS:all': '',
      'XMP:Geotag': '',
    },
    {
      fetch: () => fetch(zeroperlWasmUrl),
    },
  )

  if (!result.success) {
    throw new Error(result.error)
  }

  return new File([result.data], file.name, {
    lastModified: file.lastModified,
    type: file.type,
  })
}

export const imageGpsPrivacy = {
  detectGps: readGpsLocation,
  stripGps: stripGpsMetadata,
}

export async function prepareImageFileForUpload(
  file: File,
): Promise<File | null> {
  if (!file.type.startsWith('image/')) return file

  const location = await readGpsLocation(file)
  if (!location) return file

  const decision = await presentImageGpsPrivacyDialog(file, location)
  if (!decision) return null
  if (decision === 'keep') return file

  try {
    return await stripGpsMetadata(file)
  } catch (error) {
    console.warn('Failed to strip GPS metadata before upload', error)
    toast.error(translate('imageUploadPrivacy.toast.stripFailed'))
    return null
  }
}

function formatGpsCoordinates(location: ImageGpsLocation) {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
}

function getMapUrl(location: ImageGpsLocation) {
  const lat = location.latitude.toFixed(6)
  const lon = location.longitude.toFixed(6)
  const params = new URLSearchParams({
    mlat: lat,
    mlon: lon,
  })
  return `https://www.openstreetmap.org/?${params.toString()}#map=16/${lat}/${lon}`
}
