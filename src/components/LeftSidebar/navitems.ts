import { Routes } from "@/router";
import useSearch from "@/stores/search";

import FolderSvg from "@/assets/icons/folder-1.svg";
import BookmarkSvg from "@/assets/icons/bookmark.svg";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import SearchSvg from "@/assets/icons/search.svg";
import HomeSvg from "@/assets/icons/home.svg";
import ChartSvg from "@/assets/icons/chart.svg";

// `iconClass` lets NavButtons normalise the optical size of these mixed-source
// icons (their artwork fills its viewBox by different amounts). See the
// `.nav-ico-*` rules in NavButtons.vue.
const folder = {
  name: "folders",
  route_name: Routes.folder,
  params: { path: "$home" },
  icon: FolderSvg,
  iconClass: "nav-ico-folder",
};

const favorites = {
  name: "favorites",
  route_name: Routes.favorites,
  icon: BookmarkSvg,
  iconClass: "nav-ico-bookmark",
};

const playlists = {
  name: "playlists",
  route_name: Routes.playlists,
  icon: PlaylistSvg,
  iconClass: "nav-ico-playlist",
};

const home = {
  name: "home",
  route_name: Routes.Home,
  icon: HomeSvg,
  iconClass: "nav-ico-home",
};

export const menus = [
  home,
  folder,
  {
    name: "search",
    route_name: Routes.search,
    params: { page: "top" },
    query: () => ({ q: useSearch().query }),
    icon: SearchSvg,
    iconClass: "nav-ico-search",
  },
  {
    separator: true,
  },
  favorites,
  playlists,
  {
    name: "stats",
    route_name: Routes.Stats,
    icon: ChartSvg,
    iconClass: "nav-ico-chart",
  },
];

export const topnavitems = [home, folder, favorites, playlists];
