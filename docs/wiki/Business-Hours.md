# Business Hours

## Overview

The Business Hours configuration defines when your support team is available to handle customer inquiries. When enabled, the system tracks your current operating status (open or closed) based on the configured schedule and timezone, and displays an appropriate offline message to customers who reach out outside of business hours.

![Business Hours](../screenshots/08-business-hours.png)
*The Business Hours page showing the current status indicator, enable toggle, timezone selector, weekly schedule configuration, and offline message editor.*

---

## Enabling and Disabling Business Hours

Business hours are disabled by default. When disabled, the system does not enforce any schedule and no offline messages are shown to customers.

### How to Enable

1. Navigate to **Business Hours** in the sidebar.
2. Locate the **Business Hours** toggle card.
3. Click the toggle switch to turn business hours **on**.
4. Configure your timezone, weekly schedule, and offline message.
5. Click **Save Changes**.

### How to Disable

1. Navigate to **Business Hours** in the sidebar.
2. Click the toggle switch to turn business hours **off**.
3. Click **Save Changes**.

When disabled, the status preview banner will display "Support is disabled" and the system will not enforce any schedule-based behavior.

---

## Setting the Timezone

The timezone setting determines how the system interprets your weekly schedule. All open/close times are evaluated in the selected timezone, regardless of the server's system timezone or the customer's location.

### Configuration

1. In the Business Hours page, find the **Timezone** section.
2. Select your timezone from the dropdown menu.
3. Click **Save Changes**.

### Available Timezones

The system supports a comprehensive set of global timezones:

| Region | Timezones |
|--------|-----------|
| **UTC** | UTC |
| **Americas** | America/New\_York, America/Chicago, America/Denver, America/Los\_Angeles, America/Anchorage, Pacific/Honolulu, America/Sao\_Paulo, America/Argentina/Buenos\_Aires |
| **Europe** | Europe/London, Europe/Paris, Europe/Berlin, Europe/Moscow |
| **Africa** | Africa/Cairo, Africa/Lagos |
| **Asia** | Asia/Dubai, Asia/Kolkata, Asia/Bangkok, Asia/Shanghai, Asia/Tokyo, Asia/Seoul |
| **Oceania** | Australia/Sydney, Pacific/Auckland |

> **Important:** Make sure to select the timezone where your support team operates, not your server's timezone. The system uses the `Intl.DateTimeFormat` API to correctly determine the current day and time in the selected timezone.

---

## Configuring the Weekly Schedule

The weekly schedule allows you to set specific open and close times for each day of the week independently.

### Default Schedule

When business hours are first enabled, the default schedule is:

| Day | Status | Hours |
|-----|--------|-------|
| Monday | Open | 09:00 - 18:00 |
| Tuesday | Open | 09:00 - 18:00 |
| Wednesday | Open | 09:00 - 18:00 |
| Thursday | Open | 09:00 - 18:00 |
| Friday | Open | 09:00 - 18:00 |
| Saturday | Closed | -- |
| Sunday | Closed | -- |

### Configuring Individual Days

Each day in the schedule has three elements:

1. **Day label:** The name of the day (Monday through Sunday).
2. **Toggle switch:** Click to enable or disable the day. When disabled, the day is marked as "Closed."
3. **Time selectors:** Two dropdown menus for the opening time and closing time. Time options are available in 30-minute increments from 00:00 to 23:30.

### To Open a Closed Day

1. Find the day in the weekly schedule.
2. Click the toggle switch next to the day name. It will switch from gray (closed) to active (open).
3. The default hours 09:00 - 18:00 will be applied. Adjust the opening and closing times as needed.

### To Close an Open Day

1. Find the day in the weekly schedule.
2. Click the toggle switch. The day will be marked as "Closed" and the time selectors will disappear.

### To Change Hours for a Day

1. Ensure the day is toggled on (open).
2. Use the first dropdown to select the **opening time**.
3. Use the second dropdown to select the **closing time**.
4. Click **Save Changes** when finished.

### Time Format

All times are displayed and stored in 24-hour format (HH:mm). The internal storage format is a hyphen-separated range: `HH:mm-HH:mm` (e.g., `09:00-18:00`). An empty string indicates the day is closed.

### Validation

The system validates that time values conform to the `HH:mm-HH:mm` pattern. If an invalid format is submitted, the API returns an error message specifying which day has the incorrect format.

---

## Offline Message Customization

The offline message is displayed to customers who contact your support outside of business hours. This message sets expectations and lets customers know when they can expect a response.

### Configuration

1. In the Business Hours page, find the **Offline Message** section.
2. Edit the text in the message field.
3. Click **Save Changes**.

### Default Message

The default offline message is:

> We are currently offline. We will get back to you during business hours.

### Writing an Effective Offline Message

Consider including the following in your offline message:

| Element | Example |
|---------|---------|
| Acknowledgment | "Thank you for reaching out." |
| Current status | "Our team is currently offline." |
| Expected response time | "We will respond within 1 business hour." |
| Business hours | "Our hours are Monday to Friday, 9 AM to 6 PM EST." |
| Emergency contact | "For urgent matters, please call +1-555-000-0000." |
| Self-service | "In the meantime, check our FAQ at yourcompany.com/faq." |

---

## How Business Hours Affect AI Responses

When business hours are enabled, the system's behavior changes depending on whether the current time falls within the configured schedule:

### During Business Hours (Open)

- The AI responds normally to all incoming messages across all channels.
- No offline message is prepended or appended to responses.
- The status indicator shows **Open** with the closing time.

### Outside Business Hours (Closed)

- The configured offline message can be delivered to customers who send messages.
- The AI may still process messages (depending on your configuration), but customers are informed of the operating schedule.
- The status indicator shows **Closed** with the next opening time.

### When Business Hours Are Disabled

- The system operates without any schedule enforcement.
- No offline messages are shown.
- The status indicator shows "Support is disabled."

---

## How the Status Indicator Works

The Business Hours page displays a real-time status indicator at the top of the page. This indicator uses the configured timezone and weekly schedule to determine the current operating state.

### Status Calculation

The system performs the following steps to determine the current status:

1. Gets the current date and time.
2. Converts it to the configured timezone using `Intl.DateTimeFormat`.
3. Extracts the current weekday (Monday through Sunday) and the current time in HH:mm format.
4. Looks up the schedule for the current weekday.
5. If the day is closed (empty schedule), the status is **Closed today**.
6. If the day is open, compares the current time against the opening and closing times:
   - If the current time is within the range, the status is **Open now (until HH:mm)**.
   - If the current time is outside the range, the status is **Closed (opens at HH:mm)**.

### Visual Indicators

| Status | Background Color | Icon | Text Color |
|--------|-----------------|------|------------|
| **Open** | Green background | Checkmark | Green |
| **Closed** | Amber/yellow background | Warning triangle | Amber |

The status indicator updates automatically when the page is loaded. To see an updated status after the schedule transitions (e.g., from open to closed), refresh the page.

---

## Saving Configuration

All business hours settings (enabled state, timezone, weekly schedule, offline message) are saved together when you click the **Save Changes** button.

After a successful save:
- A green "Changes saved" confirmation appears briefly.
- The configuration is stored in the database and takes effect immediately.
- The status indicator recalculates based on the updated schedule.

The system uses an upsert operation, meaning the first save creates the configuration record and subsequent saves update it.

---

## API Details

### Data Storage

Business hours configuration is stored as a single record with the ID `default` in the `BusinessHours` table. The schema includes:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | `"default"` | Fixed identifier |
| `enabled` | Boolean | `false` | Whether business hours are active |
| `timezone` | String | `"UTC"` | IANA timezone identifier |
| `monday` through `sunday` | String | `"09:00-18:00"` or `""` | Time range or empty for closed |
| `offlineMessage` | String | *(default message)* | Message for offline periods |

### Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/business-hours` | Retrieves the current business hours configuration. Creates a default record if none exists. |
| `PUT` | `/api/business-hours` | Updates the business hours configuration. Validates time format before saving. |

---

## Best Practices

1. **Set the correct timezone first.** Incorrect timezone configuration will cause the open/closed status to display incorrectly and offline messages to trigger at the wrong times.

2. **Match your actual team availability.** Set business hours to reflect when your team genuinely monitors conversations, not aspirational hours.

3. **Keep the offline message concise.** Customers want to know when they will get a response. Include the essential information without excessive detail.

4. **Consider global customers.** If your customers span multiple timezones, mention your business hours in the offline message using a widely understood timezone reference (e.g., "9 AM to 6 PM EST").

5. **Update for holidays and special events.** Before holidays or planned downtime, adjust your schedule or update your offline message to reflect the temporary change. Remember to revert after the event.

6. **Coordinate with SLA rules.** Ensure your SLA targets are realistic given your business hours. A 1-hour first response SLA is only achievable during the hours your team is available.

---

## Related Pages

- [SLA Rules](SLA-Rules) -- Set response time targets that work alongside business hours
- [Automation Rules](Automation-Rules) -- Create rules for offline message handling
- [Channel Setup](Channel-Setup) -- Configure channels that respect business hours
- [Conversations and Inbox](Conversations-and-Inbox) -- Monitor conversations during and outside business hours
