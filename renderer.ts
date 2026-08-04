const playButton = document.getElementById('play-button') as HTMLButtonElement
const player = document.getElementById('player') as HTMLAudioElement
const nowPlaying = document.getElementById('now-playing') as HTMLElement
const albumName = document.getElementById('album-name') as HTMLHeadingElement
const albumArtist = document.getElementById('album-artist') as HTMLElement
const albumRuntime = document.getElementById('album-runtime') as HTMLElement
const albumCover = document.getElementById('album-cover') as HTMLImageElement
const songList = document.getElementById('song-list') as HTMLOListElement
const likeButton = document.getElementById('like-button') as HTMLButtonElement
const dislikeButton = document.getElementById('dislike-button') as HTMLButtonElement
const loveButton = document.getElementById('love-button') as HTMLButtonElement
const momentum = document.getElementById('momentum') as HTMLElement
const recommendationReason = document.getElementById('recommendation-reason') as HTMLElement
const searchInput = document.getElementById('search-input') as HTMLInputElement
const searchResults = document.getElementById('search-results') as HTMLUListElement
const libraryNav = document.getElementById('library-nav') as HTMLButtonElement
const tasteNav = document.getElementById('taste-nav') as HTMLButtonElement
const lovedNav = document.getElementById('loved-nav') as HTMLButtonElement
const playedNav = document.getElementById('played-nav') as HTMLButtonElement
const settingsNav = document.getElementById('settings-nav') as HTMLButtonElement
const libraryPage = document.getElementById('library-page') as HTMLDivElement
const tastePage = document.getElementById('taste-page') as HTMLElement
const lovedPage = document.getElementById('loved-page') as HTMLElement
const lovedAlbums = document.getElementById('loved-albums') as HTMLDivElement
const playedPage = document.getElementById('played-page') as HTMLElement
const playedAlbums = document.getElementById('played-albums') as HTMLDivElement
const settingsPage = document.getElementById('settings-page') as HTMLElement
const settingsForm = document.getElementById('settings-form') as HTMLFormElement
const beetsLibrary = document.getElementById('beets-library') as HTMLInputElement
const musicLibrary = document.getElementById('music-library') as HTMLInputElement
const settingsStatus = document.getElementById('settings-status') as HTMLElement
const tasteCandidates = document.getElementById('taste-candidates') as HTMLOListElement
const likedCount = document.getElementById('liked-count') as HTMLElement
const dislikedCount = document.getElementById('disliked-count') as HTMLElement
const resetTaste = document.getElementById('reset-taste') as HTMLButtonElement

let selectedAlbum: AlbumView | null = null
let playingAlbum: AlbumView | null = null
let selectedSongs: AlbumView['songs'] = []
let playingSongs: AlbumView['songs'] = []
let songIndex = 0
let albumLoadId = 0
let handingOff = false

function showPage(page: 'library' | 'taste' | 'loved' | 'played' | 'settings') {
  libraryPage.hidden = page !== 'library'
  tastePage.hidden = page !== 'taste'
  lovedPage.hidden = page !== 'loved'
  playedPage.hidden = page !== 'played'
  settingsPage.hidden = page !== 'settings'
  libraryNav.classList.toggle('active', page === 'library')
  tasteNav.classList.toggle('active', page === 'taste')
  lovedNav.classList.toggle('active', page === 'loved')
  playedNav.classList.toggle('active', page === 'played')
  settingsNav.classList.toggle('active', page === 'settings')
}

async function updateTastePage() {
  const taste = await window.galileo.taste()
  likedCount.innerText = String(taste.likedCount)
  dislikedCount.innerText = String(taste.dislikedCount)
  tasteCandidates.replaceChildren(...taste.candidates.map(album => {
    const item = document.createElement('li')
    item.innerText = album
    return item
  }))

  if (taste.candidates.length === 0) {
    const item = document.createElement('li')
    item.innerText = 'Like an album to get recommendations.'
    tasteCandidates.append(item)
  }
}

async function playAlbum(album: AlbumView) {
  await Promise.all([
    window.galileo.rateAlbum(album.beetsId, true),
    window.galileo.recordPlay(album.beetsId)
  ])
  playingAlbum = album
  playingSongs = album.songs
  songIndex = 0
  nowPlaying.innerText = `${album.title} · ${album.artist}`
  playSong()
}

async function updateLovedPage() {
  const albums = await window.galileo.lovedAlbums()

  lovedAlbums.replaceChildren(...albums.map(album => {
    const card = document.createElement('div')
    const selectButton = document.createElement('button')
    const removeButton = document.createElement('button')
    const cover = document.createElement('img')
    const copy = document.createElement('span')
    const artist = document.createElement('span')
    const title = document.createElement('strong')
    card.className = 'loved-album'
    selectButton.className = 'loved-album-select'
    removeButton.className = 'loved-album-remove'
    removeButton.type = 'button'
    removeButton.innerText = '×'
    removeButton.title = `Remove ${album.title} from loved albums`
    removeButton.setAttribute(
      'aria-label',
      `Remove ${album.title} from loved albums`
    )
    cover.src = album.artUrl ?? './images/placeholder.svg'
    cover.alt = ''
    artist.innerText = album.artist
    title.innerText = album.title
    copy.append(artist, title)
    selectButton.append(cover, copy)
    selectButton.addEventListener('click', async () => {
      await window.galileo.resetTaste()
      const selected = await window.galileo.selectAlbum(album.beetsId)
      showPage('library')
      showAlbum(selected, `Starting fresh from ${selected.title}.`)
      loveButton.innerText = '♥ Loved'
      await playAlbum(selected)
    })
    removeButton.addEventListener('click', async () => {
      await window.galileo.unloveAlbum(album.beetsId)
      if (selectedAlbum?.beetsId === album.beetsId) {
        loveButton.innerText = '♡ Love'
        loveButton.disabled = false
      }
      await updateLovedPage()
    })
    card.append(selectButton, removeButton)
    return card
  }))

  if (albums.length === 0) {
    const message = document.createElement('p')
    message.innerText = 'No loved albums yet.'
    lovedAlbums.append(message)
  }
}

async function updatePlayedPage() {
  const albums = await window.galileo.playedAlbums()

  playedAlbums.replaceChildren(...albums.map(album => {
    const button = document.createElement('button')
    const cover = document.createElement('img')
    const copy = document.createElement('span')
    const artist = document.createElement('span')
    const title = document.createElement('strong')
    const playedAt = document.createElement('small')
    button.className = 'played-album'
    cover.src = album.artUrl ?? './images/placeholder.svg'
    cover.alt = ''
    artist.innerText = album.artist
    title.innerText = album.title
    playedAt.innerText = new Date(album.playedAt).toLocaleString()
    copy.append(artist, title, playedAt)
    button.append(cover, copy)
    button.addEventListener('click', async () => {
      const selected = await window.galileo.selectAlbum(album.beetsId)
      showPage('library')
      showAlbum(selected, `Returning to ${selected.title}.`)
      await playAlbum(selected)
    })
    return button
  }))

  if (albums.length === 0) {
    const message = document.createElement('p')
    message.innerText = 'No played albums yet.'
    playedAlbums.append(message)
  }
}

async function updateSettingsPage() {
  const settings = await window.galileo.getSettings()
  beetsLibrary.value = settings.beetsLibrary
  musicLibrary.value = settings.musicLibrary
  settingsStatus.innerText = ''
}

libraryNav.addEventListener('click', () => showPage('library'))
tasteNav.addEventListener('click', async () => {
  showPage('taste')
  await updateTastePage()
})
lovedNav.addEventListener('click', async () => {
  showPage('loved')
  await updateLovedPage()
})
playedNav.addEventListener('click', async () => {
  showPage('played')
  await updatePlayedPage()
})
settingsNav.addEventListener('click', async () => {
  showPage('settings')
  await updateSettingsPage()
})
settingsForm.addEventListener('submit', async event => {
  event.preventDefault()
  await window.galileo.saveSettings({
    beetsLibrary: beetsLibrary.value.trim(),
    musicLibrary: musicLibrary.value.trim()
  })
  settingsStatus.innerText = 'Saved.'
})
resetTaste.addEventListener('click', async () => {
  await window.galileo.resetTaste()
  await updateTastePage()
})

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

function readDuration(url: string): Promise<number | null> {
  return new Promise(resolve => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration), {
      once: true
    })
    audio.addEventListener('error', () => resolve(null), { once: true })
    audio.src = url
  })
}

async function showDurations(album: AlbumView, loadId: number) {
  const durations = await Promise.all(
    album.songs.map(song => readDuration(song.url))
  )
  if (loadId !== albumLoadId) return

  songList.querySelectorAll<HTMLElement>('.track-duration')
    .forEach((element, index) => {
      const duration = durations[index]
      element.innerText = duration === null ? '—' : formatDuration(duration)
    })

  const knownDuration = durations.reduce(
    (total: number, duration) => total + (duration ?? 0),
    0
  )
  const minutes = knownDuration ? ` · ${Math.round(knownDuration / 60)} min` : ''
  albumRuntime.innerText =
    `${album.songs.length} tracks${minutes} · album plays start to finish.`
}

function updatePlayingSong() {
  const activeIndex = playingSongs === selectedSongs ? songIndex : -1
  songList.querySelectorAll('li').forEach((item, index) => {
    item.classList.toggle('playing', index === activeIndex)
  })
}

function stopPlayback() {
  player.pause()
  player.removeAttribute('src')
  player.load()
  playingAlbum = null
  playingSongs = []
  nowPlaying.innerText = 'Nothing playing'
  updatePlayingSong()
}

function playSong() {
  const song = playingSongs[songIndex]
  updatePlayingSong()
  if (!song) return

  player.src = song.url
  void player.play()
}

playButton.addEventListener('click', async () => {
  if (!selectedAlbum) return

  await playAlbum(selectedAlbum)
})

player.addEventListener('ended', () => {
  songIndex += 1
  if (songIndex < playingSongs.length) {
    playSong()
  } else {
    void finishPlayingAlbum()
  }
})

function showAlbum(result: AlbumView, reason: string) {
  selectedAlbum = result
  selectedSongs = result.songs
  albumLoadId += 1

  albumArtist.innerText = result.artist
  albumName.innerText = result.title
  albumCover.src = result.artUrl ?? './images/placeholder.svg'
  albumCover.alt = `${result.artist} — ${result.title}`
  albumRuntime.innerText =
    `${result.songs.length} tracks · album plays start to finish.`
  recommendationReason.innerText = reason
  loveButton.innerText = '♡ Love'
  loveButton.disabled = false
  momentum.innerText = result.momentum
    ? `Lately you’ve been leaning into ${result.momentum}.`
    : 'Your listening thread will take shape as you go.'

  songList.replaceChildren(...result.songs.map((song, index) => {
    const item = document.createElement('li')
    const number = document.createElement('span')
    const title = document.createElement('span')
    const duration = document.createElement('span')
    number.className = 'track-number'
    title.className = 'track-title'
    duration.className = 'track-duration'
    number.innerText = String(index + 1).padStart(2, '0')
    title.innerText = song.title
    duration.innerText = '—'
    item.append(number, title, duration)
    return item
  }))

  void showDurations(result, albumLoadId)
}

async function showNextAlbum(reason: string) {
  showAlbum(await window.galileo.randomAlbum(), reason)
}

async function handOff(liked: boolean) {
  if (!selectedAlbum || handingOff) return
  handingOff = true
  playButton.disabled = true
  likeButton.disabled = true
  dislikeButton.disabled = true
  loveButton.disabled = true

  const previous = selectedAlbum
  await Promise.all([
    window.galileo.rateAlbum(previous.beetsId, liked),
    window.galileo.skipAlbum(previous.beetsId)
  ])

  const reason = liked
    ? `Because you asked for more like ${previous.title}.`
    : `Steering away from ${previous.genre ?? previous.title}.`

  await showNextAlbum(reason)
  playButton.disabled = false
  likeButton.disabled = false
  dislikeButton.disabled = false
  loveButton.disabled = false
  handingOff = false
}

async function finishPlayingAlbum() {
  if (!playingAlbum || handingOff) return
  handingOff = true
  playButton.disabled = true
  likeButton.disabled = true
  dislikeButton.disabled = true
  loveButton.disabled = true

  const completed = playingAlbum
  stopPlayback()
  await window.galileo.rateAlbum(completed.beetsId, true)
  await showNextAlbum(
    `Because you played ${completed.title} all the way through.`
  )

  playButton.disabled = false
  likeButton.disabled = false
  dislikeButton.disabled = false
  loveButton.disabled = false
  handingOff = false
}

likeButton.addEventListener('click', () => void handOff(true))
dislikeButton.addEventListener('click', () => void handOff(false))
loveButton.addEventListener('click', async () => {
  if (!selectedAlbum) return

  const album = selectedAlbum
  loveButton.disabled = true
  await window.galileo.loveAlbum(album.beetsId)
  if (selectedAlbum === album) loveButton.innerText = '♥ Loved'
})

let searchTimer: ReturnType<typeof setTimeout>

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer)
  const query = searchInput.value.trim()

  if (!query) {
    searchResults.replaceChildren()
    return
  }

  searchTimer = setTimeout(async () => {
    const albums = await window.galileo.searchAlbums(query)
    if (query !== searchInput.value.trim()) return

    searchResults.replaceChildren(...albums.map(album => {
      const item = document.createElement('li')
      const button = document.createElement('button')
      button.className = 'search-result'
      button.innerText = `${album.artist} — ${album.title}`
      button.addEventListener('click', async () => {
        const selected = await window.galileo.selectAlbum(album.beetsId)
        showAlbum(selected, `You chose ${selected.title} as a place to start.`)
        searchInput.value = ''
        searchResults.replaceChildren()
      })
      item.append(button)
      return item
    }))
  }, 250)
})

void showNextAlbum('A fresh place to start.')
