import type { Album, Song } from 'lib-galileo'

interface AppState {
  currentAlbum: {
    album: Album
    songs: Song[]
  } | null
  likedBeetsIds: number[]
  dislikedBeetsIds: number[]
  playedBeetsIds: number[]
  skippedBeetsIds: number[]
}

export const appState: AppState = {
  currentAlbum: null,
  likedBeetsIds: [],
  dislikedBeetsIds: [],
  playedBeetsIds: [],
  skippedBeetsIds: []
}

export function rateAlbum(beetsId: number, liked: boolean): void {
  const selected = liked ? appState.likedBeetsIds : appState.dislikedBeetsIds
  const opposite = liked ? appState.dislikedBeetsIds : appState.likedBeetsIds

  if (!selected.includes(beetsId)) selected.push(beetsId)
  const oppositeIndex = opposite.indexOf(beetsId)
  if (oppositeIndex !== -1) opposite.splice(oppositeIndex, 1)
}

export function markAlbumPlayed(beetsId: number): void {
  if (!appState.playedBeetsIds.includes(beetsId)) {
    appState.playedBeetsIds.push(beetsId)
  }

  const skippedIndex = appState.skippedBeetsIds.indexOf(beetsId)
  if (skippedIndex !== -1) appState.skippedBeetsIds.splice(skippedIndex, 1)
}

export function markAlbumSkipped(beetsId: number): void {
  if (
    !appState.playedBeetsIds.includes(beetsId) &&
    !appState.skippedBeetsIds.includes(beetsId)
  ) {
    appState.skippedBeetsIds.push(beetsId)
  }
}
