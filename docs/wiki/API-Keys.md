# API Keys

API keys allow external applications and scripts to interact with Owly's REST API programmatically. They are managed from the "API Keys" tab on the Admin page.

---

## Purpose

API keys provide authentication for the Owly REST API without requiring a user session. Common use cases include:

- Sending messages to the AI chat endpoint from your own application or website.
- Integrating Owly with third-party platforms (CRM systems, helpdesk tools, custom dashboards).
- Automating knowledge base updates through scripts or CI/CD pipelines.
- Pulling analytics and conversation data into external reporting tools.
- Building custom chatbot widgets that communicate with Owly's backend.

---

## Generating a New Key

1. Navigate to the Admin page from the sidebar.
2. Switch to the "API Keys" tab.
3. Click the "Generate Key" button.
4. Enter a descriptive name for the key (e.g., "Website Chat Widget", "CRM Integration", "Analytics Export Script").
5. Click "Create".

The full API key is displayed **only once** immediately after creation. Copy it and store it securely. Once you close the dialog or navigate away, the key is masked and cannot be retrieved again.

> **Important**: If you lose an API key, you must generate a new one and update all applications that use the old key. There is no way to recover or reveal the full key after the initial display.

---

## Key Format

All Owly API keys follow a consistent format:

```
owly_<64-character-hex-string>
```

Example:

```
owly_a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

The `owly_` prefix makes it easy to identify Owly API keys in configuration files and environment variables. The key is generated using 32 cryptographically random bytes encoded as hexadecimal, providing 256 bits of entropy.

---

## Managing Keys

### Viewing Keys

The API Keys list displays all generated keys with the following information:

| Column | Description |
|--------|-------------|
| **Name** | The descriptive name assigned during creation. |
| **Key** | A masked version showing only the last 8 characters, preceded by asterisks. |
| **Status** | Whether the key is active or inactive. |
| **Last Used** | The timestamp of the most recent API request using this key (if any). |
| **Created** | The date the key was generated. |

### Activating and Deactivating Keys

Each key has a toggle to activate or deactivate it. Deactivated keys will be rejected by the API with a `401 Unauthorized` response. This is useful for:

- Temporarily disabling access for a specific integration without deleting the key.
- Rotating keys by deactivating the old key after deploying the new one.
- Responding to a suspected key compromise by immediately disabling access.

### Deleting Keys

Click the trash icon next to a key and confirm the deletion. Deleted keys are permanently removed and cannot be recovered. Any application using the deleted key will immediately lose API access.

---

## Using Keys in API Requests

Include the API key in the `X-API-Key` HTTP header with every request:

```bash
curl -X POST https://your-owly-domain/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: owly_your_api_key_here" \
  -d '{"message": "Hello, I need help with my order"}'
```

### JavaScript Example

```javascript
const response = await fetch("https://your-owly-domain/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "owly_your_api_key_here",
  },
  body: JSON.stringify({
    message: "Hello, I need help with my order",
  }),
});

const data = await response.json();
console.log(data.response);
```

### Python Example

```python
import requests

response = requests.post(
    "https://your-owly-domain/api/chat",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "owly_your_api_key_here",
    },
    json={"message": "Hello, I need help with my order"},
)

data = response.json()
print(data["response"])
```

---

## Security Best Practices

1. **Never commit API keys to version control.** Use environment variables or secret management tools instead.

2. **Use descriptive names.** Name each key after its purpose so you can easily identify which application uses which key.

3. **Rotate keys regularly.** Generate a new key, update your application, then deactivate the old key.

4. **Use one key per application.** If one key is compromised, you only need to rotate that specific key without affecting other integrations.

5. **Monitor the "Last Used" timestamp.** If a key that should be inactive shows recent usage, investigate immediately.

6. **Deactivate before deleting.** When rotating keys, deactivate the old key first and verify that your application works with the new key before deleting the old one.

7. **Restrict network access.** If possible, deploy Owly behind a reverse proxy or firewall that limits API access to known IP addresses.

8. **Use HTTPS exclusively.** API keys sent over unencrypted HTTP connections can be intercepted. Always use HTTPS in production.
