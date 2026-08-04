import {
  artistNovelty,
  artistRarity,
  composePickers,
  genreNovelty,
  listAlbumsByBeetsIds,
  listSongsForAlbum,
  nearestDislikeScorer,
  recommendAlbums,
  searchAlbums as searchGalileoAlbums,
  type SidecarDatabase
} from 'lib-galileo'

export async function getRandomAlbum(database: SidecarDatabase) {
  const randomAlbum = await database.get<{ beetsId: number }>(
    'SELECT beets_id AS beetsId FROM albums ORDER BY RANDOM() LIMIT 1'
  )
  return getAlbum(database, randomAlbum.beetsId)
}

export async function getAlbum(database: SidecarDatabase, beetsId: number) {
  const [album] = await listAlbumsByBeetsIds(database, [beetsId])
  const songs = await listSongsForAlbum(database, beetsId)
  return { album, songs }
}

export function getPlayedAlbums(database: SidecarDatabase) {
  return database.all<{
    beetsId: number
    artist: string
    title: string
    artPath: string | null
    playedAt: number
  }>(`
    SELECT
      plays.beets_id AS beetsId,
      albums.artist,
      albums.title,
      albums.art_path AS artPath,
      plays.played_at AS playedAt
    FROM plays
    JOIN albums ON albums.beets_id = plays.beets_id
    ORDER BY plays.played_at DESC
  `)
}

export async function getTopGenre(
  database: SidecarDatabase,
  beetsIds: number[]
) {
  const albums = await listAlbumsByBeetsIds(database, beetsIds)
  const counts = new Map<string, number>()

  for (const album of albums) {
    if (album.genre) counts.set(album.genre, (counts.get(album.genre) ?? 0) + 1)
  }

  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export async function getRecommendedAlbum(
  database: SidecarDatabase,
  liked: number[],
  disliked: number[],
  played: number[],
  skipped: number[]
) {
  const [recommendation] = await getRecommendationCandidates(
    database,
    liked,
    disliked,
    played,
    skipped,
    1
  )
  const songs = await listSongsForAlbum(
    database,
    recommendation.album.beetsId
  )

  return {
    album: recommendation.album,
    songs
  }
}

export function getRecommendationCandidates(
  database: SidecarDatabase,
  liked: number[],
  disliked: number[],
  played: number[],
  skipped: number[],
  limit: number
) {
  return recommendAlbums(database, 'clap', {
    liked,
    disliked,
    played,
    skipped,
    scorer: nearestDislikeScorer,
    picker: composePickers(
      artistNovelty(0.1),
      artistRarity(0.1),
      genreNovelty(0.1)
    ),
    limit
  })
}

export async function searchAlbums(
  database: SidecarDatabase,
  query: string
) {
  return (await searchGalileoAlbums(database, query)).slice(0, 20)
}
