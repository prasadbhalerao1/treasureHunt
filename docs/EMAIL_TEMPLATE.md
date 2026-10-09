# Login Email via Make.com

When an admin adds a team (**Admin → User Management → Add**), the backend POSTs the team's login details to your Make.com webhook, and Make sends the email. The ready-to-paste HTML is [email_template.html](email_template.html).

## 1. Backend settings

```
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/<your-webhook-id>
FRONTEND_URL=https://<your-frontend>.vercel.app      # the login link in the email
```

If the webhook is missing or fails, the team is still created and the admin sees *"the email was NOT sent… Share the credentials manually."*

## 2. Make scenario

Two modules: **Webhooks → Custom webhook** (module 1), then **Email** (Gmail / Outlook / SMTP, module 2).

1. In the webhook module click *Add*, copy the URL into `MAKE_WEBHOOK_URL`.
2. Create a team once from the admin so Make learns the fields (*Redetermine data structure* if you changed it earlier).
3. In the email module:

| Field | Value |
| :-- | :-- |
| To | `{{1.to}}` |
| Subject | `{{1.subject}}` |
| Content type | HTML |
| Content | paste the whole of [email_template.html](email_template.html) |

If your webhook is not module 1, replace `{{1.` with your module number (find and replace in the pasted HTML).

## 3. Fields the backend sends

| Field | Example |
| :-- | :-- |
| `teamId` | `PAC-3F2A` |
| `name` | `Packet Pirates` (the team lead / team name) |
| `email` / `to` | `lead@college.edu` (the team lead's email) |
| `password` | the password the admin typed |
| `eventName` | `TraceRoute` (from Settings) |
| `tagline` | `Follow the hops. Reach the destination.` |
| `totalLevels` | `7` |
| `loginUrl` | your `FRONTEND_URL` |
| `subject` | `Your TraceRoute login` |

The route and the questions are deliberately **not** sent.

The email is text only (no images). `loginUrl` is used for the login button and link, so set `FRONTEND_URL` to your deployed frontend.

## 4. Test it

Create a team using your own email, check the inbox (and spam), log in with the credentials, then delete the team.
