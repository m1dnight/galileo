import type { Album, Song } from 'lib-galileo'

interface AppState {
  currentAlbum: {
    album: Album
    songs: Song[]
  } | null
  likedBeetsIds: number[]
  dislikedBeetsIds: number[]
}

export const appState: AppState = {
  currentAlbum: null,
  likedBeetsIds: [],
  dislikedBeetsIds: []
}

export function rateAlbum(beetsId: number, liked: boolean): void {
  const selected = liked ? appState.likedBeetsIds : appState.dislikedBeetsIds
  const opposite = liked ? appState.dislikedBeetsIds : appState.likedBeetsIds

  if (!selected.includes(beetsId)) selected.push(beetsId)
  const oppositeIndex = opposite.indexOf(beetsId)
  if (oppositeIndex !== -1) opposite.splice(oppositeIndex, 1)
}
