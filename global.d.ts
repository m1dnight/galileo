interface AlbumView {
  beetsId: number
  artist: string
  title: string
  genre: string | null
  artUrl: string | null
  momentum: string | null
  songs: { title: string; url: string }[]
}

interface TasteView {
  likedCount: number
  dislikedCount: number
  candidates: string[]
}

interface LovedAlbumView {
  beetsId: number
  artist: string
  title: string
  artUrl: string | null
}

interface PlayedAlbumView extends LovedAlbumView {
  playedAt: number
}

interface SettingsView {
  beetsLibrary: string
  musicLibrary: string
}

interface Window {
  galileo: {
    getSettings: () => Promise<SettingsView>
    saveSettings: (settings: SettingsView) => Promise<void>
    randomAlbum: () => Promise<AlbumView>
    rateAlbum: (beetsId: number, liked: boolean) => Promise<void>
    loveAlbum: (beetsId: number) => Promise<void>
    unloveAlbum: (beetsId: number) => Promise<void>
    recordPlay: (beetsId: number) => Promise<void>
    lovedAlbums: () => Promise<LovedAlbumView[]>
    playedAlbums: () => Promise<PlayedAlbumView[]>
    taste: () => Promise<TasteView>
    resetTaste: () => Promise<void>
    searchAlbums: (
      query: string
    ) => Promise<{ beetsId: number; artist: string; title: string }[]>
    selectAlbum: (beetsId: number) => Promise<AlbumView>
  }
}
