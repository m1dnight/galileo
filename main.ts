import { app, BrowserWindow, ipcMain } from 'electron'
import {
  listLovedAlbums,
  love,
  migrate,
  openDatabase,
  recordPlay,
  unlove
} from 'lib-galileo'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  appState,
  markAlbumPlayed,
  markAlbumSkipped,
  rateAlbum
} from './app-state'
import { loadSettings, saveSettings } from './settings'
import {
  getAlbum,
  getPlayedAlbums,
  getRandomAlbum,
  getRecommendationCandidates,
  getRecommendedAlbum,
  getTopGenre,
  searchAlbums
} from './music-library'

async function currentAlbumView(
  database: ReturnType<typeof openDatabase>,
  musicRoot: string
) {
  if (!appState.currentAlbum) throw new Error('No album is selected')

  return {
    beetsId: appState.currentAlbum.album.beetsId,
    artist: appState.currentAlbum.album.artist,
    title: appState.currentAlbum.album.title,
    genre: appState.currentAlbum.album.genre,
    artUrl: appState.currentAlbum.album.artPath
      ? pathToFileURL(path.join(musicRoot, appState.currentAlbum.album.artPath)).href
      : null,
    momentum: await getTopGenre(database, appState.likedBeetsIds),
    songs: appState.currentAlbum.songs.map(song => ({
      title: song.title,
      url: pathToFileURL(path.join(musicRoot, song.path)).href
    }))
  }
}

void app.whenReady().then(async () => {
  const { settings, sidecarPath } = await loadSettings()
  const database = openDatabase(sidecarPath)
  await migrate(database)
  const icon = path.join(__dirname, '..', 'images', 'app-icon-padded.png')

  if (process.platform === 'darwin') app.dock?.setIcon(icon)

  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.handle('get-settings', () => settings)
  ipcMain.handle(
    'save-settings',
    async (_event, updated: { beetsLibrary: string; musicLibrary: string }) => {
      settings.beetsLibrary = updated.beetsLibrary
      settings.musicLibrary = updated.musicLibrary
      await saveSettings(settings)
    }
  )
  ipcMain.handle('random-album', async () => {
    appState.currentAlbum = appState.likedBeetsIds.length === 0
      ? await getRandomAlbum(database)
      : await getRecommendedAlbum(
          database,
          appState.likedBeetsIds,
          appState.dislikedBeetsIds,
          appState.playedBeetsIds,
          appState.skippedBeetsIds
        )

    return currentAlbumView(database, settings.musicLibrary)
  })
  ipcMain.handle(
    'rate-album',
    (_event, beetsId: number, liked: boolean) => rateAlbum(beetsId, liked)
  )
  ipcMain.handle('love-album', (_event, beetsId: number) =>
    love(database, beetsId)
  )
  ipcMain.handle('unlove-album', (_event, beetsId: number) =>
    unlove(database, beetsId)
  )
  ipcMain.handle('record-play', async (_event, beetsId: number) => {
    await recordPlay(database, beetsId)
    markAlbumPlayed(beetsId)
  })
  ipcMain.handle('skip-album', (_event, beetsId: number) =>
    markAlbumSkipped(beetsId)
  )
  ipcMain.handle('loved-albums', async () => {
    const albums = await listLovedAlbums(database)
    return albums.map(album => ({
      beetsId: album.beetsId,
      artist: album.artist,
      title: album.title,
      artUrl: album.artPath
        ? pathToFileURL(path.join(settings.musicLibrary, album.artPath)).href
        : null
    }))
  })
  ipcMain.handle('played-albums', async () => {
    const albums = await getPlayedAlbums(database)
    return albums.map(album => ({
      beetsId: album.beetsId,
      artist: album.artist,
      title: album.title,
      playedAt: album.playedAt,
      artUrl: album.artPath
        ? pathToFileURL(path.join(settings.musicLibrary, album.artPath)).href
        : null
    }))
  })
  ipcMain.handle('taste', async () => {
    const candidates = appState.likedBeetsIds.length === 0
      ? []
      : await getRecommendationCandidates(
          database,
          appState.likedBeetsIds,
          appState.dislikedBeetsIds,
          appState.playedBeetsIds,
          appState.skippedBeetsIds,
          20
        )

    return {
      likedCount: appState.likedBeetsIds.length,
      dislikedCount: appState.dislikedBeetsIds.length,
      candidates: candidates.map(
        ({ album, similarity }) => `${album.artist} — ${album.title} (${similarity})`
      )
    }
  })
  ipcMain.handle('reset-taste', () => {
    appState.likedBeetsIds.length = 0
    appState.dislikedBeetsIds.length = 0
  })
  ipcMain.handle('search-albums', (_event, query: string) =>
    searchAlbums(database, query)
  )
  ipcMain.handle('select-album', async (_event, beetsId: number) => {
    appState.currentAlbum = await getAlbum(database, beetsId)
    return currentAlbumView(database, settings.musicLibrary)
  })

  const window = new BrowserWindow({
    width: 1000,
    height: 800,
    icon,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })
  void window.loadFile(path.join(__dirname, '..', 'index.html'))
})
