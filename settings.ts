import { app } from 'electron'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse, stringify } from 'yaml'

export interface Settings {
  beetsLibrary: string
  musicLibrary: string
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.yaml')
}

async function exists(file: string) {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

export async function loadSettings() {
  const directory = app.getPath('userData')
  const file = settingsPath()
  const sidecarPath = path.join(directory, 'sidecar.db')
  const defaults: Settings = {
    beetsLibrary: '',
    musicLibrary: ''
  }

  await mkdir(directory, { recursive: true })

  if (!await exists(file)) {
    await writeFile(file, stringify(defaults))
  }

  const saved = parse(await readFile(file, 'utf8')) as Partial<Settings>
  return {
    settings: {
      beetsLibrary: saved.beetsLibrary ?? defaults.beetsLibrary,
      musicLibrary: saved.musicLibrary ?? defaults.musicLibrary
    },
    sidecarPath
  }
}

export async function saveSettings(settings: Settings) {
  await writeFile(settingsPath(), stringify(settings))
}
