# @processlink/node-red-contrib-processlink

Node-RED nodes for Process Link platform integration.

## Available Nodes

| Node | Category | Description |
|------|----------|-------------|
| **files upload** | Process Link | Upload files to Process Link Files API |

*More nodes coming soon: mail, downtime, notes*

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

1. **Get your credentials** from your Process Link app:
   - Go to **Settings → API Keys**
   - Click **Generate API Key**
   - Copy the **Site ID** and **API Key**

2. **Add a node** to your flow:
   - Find nodes in the palette under "Process Link"
   - Drag one into your flow

3. **Configure credentials**:
   - Double-click the node
   - Click the pencil icon next to "Config"
   - Enter your **Site ID** and **API Key**
   - Click **Add**, then **Done**

## Node Reference

### Files Upload

Uploads files to the Process Link Files API.

#### Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | Buffer \| string | The file content to upload |
| `msg.filename` | string | (Optional) Filename to use |

#### Outputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | object | API response with `ok`, `file_id`, `created_at` |
| `msg.file_id` | string | The UUID of the uploaded file |
| `msg.statusCode` | number | HTTP status code (201 on success) |

#### Status Indicators

- Yellow: Uploading in progress
- Green: Upload successful
- Red: Error occurred

## Example Flow

Upload a file from disk:

```
[File In] → [files upload] → [Debug]
```

1. Configure a **File In** node to read your file
2. Connect it to the **files upload** node
3. Add a **Debug** node to see the result
4. Configure the upload node with your Site ID and API Key

### Dynamic Filename

Set the filename dynamically in a Function node:

```javascript
msg.filename = "report-" + new Date().toISOString().split('T')[0] + ".csv";
return msg;
```

## Error Handling

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 201 | Success | File uploaded successfully |
| 400 | Bad Request | Check that payload is a valid file buffer |
| 401 | Unauthorized | Check your API key is correct |
| 403 | Forbidden | Enable API access in site settings |
| 404 | Not Found | Check your Site ID is correct |
| 429 | Rate Limited | Slow down - max 30 uploads/minute per site |
| 507 | Storage Full | Contact your administrator to increase storage |

## Rate Limits

The API allows **30 uploads per minute** per site. If you exceed this limit, you'll receive a 429 status code. The node will still output the message so you can implement retry logic in your flow.

## Security

- API keys are stored encrypted by Node-RED
- All communication uses HTTPS
- Keys are never logged or exposed in flow exports

## Support

- **Issues**: [GitHub Issues](https://github.com/process-link/node-red-contrib-processlink/issues)
- **Email**: support@processlink.com.au

## License

MIT
