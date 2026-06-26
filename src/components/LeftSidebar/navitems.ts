import { Routes } from "@/router";
import useSearch from "@/stores/search";

import FolderSvg from "@/assets/icons/folder-1.svg";
import BookmarkSvg from "@/assets/icons/bookmark.svg";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import SearchSvg from "@/assets/icons/search.svg";
import HomeSvg from "@/assets/icons/home.svg";
import ChartSvg from "@/assets/icons/chart.svg";

const folder = {
  name: "folders",
  route_name: Routes.folder,
  params: { path: "$home" },
  icon: FolderSvg,
};

const favorites = {
  name: "favorites",
  route_name: Routes.favorites,
  icon: BookmarkSvg,
};

const playlists = {
  name: "playlists",
  route_name: Routes.playlists,
  icon: PlaylistSvg,
};

const home = {
  name: "home",
  route_name: Routes.Home,
  icon: HomeSvg,
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
  },
];

export const topnavitems = [home, folder, favorites, playlists];
