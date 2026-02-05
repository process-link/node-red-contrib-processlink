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

## Overview

Connect your Node-RED flows to the [Process Link](https://processlink.com.au) platform. Upload files, send notifications, and integrate with industrial automation systems.

## Available Nodes

| Node | Description |
|------|-------------|
| **files upload** | Upload files to Process Link Files API |

*More nodes coming soon: mail, downtime logging, notes*

## Installation

### Via Node-RED Palette Manager (Recommended)

1. Open Node-RED
2. Go to **Menu → Manage palette → Install**
3. Search for `@processlink/node-red-contrib-processlink`
4. Click **Install**

### Via npm

```bash
cd ~/.node-red
npm install @processlink/node-red-contrib-processlink
```

Then restart Node-RED.

## Quick Start

### 1. Get Your Credentials

1. Log in to the [Process Link Portal](https://portal.processlink.com.au)
2. Go to **Developer → API Keys**
3. Click **Generate API Key**
4. Copy your **Site ID** and **API Key**

### 2. Add and Configure a Node

1. Find the **files upload** node in the palette under "Process Link"
2. Drag it into your flow
3. Double-click to configure
4. Click the pencil icon next to "Config"
5. Enter your **Site ID** and **API Key**
6. Click **Add**, then **Done**

### 3. Connect Your Flow

```
[File In] → [files upload] → [Debug]
```

## Node Reference

### Files Upload

Uploads files to the Process Link Files API.

#### Configuration

| Property | Description |
|----------|-------------|
| Config | Your Process Link credentials (Site ID + API Key) |
| Filename | Default filename (optional, can be set via `msg.filename`) |
| Timeout | Request timeout in milliseconds (default: 30000) |

#### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | Buffer \| string | The file content to upload |
| `msg.filename` | string | *(Optional)* Filename to use |

#### Outputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | object | API response with `ok`, `file_id`, `created_at` |
| `msg.file_id` | string | The UUID of the uploaded file |
| `msg.statusCode` | number | HTTP status code (201 on success) |

#### Status Indicators

| Color | Meaning |
|-------|---------|
| 🟡 Yellow | Uploading in progress |
| 🟢 Green | Upload successful |
| 🔴 Red | Error occurred |

## Example Flow (Copy & Import)

Copy the JSON below and import it into Node-RED: **Menu → Import → Clipboard**

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
        "apiUrl": "https://files.processlink.com.au/api/upload",
        "x": 470,
        "y": 100,
        "wires": [["pl-debug"]]
    },
    {
        "id": "pl-debug",
        "type": "debug",
        "z": "",
        "name": "Result",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "x": 650,
        "y": 100,
        "wires": []
    }
]
```

**After importing:**
1. Double-click the **Read File** node → change the file path to your file
2. Double-click the **Upload to Process Link** node → click the pencil icon → enter your **Site ID** and **API Key**
3. Click **Deploy**
4. Click the inject button to upload

### Dynamic Filename

Use a Function node to set the filename dynamically:

```javascript
msg.filename = "report-" + new Date().toISOString().split('T')[0] + ".csv";
return msg;
```

### Upload with Error Handling

```
[File In] → [files upload] → [Switch] → [Debug (success)]
                                     ↘ [Debug (error)]
```

Use a Switch node to route based on `msg.statusCode`:
- Route 1: `msg.statusCode == 201` (success)
- Route 2: Otherwise (error)

## Error Handling

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 201 | Success | File uploaded successfully |
| 400 | Bad Request | Check that payload is a valid file buffer |
| 401 | Unauthorized | Verify your API key is correct |
| 403 | Forbidden | Enable API access in site settings |
| 404 | Not Found | Verify your Site ID is correct |
| 429 | Rate Limited | Max 30 uploads/minute per site |
| 507 | Storage Full | Contact administrator to increase storage |

## Rate Limits

- **30 uploads per minute** per site
- Exceeding the limit returns a 429 status code
- Implement retry logic in your flow for high-volume uploads

## Security

- ✅ API keys are stored encrypted by Node-RED
- ✅ All communication uses HTTPS
- ✅ Keys are never logged or exposed in flow exports

## Requirements

- Node-RED >= 2.0.0
- Node.js >= 14.0.0

## Support

- 📖 **Documentation**: [GitHub Wiki](https://github.com/process-link/node-red-contrib-processlink/wiki)
- 🐛 **Issues**: [GitHub Issues](https://github.com/process-link/node-red-contrib-processlink/issues)
- 📧 **Email**: support@processlink.com.au
- 🌐 **Website**: [processlink.com.au](https://processlink.com.au)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](LICENSE)
