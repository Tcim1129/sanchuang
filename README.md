# qinji-mini

Taro-based WeChat mini program for relationship health check-in, AI consultation, and partner collaboration.

## Requirements

- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Run

```bash
npm run dev:weapp
```

## Build

```bash
npm run build:weapp
```

## Backend API

Default API base URL:

```text
https://sanchuang1.tcim.me
```

Override at build time with environment variable:

```powershell
$env:TARO_APP_BASE_URL='https://your-api-domain'
npm run build:weapp
```

## Main directories

- `src/pages`: app pages
- `src/services`: API services and request wrapper
- `config`: Taro build config
