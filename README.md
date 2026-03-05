<p align="center">
  <a href="https://processlink.com.au">
    <img src="processlink-banner.png" alt="Process Link" height="50">
  </a>
</p>

<h3 align="center">Node-RED Integration</h3>

<p align="center">
  <em>Connect your Node-RED flows to the Process Link platform</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@processlink/node-red-contrib-processlink"><img src="https://img.shields.io/npm/v/@processlink/node-red-contrib-processlink.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@processlink/node-red-contrib-processlink"><img src="https://img.shields.io/npm/dm/@processlink/node-red-contrib-processlink.svg" alt="npm downloads"></a>
  <a href="https://nodered.org"><img src="https://img.shields.io/badge/Node--RED-%3E%3D2.0.0-red.svg" alt="Node-RED"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

---

## What's Included

| Node | What it does |
|------|--------------|
| **files upload** | Upload files to Process Link |
| **send email** | Send emails with optional file attachments |
| **send SMS** | Send SMS messages |
| **notify group** | Notify a managed group (email + SMS) |
| **system info** | Output device diagnostics (hostname, memory, disk, uptime, etc.) |

All messaging nodes use the ProcessMail API and output on two pins: success (1) and error (2). System info has a single output.

## Installation

**Palette Manager (recommended):** Menu > Manage palette > Install > search `@processlink/node-red-contrib-processlink`

**npm:**
```bash
cd ~/.node-red
npm install @processlink/node-red-contrib-processlink
```

## Getting Started

1. Log in to the [Process Link Portal](https://portal.processlink.com.au)
2. Go to **Developer > API Keys** and generate a key
3. Copy your **Site ID** and **API Key**
4. In Node-RED, drag any Process Link node into your flow
5. Double-click it, click the pencil icon next to "Config", and enter your credentials

```
[Inject] > [File In] > [files upload] --+-- success > [Debug]
                                        +-- error   > [Debug]
```

---

## Node Reference

### Files Upload

Uploads files to Process Link.

**Config:** Set a filename (overrides `msg.filename`), pick a destination folder, and optionally prefix filenames with a timestamp.

**Input:** `msg.payload` (Buffer or string) with the file content. `msg.filename` as an optional fallback.

**Success output:** `msg.file_id`, `msg.statusCode` (201)

### Send Email

Sends emails via ProcessMail. Supports To, CC, BCC, Reply-To, plain text or HTML body.

**Input:** `msg.to`, `msg.subject`, `msg.body`, `msg.bodyType` ("text" or "html")

**Attachments:** Connect an upload node first — `msg.file_id` is picked up automatically. For multiple files, collect IDs into `msg.attachments` as `[{ fileId: "uuid" }]`.

**Success output:** `msg.email_id`, `msg.statusCode` (200)

### Send SMS

Sends SMS messages via ProcessMail. Phone numbers must be in E.164 format (`+61412345678`).

**Input:** `msg.to` (string or array), `msg.body`

**Success output:** `msg.message_id`, `msg.payload.segment_count`, `msg.statusCode` (200)

### Notify Group

Sends notifications to a managed group. Instead of hardcoding recipients in your flow, you reference a group key (e.g. `maintenance-alerts`). Org admins manage members and their preferred channels (email, SMS, or both) in ProcessMail — no flow changes needed.

**Input:** `msg.group_key`, `msg.subject`, `msg.body`

**Options:** Branded email template, link-only attachments (sends download links instead of inline files), HTML body support.

**Attachments:** Same as send email — connect an upload node or pass `msg.attachments`.

**Success output:** `msg.payload.notifications_sent` (e.g. `{ email: 3, sms: 2 }`), `msg.payload.total_recipients`

**Setup:**
1. Create a notification group in ProcessMail
2. Add members and set contact preferences
3. Use the group key in this node

### System Info

Outputs system diagnostics: hostname, platform, OS, CPU, memory, disk, network, uptime, Node-RED version, and more.

Triggers on deploy (optional) or on any incoming message. Single output with everything in `msg.payload`.

---

## Example Flows

We include a demo flow with examples for every node. Import it into Node-RED to try things out.

**[Download the demo flow](https://github.com/process-link/node-red-contrib-processlink/blob/main/examples/demo-flow.json)** — copy the JSON, then Menu > Import > Clipboard.

<details>
<summary>Quick start flow (file upload)</summary>

```json
[
    {
        "id": "pl-inject",
        "type": "inject",
        "z": "",
        "name": "Upload File",
        "props": [],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 110,
        "y": 100,
        "wires": [["pl-file-in"]]
    },
    {
        "id": "pl-file-in",
        "type": "file in",
        "z": "",
        "name": "Read File",
        "filename": "/tmp/myfile.csv",
        "filenameType": "str",
        "format": "",
        "chunk": false,
        "sendError": false,
        "encoding": "none",
        "allProps": true,
        "x": 270,
        "y": 100,
        "wires": [["pl-upload"]]
    },
    {
        "id": "pl-upload",
        "type": "processlink-files-upload",
        "z": "",
        "name": "Upload to Process Link",
        "server": "",
        "filename": "",
        "timeout": "30000",
        "apiUrl": "https://files.processlink.com.au/api/v1/sites/{siteId}/files/upload",
        "x": 470,
        "y": 100,
        "wires": [["pl-debug-success"], ["pl-debug-error"]]
    },
    {
        "id": "pl-debug-success",
        "type": "debug",
        "z": "",
        "name": "Success",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "x": 680,
        "y": 80,
        "wires": []
    },
    {
        "id": "pl-debug-error",
        "type": "debug",
        "z": "",
        "name": "Error",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "x": 670,
        "y": 120,
        "wires": []
    }
]
```

After importing, update the file path and add your credentials.
</details>

---

## Security

API keys are stored encrypted by Node-RED, all communication uses HTTPS, and keys are never logged or exposed in flow exports.

## Requirements

- Node-RED >= 2.0.0
- Node.js >= 18.0.0

## Support

- **Issues**: [GitHub](https://github.com/process-link/node-red-contrib-processlink/issues)
- **Email**: support@processlink.com.au
- **Website**: [processlink.com.au](https://processlink.com.au)

## License

[MIT](LICENSE)
