import { publicUrl } from '@/utils/publicUrl'

export function brandLogo(surface = 'dark') {
  return publicUrl(surface === 'light' ? 'logo-dark.png' : 'logo.png')
}
