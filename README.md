# AivinNet Client

A Spotify-style music player frontend, branded as **AivinNet**. This is a fork of [swingmx/webclient](https://github.com/swingmx/webclient) with a full visual redesign and custom branding.

- Backend: [vwellenberg/AivinNet](https://github.com/vwellenberg/AivinNet)
- Frontend: [vwellenberg/AivinNet-Client](https://github.com/vwellenberg/AivinNet-Client)

---

## Tech Stack

- **Vue 3** + TypeScript
- **Pinia** (state management)
- **SCSS** (styling)
- **Vite** (build tool)

---

## Local Development

Requires Node 18+ and Yarn.

```bash
# Install dependencies
yarn install

# Start the development server
yarn dev
```

---

## Build

```bash
yarn build
```

The production output is placed in the `dist/` folder.

---

## Deploy to Server

The following command pulls the latest code, builds the project, deploys it to the server, and restarts the service:

```bash
ssh -i ~/.ssh/id_ed25519 vwellenberg@192.168.0.4 "cd ~/AivinNet-Client && git pull && NODE_OPTIONS='--dns-result-order=ipv4first' yarn install --ignore-engines --network-timeout 120000 2>&1 | tail -2 && NODE_OPTIONS='--dns-result-order=ipv4first' yarn build 2>&1 | tail -5 && rm -rf ~/.config/swingmusic/client && cp -r dist ~/.config/swingmusic/client && sudo -n systemctl restart aivinnet && echo deployed"
```

> **Note:** The server runs Node 18, so `--ignore-engines` is required for `yarn install`.

---

## License

[MIT License](https://opensource.org/licenses/MIT)
