<template>
    <div class="generichead">
        <div class="before">
            <div class="left">
                <h1 class="title"><slot name="name"></slot></h1>
                <div class="desc">
                    <slot name="description"></slot>
                </div>
            </div>
            <div class="right">
                <slot name="right"></slot>
            </div>
        </div>
        <div class="after">
            <slot name="after"></slot>
        </div>
    </div>
</template>

<style lang="scss">
.generichead {
    // Top padding: without it the page title (Playlists / Favorites /
    // Charts …) sits flush against the top bar.
    padding: 1.25rem 0 1rem $medium;
    height: max-content;
    align-items: center;
    // NOT `overflow: hidden` any more: the title is a sticker now, and its
    // 3px offset shadow lives outside the text box — clipping the header
    // sliced the shadow off at the right edge. Ellipsing is the `.title`'s own
    // job (it has `overflow: hidden` for that), not the container's.
    max-width: 100%;

    .before {
        display: grid;
        grid-template-columns: 1fr max-content;
    }

    .right {
        display: flex;
        align-items: center;
        height: 100%;
    }

    .after {
        margin-top: 2rem;
        margin-left: -$medium;
    }

    .left {
        max-width: 100%;
        overflow: hidden;
    }

    h1 {
        width: max-content;
        margin: 0;
        font-size: 3.25rem;
    }

    .title {
        // The page title (Playlists / Favorites / Charts …) is a sticker: it
        // used to stand free on the doodle ground, where its readability
        // depended on which memphis shape happened to sit behind it.
        @include mem-sticker($candy-radius, 0.35rem 0.9rem);
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .desc {
        @include mem-sticker;
        font-size: 1rem;
        line-height: 1.5;
        font-weight: 500;
        margin-top: $small;
    }

    // An empty description slot would otherwise render an empty sticker — a
    // small white box under the title with nothing in it.
    .desc:empty {
        display: none;
    }

    @include mediumPhones {
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, 100%);
    }

    // On phones the page title is shown in the top bar (see NavBar mobileTitle)
    // and the description is hidden, so the in-view header is empty — hide the
    // title and collapse the header's bottom padding so content starts right
    // under the top bar instead of leaving a dead gap. (Page-level actions like
    // "New Playlist" move to a mobile FAB rather than living in this header.)
    @include allPhones {
        padding-top: 0;
        padding-bottom: 0;

        .title {
            display: none;
        }
    }

    h1 {
        font-size: 1.75rem;
    }

    .desc {
        display: none;
    }
}
</style>
