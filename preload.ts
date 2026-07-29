import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('galileo', {
  getSettings: (): Promise<SettingsView> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: SettingsView): Promise<void> =>
    ipcRenderer.invoke('save-settings', settings),
  randomAlbum: (): Promise<AlbumView> => ipcRenderer.invoke('random-album'),
  rateAlbum: (beetsId: number, liked: boolean): Promise<void> =>
    ipcRenderer.invoke('rate-album', beetsId, liked),
  loveAlbum: (beetsId: number): Promise<void> =>
    ipcRenderer.invoke('love-album', beetsId),
  unloveAlbum: (beetsId: number): Promise<void> =>
    ipcRenderer.invoke('unlove-album', beetsId),
  recordPlay: (beetsId: number): Promise<void> =>
    ipcRenderer.invoke('record-play', beetsId),
  lovedAlbums: (): Promise<LovedAlbumView[]> =>
    ipcRenderer.invoke('loved-albums'),
  playedAlbums: (): Promise<PlayedAlbumView[]> =>
    ipcRenderer.invoke('played-albums'),
  taste: (): Promise<TasteView> => ipcRenderer.invoke('taste'),
  resetTaste: (): Promise<void> => ipcRenderer.invoke('reset-taste'),
  searchAlbums: (
    query: string
  ): Promise<{ beetsId: number; artist: string; title: string }[]> =>
    ipcRenderer.invoke('search-albums', query),
  selectAlbum: (beetsId: number): Promise<AlbumView> =>
    ipcRenderer.invoke('select-album', beetsId)
})
