import useSettings from '@/stores/settings'

export default (title: string, isNowPlayingInfo: boolean = false) => {
    const settings = useSettings()
    if (settings.nowPlayingTrackOnTabTitle && !isNowPlayingInfo) {
        return
    }

    const base = 'AivinNet'

    if (title) {
        document.title = `${title} | ${base}`
    } else {
        document.title = base
    }
}
