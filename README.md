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
| **send email** | Send emails via ProcessMail API (with optional attachments) |
| **send SMS** | Send SMS messages via ProcessMail API (Twilio) |
| **notify group** | Send notifications to a managed group via ProcessMail (email + SMS) |
| **system info** | Output system diagnostics (hostname, memory, disk, uptime, etc.) |

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
[Inject] → [File In] → [files upload] ─┬─ Output 1 (success) → [Debug]
                                       └─ Output 2 (error)   → [Debug]
```

---

## Node Reference

---

## Files Upload

Uploads files to the Process Link Files API.

### Configuration

| Property | Description |
|----------|-------------|
| Config | Your Process Link credentials (Site ID + API Key) |
| Filename | Filename for uploaded file (takes priority over `msg.filename`) |
| Location | Destination area/folder in the Files app (default: site root) |
| Prefix with timestamp | Adds `YYYY-MM-DD_HH-mm-ss_` prefix to filename (ISO 8601 format) |
| Timeout | Request timeout in milliseconds (default: 30000) |

**Filename priority:** Config filename → `msg.filename` → `unknown-file`

**Location:** The dropdown shows your site's folder structure organized by area. Select where uploaded files should be stored. Areas and folders are fetched from the Files API when you open the node configuration.

**Timestamp prefix:** When enabled, always prepends the current date/time to the filename, regardless of whether it came from config or `msg.filename`.

### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | Buffer \| string | The file content to upload |
| `msg.filename` | string | *(Optional)* Fallback filename if not set in config |

### Outputs

This node has **two outputs**:

| Output | When | Properties |
|--------|------|------------|
| **1 - Success** | HTTP 201 | `msg.payload.ok`, `msg.payload.file_id`, `msg.file_id`, `msg.statusCode` |
| **2 - Error** | API error, network error, timeout | `msg.payload.error`, `msg.statusCode` |

### Status Indicators

| Color | Meaning |
|-------|---------|
| 🔴 Red | Error occurred |
| 🟡 Yellow | Uploading in progress |
| 🟢 Green | Upload successful |

### Status Codes

| Code | Meaning |
|------|---------|
| 201 | Success |
| 400 | Bad request |
| 401 | Invalid API key |
| 403 | API access not enabled |
| 404 | Site not found |
| 429 | Rate limit exceeded (max 30/min) |
| 507 | Storage limit exceeded |

---

## Send Email

Sends emails via the ProcessMail API with optional file attachments.

### Configuration

| Property | Description |
|----------|-------------|
| Config | Your Process Link credentials (API Key) |
| To | Recipient email address(es) |
| Subject | Email subject line |
| Body | Email body content |
| Body Type | Plain Text or HTML |
| CC / BCC | Optional carbon copy recipients |
| Reply-To | Optional reply-to address |
| Timeout | Request timeout in milliseconds (default: 30000) |

### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.to` | string \| string[] | Recipient email address(es) |
| `msg.subject` | string | Email subject |
| `msg.body` | string | Email body content (optional - has default) |
| `msg.bodyType` | string | "text" (default) or "html" |
| `msg.file_id` | string | *(Optional)* Single file attachment from upload node |
| `msg.attachments` | array | *(Optional)* Multiple attachments: `[{ fileId: "uuid" }]` |

### Outputs

| Output | When | Properties |
|--------|------|------------|
| **1 - Success** | HTTP 200 | `msg.email_id`, `msg.resend_id`, `msg.statusCode` |
| **2 - Error** | API/network error | `msg.payload.error`, `msg.statusCode` |

### File Attachments

**Single file (direct connection):** Connect the upload node directly to the mail node. The mail node automatically uses `msg.file_id`.

```
[file-in] → [upload] → [send email]
```

**Multiple files:** Use a function node to collect file IDs into `msg.attachments`.

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Email sent successfully |
| 400 | Bad request (missing fields) |
| 401 | Invalid API key |
| 403 | Service not enabled |
| 429 | Daily email limit reached |

---

## Send SMS

Sends SMS messages via the ProcessMail API using Twilio.

### Configuration

| Property | Description |
|----------|-------------|
| Config | Your Process Link credentials (API Key) |
| To | Recipient phone number in E.164 format (e.g., `+61412345678`) |
| Body | SMS message text |
| Timeout | Request timeout in milliseconds (default: 30000) |

### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.to` | string \| string[] | Recipient phone number(s) in E.164 format |
| `msg.body` | string | SMS message text |
| `msg.payload` | string | *(Fallback)* Used as body if `msg.body` is not set |

### Outputs

| Output | When | Properties |
|--------|------|------------|
| **1 - Success** | HTTP 200 | `msg.message_id`, `msg.twilio_sid`, `msg.payload.segment_count`, `msg.statusCode` |
| **2 - Error** | API/network error | `msg.payload.error`, `msg.payload.code`, `msg.statusCode` |

### Phone Number Format

Phone numbers must be in **E.164 format**: `+` followed by country code and number.

- Australia: `+61412345678` (drop the leading 0)
- US/Canada: `+12025551234`
- UK: `+447911123456`

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | SMS sent successfully |
| 400 | Bad request (missing fields, invalid phone, message too long) |
| 401 | Invalid API key |
| 403 | Service not enabled or missing scope |
| 429 | Daily SMS limit reached |
| 503 | SMS not configured (Twilio credentials missing) |

---

## Notify Group

Sends notifications to a ProcessMail notification group. Channel-agnostic: ProcessMail delivers to each member via their preferred contact method (email, SMS, or both).

### How It Works

Instead of specifying individual email addresses or phone numbers in your Node-RED flow, you reference a **notification group** by its key. Groups are managed in the ProcessMail web interface, where org admins can:

- Add/remove members (platform users or external contacts)
- Set each member's preferred contact method (email, SMS, or both)

This means the programmer sets up the flow once, and authorised org members can manage who receives notifications without touching Node-RED.

### Configuration

| Property | Description |
|----------|-------------|
| Config | Your Process Link credentials (API Key) |
| Group Key | The notification group key (e.g. `maintenance-alerts`) |
| Subject | Notification subject (used for emails) |
| Body | Notification body content |
| Body Type | Plain Text or HTML (applies to email recipients) |
| Use branded email template | Wraps emails in the ProcessLink branded template. SMS is always plain text |
| Link only | When files are attached via the upload node, send them as download links instead of email attachments. Useful for large files. Has no effect if no files are attached |
| Timeout | Request timeout in milliseconds (default: 30000) |

### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.group_key` | string | Notification group key (e.g. `maintenance-alerts`) |
| `msg.subject` | string | Notification subject |
| `msg.body` | string | Notification body (fallback: `msg.payload`) |
| `msg.bodyType` | string | *(Optional)* "text" (default) or "html" |
| `msg.file_id` | string | *(Optional)* Single file attachment from upload node |
| `msg.attachments` | array | *(Optional)* Multiple attachments: `[{ fileId: "uuid" }]` |
| `msg.linkOnly` | boolean | *(Optional)* Send files as links instead of attachments |

### Outputs

| Output | When | Properties |
|--------|------|------------|
| **1 - Success** | Notifications sent | `msg.payload.ok`, `msg.payload.notifications_sent`, `msg.payload.total_recipients`, `msg.group_key` |
| **2 - Error** | Request failed | `msg.payload.error`, `msg.payload.code`, `msg.statusCode` |

**Success payload:**
- `notifications_sent` - `{ email: 3, sms: 2 }` breakdown by channel
- `total_recipients` - total unique recipients notified
- `message_ids` - ProcessMail log IDs for tracking
- `failures` - *(only if partial failures)* lists failed recipients with errors

### Examples

**Simple alert:**
```javascript
msg.group_key = "maintenance-alerts";
msg.subject = "Motor Fault on Line 3";
msg.body = "Temperature exceeded threshold at 14:32.";
return msg;
```

**With file attachment (from upload node):**
```
[file-in] → [upload] → [notify group]
```
The `msg.file_id` from the upload node is automatically included. Email recipients get the file as an attachment. SMS recipients get a download link.

**Dynamic group selection:**
```javascript
if (msg.payload.severity === "critical") {
    msg.group_key = "critical-alerts";
} else {
    msg.group_key = "general-notifications";
}
msg.subject = "Alert: " + msg.payload.message;
msg.body = msg.payload.details;
return msg;
```

### Setup

1. Create a notification group in ProcessMail (`/org/your-org/groups`)
2. Add members and set their contact preferences
3. Copy the group key
4. Create an API key in Portal with the `processmail:notify-group` scope
5. Configure this node with the API key and group key

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Notifications sent (check `payload.failures` for partial failures) |
| 400 | Bad request (missing fields, empty group, no valid recipients) |
| 401 | Invalid API key |
| 403 | Service not enabled or missing scope |
| 404 | Notification group not found |
| 429 | Daily limit exceeded |
| 500 | Server error |

---

## System Info

Outputs system information for diagnostics and monitoring.

### Configuration

| Property | Description |
|----------|-------------|
| Send on deploy | When checked (default), outputs system info when the flow is deployed |

### Triggers

- **On deploy** (if enabled) - Automatically sends when flow starts
- **On input** - Any incoming message triggers a fresh reading

### Output

`msg.payload` contains:

| Property | Description |
|----------|-------------|
| `timestamp` | ISO 8601 UTC timestamp |
| `localTime` | Device local time string |
| `timezone` | Timezone name (e.g., "Australia/Sydney") |
| `hostname` | Device hostname |
| `platform` | "win32", "linux", or "darwin" |
| `os` | OS name and version |
| `arch` | CPU architecture |
| `user` | User running Node-RED |
| `workingDirectory` | Node-RED working directory |
| `uptime` | System uptime (`raw`, `breakdown`, `formatted`) |
| `cpu` | Model, cores, architecture |
| `memory` | Total, free, used (bytes + formatted), usedPercent |
| `disk` | Total, free, used (bytes + formatted), usedPercent |
| `network` | primaryIP, mac, interfaces |
| `nodeRed` | version, uptime |
| `nodejs` | version |
| `processMemory` | rss, heapTotal, heapUsed |

### Uptime/Memory Structure

```json
{
  "uptime": {
    "raw": 432000,
    "breakdown": { "days": 5, "hours": 0, "minutes": 0, "seconds": 0 },
    "formatted": "5d 0h 0m 0s"
  },
  "memory": {
    "total": { "bytes": 17179869184, "formatted": "16.00 GB" },
    "free": { "bytes": 8589934592, "formatted": "8.00 GB" },
    "used": { "bytes": 8589934592, "formatted": "8.00 GB" },
    "usedPercent": 50
  }
}
```

---

## Example Flow

Copy the JSON below and import into Node-RED: **Menu → Import → Clipboard**

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

**After importing:**
1. Double-click the **Read File** node → change the file path to your file
2. Double-click the **Upload to Process Link** node → click the pencil icon → enter your **Site ID** and **API Key**
3. Click **Deploy**
4. Click the inject button to upload

---

## Security

- ✅ API keys are stored encrypted by Node-RED
- ✅ All communication uses HTTPS
- ✅ Keys are never logged or exposed in flow exports

## Requirements

- Node-RED >= 2.0.0
- Node.js >= 18.0.0

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/process-link/node-red-contrib-processlink/issues)
- 📧 **Email**: support@processlink.com.au
- 🌐 **Website**: [processlink.com.au](https://processlink.com.au)

## License

[MIT](LICENSE)
