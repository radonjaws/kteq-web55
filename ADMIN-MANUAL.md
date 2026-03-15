# KTEQ Website Admin Manual

**For everyone who manages content on kteq.org**

---

## Who Are You?

This manual covers three levels of access. Find yourself below and focus on the sections that matter to you.

### 🎧 DJ / Admin Panel User

You have a login token for the admin panel at `kteq.org/#/admin`. You can update the schedule, edit shows, write blog posts, and manage the timeline using simple forms.

**Read:** Sections 1, 2, and 3

### 🔧 Programming Director / GitHub Editor

You have a GitHub account with access to the `kteq/kteq-web55` repository. You can do everything an admin panel user can do, plus edit content files directly, upload images, and manage content that the admin panel doesn't cover yet.

**Read:** Sections 1–6

### 🛠️ Station Advisor / Station Leadership

You manage who has access, set up tokens, understand the campaign system, and can make strategic changes to the website's messaging and behavior.

**Read:** Everything, especially Sections 7 and 8

---

## Table of Contents

**For Everyone**
1. [How the Website Works](#1-how-the-website-works)
2. [Using the Admin Panel](#2-using-the-admin-panel)
3. [Content Editing Guide](#3-content-editing-guide)

**For GitHub Editors**
4. [Editing Content on GitHub](#4-editing-content-on-github)
5. [Adding Images](#5-adding-images)
6. [Content File Reference](#6-content-file-reference)

**For Station Leadership**
7. [Managing Access](#7-managing-access)
8. [Campaigns](#8-campaigns)

**Reference**
9. [Formatting with Markdown](#9-formatting-with-markdown)
10. [Troubleshooting](#10-troubleshooting)
11. [Quick Reference](#11-quick-reference)

---

# For Everyone

## 1. How the Website Works

The KTEQ website stores all of its content — the schedule, show listings, blog posts, the 55th anniversary timeline — as files in a GitHub repository. There's no traditional database or CMS.

When content changes, the website automatically rebuilds and goes live in about 60 seconds.

There are two ways to make changes:

- **The Admin Panel** at `kteq.org/#/admin` — a set of simple forms built into the website. This is the primary way most students will manage content.
- **GitHub's Web Editor** — for things the admin panel doesn't cover yet, or for users who are comfortable editing structured text files directly.

Both methods end up doing the same thing: updating files in the repository, which triggers a rebuild.

---

## 2. Using the Admin Panel

### Logging in

1. Go to `kteq.org/#/admin` (or click any admin link)
2. You'll see a login screen asking for a **GitHub token**
3. Enter the station's admin token (get this from the programming director or station advisor)
4. Click **Sign In**

The token is stored in your browser. You won't need to enter it again on the same device unless you clear your browser data or the token expires.

If you see "Invalid token," the token may have expired. Ask the station advisor for a new one.

### The Dashboard

After logging in, you'll see the admin dashboard with links to each content area:

- **Schedule** — edit the weekly programming grid
- **Shows** — manage show listings and descriptions
- **DJs** — manage DJ profiles
- **Timeline** — add entries to the 55th anniversary timeline
- **Blog Posts** — write and publish news and updates
- **Settings** — stream URL, station info, announcement banner, social links
- **Menu** — logo image and nav link visibility (show/hide links for maintenance)
- **Campaigns** — manage campaign configurations; set the active one, edit messaging, phases, and countdown

Click into any section to start editing. Each section loads the current content from the repository, lets you make changes in a form, and saves your changes back with a single click.

### Saving changes

When you click **Save** in any admin editor:

1. Your changes are committed to the repository (like saving a file)
2. The website automatically rebuilds (takes ~60 seconds)
3. Your changes are live on kteq.org

Every save includes a description of what changed, and everything is tracked in version history. If something goes wrong, changes can be reverted.

### A note on editors still being built

The admin panel is being built out in phases. If a section shows "coming soon," that content area can be managed through GitHub's web editor instead (see Section 4). As each editor is completed, it replaces the need to edit files directly.

---

## 3. Content Editing Guide

This section explains what each type of content is and what the fields mean, regardless of whether you're editing through the admin panel or GitHub.

### Schedule

The schedule is a weekly grid of time slots. Each slot has:

| Field | What it means |
|-------|--------------|
| **Time** | Start and end time in 24-hour format (e.g., 14:00 for 2 PM) |
| **Show** | Which show airs in this slot (selected from the show list) |
| **Automation** | Whether this is automated/voice-tracked or a live show |
| **Notes** | Optional text, e.g., "Special guest week" |

Time slots should cover all 24 hours for each day with no gaps.

### Shows

Each show has:

| Field | What it means |
|-------|--------------|
| **Name** | The display name of the show |
| **Slug** | URL-friendly ID (lowercase, hyphens, no spaces). Becomes the web address |
| **Tagline** | Short one-liner shown under the name |
| **Description** | Longer text on the show's dedicated page. Supports Markdown formatting |
| **Genre** | Genre label, e.g., "Punk / Hardcore" |
| **DJs** | Which DJs host this show |
| **Image** | Path to the show's artwork (see Section 5) |
| **Active** | Whether the show is currently airing. Inactive shows are hidden but not deleted |

### DJ Profiles

| Field | What it means |
|-------|--------------|
| **Name** | Display name (can be a DJ name or real name) |
| **Slug** | URL-friendly ID |
| **Bio** | About the DJ. Supports Markdown |
| **Shows** | Which shows they host (should match the show's DJ list) |
| **Year Joined** | When they started at KTEQ |
| **Image** | Path to their photo |
| **Active** | Set to inactive when they graduate or leave (don't delete) |

When adding a DJ to a show, the link needs to be set in both places — the show's DJ list and the DJ's show list.

### Blog Posts

| Field | What it means |
|-------|--------------|
| **Title** | Headline of the post |
| **Slug** | URL-friendly ID. Becomes the web address |
| **Body** | Full content. Supports Markdown (see Section 9) |
| **Excerpt** | Short summary shown in the blog listing. 1-2 sentences |
| **Author** | Who wrote it |
| **Status** | "published" or "draft" — drafts don't appear on the site |
| **Published Date** | When the post goes live |
| **Tags** | Category labels shown on the post |
| **Featured Image** | Optional image path |

### Timeline Entries

The 55th anniversary timeline is a collection of historical moments:

| Field | What it means |
|-------|--------------|
| **Year** | When it happened |
| **Month** | Optional, for sorting within a year |
| **Title** | Short headline |
| **Description** | The story. 2-4 sentences. Supports Markdown |
| **Category** | `milestone`, `music`, `people`, or `technical` |
| **Image** | Path to a historical photo (optional but encouraged) |
| **Media URL** | Link to audio or video (optional) |
| **Sources** | Where the information came from (good practice for historical claims) |

**Category guide:**

- **milestone** — founding, license changes, reopenings, awards, major events
- **music** — concerts, notable bands, genre moments
- **people** — DJs, managers, advisors, community figures
- **technical** — frequency changes, equipment upgrades, studio moves

### Site Settings

Settings are managed by the programming director or station advisor. Most students won't need to change these. The key settings:

| Setting | What it does |
|---------|-------------|
| **Stream URL** | Where the player connects. Don't change unless the stream moves |
| **Banner Text** | Shows an announcement across the top of every page. Empty = hidden |
| **Donate URL** | Where the Donate button links (CARA page) |
| **Social Links** | Facebook, Instagram, TuneIn URLs |

**Menu settings** (via the Menu editor):

| Setting | What it does |
|---------|-------------|
| **Logo URL** | Path to a logo image in the site header. Empty = falls back to the "K" text icon |
| **Nav Links** | Boolean toggle per link (Listen, Schedule, Shows, DJs, History, Blog, Donate). Set to `false` to hide a link during maintenance |

**Campaign settings** (via the Campaigns editor — see Section 8):

Each campaign is a separate configuration. The Campaigns admin shows a list of all campaigns with an **Active** badge on the current one. Use **Set Active** to switch which campaign is driving the site. Use **Edit** or **New Campaign** to manage campaign details.

| Campaign field | What it does |
|----------------|-------------|
| **Campaign Name** | Internal name shown in the admin list, e.g. "(Re)Discover KTEQ" |
| **Slug** | Auto-generated from the name; editable before first save, locked afterward |
| **Hero Image URL** | Background image for the homepage hero. Empty = default gradient |
| **Headline / Subhead** | Campaign messaging. Required for single-phase; per-phase when phases are enabled |
| **Primary / Secondary CTA text** | Button labels. Routing is also configurable (see Section 8) |
| **Campaign Start / End** | Informational date range displayed on the campaigns list |
| **Use Phases** | Toggle to enable multi-phase messaging within one campaign |
| **Phase Advancement** | Manual, Dated, or Rotator — see Section 8 |
| **Countdown Target** | Date (and optional time) to count down to. Clear to hide the countdown |
| **Countdown Label** | Text shown alongside the number, e.g. "days until reopening" |
| **Label Position** | Whether the label appears before or after the day count |

---

# For GitHub Editors

These sections are for students with direct access to the GitHub repository. If you only use the admin panel, you can skip ahead to Section 9.

## 4. Editing Content on GitHub

### Getting started

1. Go to [github.com/kteq/kteq-web55](https://github.com/kteq/kteq-web55)
2. Navigate to the file you want to edit in the `content/` folder
3. Click the pencil icon (edit button) in the top-right of the file view
4. Make your changes
5. Scroll down, type a brief description of what you changed, and click **Commit changes**

The site rebuilds automatically. Your changes are live in about 60 seconds.

### Where content lives

| File | What it controls |
|------|-----------------|
| `content/settings.json` | Active campaign slug, stream URL, banner, social links |
| `content/campaigns/*.json` | Campaign configurations (one file per campaign) |
| `content/schedule.json` | The weekly programming grid |
| `content/shows.json` | Show names, descriptions, genres |
| `content/djs.json` | DJ profiles and bios |
| `content/timeline.json` | 55th anniversary timeline entries |
| `content/posts/*.json` | Blog posts (one file per post) |

Images go in `public/images/` and are organized in subfolders.

### JSON basics

Content files use JSON format. Here are the rules:

```json
{
  "name": "The Deep Cut",
  "genre": "Indie / Eclectic",
  "isActive": true,
  "yearStarted": 2024
}
```

- Text must be in double quotes: `"like this"`
- `true`/`false` and numbers don't get quotes
- Separate items with commas, but **no comma after the last item**
- For quotes inside text, use `\"`. For line breaks, use `\n`

**The #1 thing that will break the site** is a missing or extra comma. GitHub's editor shows a red dot on lines with syntax errors. If you're stuck, paste your JSON into [jsonlint.com](https://jsonlint.com/) to find the error.

### Creating a new blog post

Blog posts are individual files in `content/posts/`. To create one:

1. Navigate to `content/posts/`
2. Click **Add file** → **Create new file**
3. Name it `YYYY-MM-slug.json` (e.g., `2026-04-spring-schedule.json`)
4. Paste this template and fill it in:

```json
{
  "slug": "spring-schedule",
  "title": "Spring 2026 Schedule Is Here",
  "body": "Your post content here. Use \\n for line breaks.\n\n## Markdown headers work\n\nAnd **bold** and *italic* and [links](https://example.com).",
  "excerpt": "A short summary for the blog listing.",
  "featuredImage": "",
  "author": "Your Name",
  "status": "published",
  "publishedAt": "2026-04-01T09:00:00-06:00",
  "tags": ["schedule", "spring-2026"],
  "createdAt": "2026-04-01T09:00:00-06:00",
  "updatedAt": "2026-04-01T09:00:00-06:00"
}
```

Set `"status": "draft"` to save without publishing.

### Deactivating content (don't delete)

When a show ends or a DJ leaves, **don't delete their entry**. Set `"isActive": false` instead. This keeps the content in the archive, prevents broken links, and preserves history.

---

## 5. Adding Images

Images live in `public/images/`, organized by type:

| Folder | What goes here |
|--------|---------------|
| `public/images/shows/` | Show artwork |
| `public/images/djs/` | DJ headshots |
| `public/images/timeline/` | Historical photos |
| `public/images/posts/` | Blog post images |
| `public/images/brand/` | Station logos and branding |

### Uploading

1. Navigate to the appropriate folder in GitHub
2. Click **Add file** → **Upload files**
3. Drag and drop your images
4. Write a commit message and click **Commit changes**

### Naming

Use lowercase, hyphens, no spaces:

- ✅ `deep-cut-cover.jpg`
- ❌ `Deep Cut Cover.jpg`

### Size guidelines

- **Format:** JPG for photos, PNG for logos/graphics
- **Max size:** Under 500 KB. Resize large photos before uploading — 1200px wide is plenty
- **Resize tool:** [Squoosh](https://squoosh.app/) (free, web-based, no install)

### Referencing in content

After uploading, use the path starting with `/images/`:

```json
"image": "/images/timeline/1993-green-day.jpg"
```

Note: the path starts with `/images/`, not `public/images/`.

---

## 6. Content File Reference

Detailed schemas for each content file. Refer to this when editing JSON directly.

### schedule.json

Each day contains an array of time slots:

```json
{
  "id": "mon-1000",
  "startTime": "10:00",
  "endTime": "12:00",
  "showSlug": "the-deep-cut",
  "isAutomation": false,
  "notes": ""
}
```

- `id`: unique, use the pattern `day-time` (e.g., `"fri-1400"`)
- Times use 24-hour format. Midnight = `"00:00"`. Don't use `"24:00"`
- `showSlug` must exactly match a slug in `shows.json`
- Update `lastUpdated` and `updatedBy` at the top of the file

### shows.json

```json
{
  "slug": "the-deep-cut",
  "name": "The Deep Cut",
  "tagline": "Digging deeper than the algorithm ever will",
  "description": "Longer description, supports Markdown.",
  "djSlugs": ["alex-r"],
  "image": "/images/shows/deep-cut.jpg",
  "genre": "Eclectic / Indie",
  "isActive": true,
  "isAutomation": false,
  "socialLinks": { "instagram": "", "playlist": "" }
}
```

- `slug` must be unique and is used in schedule.json and in URLs
- `djSlugs` must match slugs in djs.json
- `isAutomation` is only `true` for the main KTEQ Automation entry

### djs.json

```json
{
  "slug": "alex-r",
  "name": "Alex R.",
  "bio": "Bio text, supports Markdown.",
  "image": "/images/djs/alex-r.jpg",
  "showSlugs": ["the-deep-cut"],
  "yearJoined": 2024,
  "isActive": true,
  "socialLinks": { "instagram": "" }
}
```

- `showSlugs` must match slugs in shows.json (two-way link)

### timeline.json

```json
{
  "id": "1971-first-broadcast",
  "year": 1971,
  "month": 8,
  "title": "KTEQ Touches the Airwaves",
  "description": "Description text, supports Markdown.",
  "image": "/images/timeline/1971-founding.jpg",
  "mediaUrl": "",
  "category": "milestone",
  "sources": "The Aldrich Report"
}
```

- `id`: unique, use `year-short-description`
- `month` is optional (1-12), helps sort within a year
- `category` must be: `"milestone"`, `"music"`, `"people"`, or `"technical"`

### settings.json (selected fields)

```json
{
  "activeCampaign": "rediscover-2026",
  "streamUrl": "https://kteq-proxy.kteq.workers.dev",
  "streamFallbackUrl": "http://kteq-streamer.sdsmt.edu:8000/kteq",
  "stationName": "KTEQ-FM 91.3",
  "bannerText": "",
  "bannerUrl": "",
  "bannerDismissible": true,
  "logoUrl": "",
  "navLinks": {
    "listen": true,
    "schedule": true,
    "shows": true,
    "djs": true,
    "history": true,
    "blog": true,
    "donate": true
  }
}
```

- `activeCampaign`: slug of the active campaign file in `content/campaigns/`. Changing this switches everything the campaign controls (phase, hero, countdown)
- `logoUrl`: path starting with `/images/brand/`. Empty string = "K" text fallback
- `navLinks`: set any value to `false` to hide that link sitewide (useful during maintenance)

### Campaign files (content/campaigns/*.json)

**Single-phase campaign:**

```json
{
  "slug": "rediscover-2026",
  "name": "(Re)Discover KTEQ",
  "heroImage": "",
  "headline": "Still Here. Still Weird.",
  "subhead": "55 years of alternative radio in the Black Hills",
  "ctaPrimary": "Share Your Memories",
  "ctaPrimaryAction": "mailto",
  "ctaPrimaryRoute": "",
  "ctaSecondary": "Listen Now",
  "ctaSecondaryRoute": "/listen",
  "campaignStart": "2026-03-01T00:00:00-06:00",
  "campaignEnd": "2026-12-31T23:59:59-06:00",
  "scheduleType": "manual",
  "phases": [],
  "activePhaseIndex": 0,
  "rotatorValue": 7,
  "rotatorUnit": "days",
  "rotatorMode": "each",
  "countdownTarget": "2026-09-25T18:00:00-06:00",
  "countdownLabel": "days until reopening",
  "countdownLabelPosition": "after"
}
```

**Multi-phase campaign (dated):**

```json
{
  "slug": "kteqlive-2026",
  "name": "KTEQ Live 2026",
  "heroImage": "",
  "campaignStart": "2026-08-15T00:00:00-06:00",
  "campaignEnd": "2026-10-01T00:00:00-06:00",
  "scheduleType": "dated",
  "phases": [
    {
      "name": "Back to School",
      "headline": "Welcome Back!",
      "subhead": "Live from the Black Hills — KTEQ returns to the studio",
      "ctaPrimaryText": "Listen Live",
      "ctaPrimaryAction": "play",
      "ctaPrimaryRoute": "",
      "ctaSecondaryText": "Our History",
      "ctaSecondaryRoute": "/history",
      "phaseEnd": "2026-09-24T23:59:59-06:00"
    },
    {
      "name": "Reopening",
      "headline": "We're Back.",
      "subhead": "KTEQ-FM 91.3 — Live from Rapid City",
      "ctaPrimaryText": "Listen Now",
      "ctaPrimaryAction": "play",
      "ctaPrimaryRoute": "",
      "ctaSecondaryText": "Explore Our History",
      "ctaSecondaryRoute": "/history",
      "phaseEnd": "2026-10-01T00:00:00-06:00"
    }
  ],
  "activePhaseIndex": 0,
  "rotatorValue": 7,
  "rotatorUnit": "days",
  "rotatorMode": "each",
  "countdownTarget": "2026-09-25T18:00:00-06:00",
  "countdownLabel": "days until reopening",
  "countdownLabelPosition": "after"
}
```

Key fields:
- `slug`: must match the filename stem (e.g., `rediscover-2026.json` → `"slug": "rediscover-2026"`)
- `ctaPrimaryAction`: `"play"` (starts stream), `"mailto"` (opens station email), `"route"` (navigates to a site page)
- `ctaPrimaryRoute`: used when action is `"route"` — a site path like `"/listen"` or `"/history"`
- `scheduleType`: `"manual"`, `"dated"`, or `"rotator"` — ignored when `phases` is empty
- `phases[].ctaPrimaryText` / `phases[].ctaSecondaryText`: note the `Text` suffix when inside a phase object (different from root-level `ctaPrimary`/`ctaSecondary`)
- `phases[].phaseEnd`: ISO 8601 timestamp; only meaningful in `"dated"` mode
- `activePhaseIndex`: which phase is currently shown in `"manual"` mode; updated by the list screen controls
- `countdownTarget`: ISO 8601 in Mountain Time. Clear to hide the countdown
- `countdownLabelPosition`: `"before"` or `"after"` the day number

### Blog post files (content/posts/*.json)

```json
{
  "slug": "welcome-back",
  "title": "Post Title",
  "body": "Full content in Markdown. Use \\n for line breaks.",
  "excerpt": "Short summary for listing page.",
  "featuredImage": "/images/posts/photo.jpg",
  "author": "Name",
  "status": "published",
  "publishedAt": "2026-04-01T09:00:00-06:00",
  "tags": ["tag1", "tag2"],
  "createdAt": "2026-04-01T09:00:00-06:00",
  "updatedAt": "2026-04-01T09:00:00-06:00"
}
```

- Filename pattern: `YYYY-MM-slug.json`
- `status`: `"published"` or `"draft"` (drafts are hidden from the site)
- `publishedAt` format: `"2026-04-01T09:00:00-06:00"` (the `-06:00` is Mountain Time)

---

# For Station Leadership

## 7. Managing Access

There are two types of access to manage: GitHub repository access (for direct file editing) and admin panel tokens (for the web-based editors).

### GitHub repository access

Students who need to edit content files directly, upload images, or manage the repository need a GitHub account added as a collaborator.

**To add a collaborator:**

1. Go to [github.com/kteq/kteq-web55](https://github.com/kteq/kteq-web55) → **Settings** → **Collaborators**
2. Click **Add people**
3. Search for their GitHub username
4. Select **Write** role (they need to be able to commit changes)

**When someone leaves the station:** Remove them from the collaborators list. Their past contributions remain in the commit history.

GitHub editors are typically the programming director, station manager, and any students comfortable working with structured text files. Most DJs won't need this level of access.

### Admin panel tokens

The admin panel at `kteq.org/#/admin` uses a GitHub Personal Access Token (PAT) to authenticate. This is a single shared token for the station — anyone who has it can use the admin panel.

**To create or regenerate a token:**

1. Go to [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
   (You must be logged into an account that has access to the repository)
2. **Token name:** `KTEQ Admin Panel` (or similar)
3. **Expiration:** 90 days is a reasonable balance of security and convenience. You'll need to regenerate when it expires
4. **Repository access:** Select **Only select repositories** → choose `kteq/kteq-web55`
5. **Permissions → Repository permissions → Contents:** Set to **Read and write** (this is the only permission needed)
6. Click **Generate token**
7. Copy the `github_pat_...` string — this is the admin panel login

**Distributing the token:** Share it with students who need admin panel access. They enter it once at `kteq.org/#/admin/login` and it's stored in their browser.

**When a student leaves on bad terms:** Regenerate the token. This instantly revokes access for anyone using the old token. Distribute the new token to remaining staff.

**When a token expires:** Regenerate it following the same steps and distribute the new one.

### Who gets what access

| Role | Admin Panel | GitHub Repo | What they can do |
|------|:-----------:|:-----------:|-----------------|
| DJs | ✅ | — | Update schedule, edit their show/profile, write blog posts |
| Programming Director | ✅ | ✅ | Everything above, plus upload images, edit JSON directly, manage content the admin panel doesn't cover |
| Station Manager | ✅ | ✅ | Same as Programming Director |
| Station Advisor | ✅ | ✅ | Everything above, plus manage collaborators, regenerate tokens, change campaign phases, make code changes via Claude Code |

---

## 8. Campaigns

### What campaigns are

The KTEQ website has a **campaign system** that changes the homepage messaging, calls-to-action, countdown timer, and overall tone — all without touching any code. Think of it like seasonal programming for the website.

Each campaign is a configuration file in `content/campaigns/`. One campaign is designated **active** at any time; it drives everything the visitor sees on the homepage: the headline, subhead, CTA buttons, and the countdown (if any).

This matters because the website needs to do different jobs at different times. During an alumni outreach effort, the site should invite people to reconnect. During a grand reopening, it should build excitement. During normal operations, it should get out of the way and let people listen. Creating a new campaign — and activating it — handles all of this without code changes.

### How campaigns work in the admin panel

Go to **Campaigns** in the admin dashboard. You'll see:

- A list of all campaign files with an **active** badge on the current one
- **Set Active** — click to make any campaign the live one. The switch takes ~60 seconds to deploy
- **Edit →** — opens the campaign editor for that entry
- **New Campaign** — creates a new campaign file

Each campaign has:
1. **Campaign Settings** — name (internal only), slug, hero image URL, headline, subhead, CTA text. Headline, subhead, and CTA are optional; leave any empty to use the campaign defaults. Slug is auto-generated from the name and can be edited before the first save, but is locked after creation. When phases are enabled (see below), these text fields appear inside phase tabs instead.
2. **Phase Schedule** — campaign start/end dates (informational context); optional phase system for multi-messaging campaigns.
3. **Countdown** (optional, last) — target date/time, label text, label position.

### Phase Schedule

Each campaign can run as a **single-phase** campaign (one set of messaging for the whole run) or as a **multi-phase** campaign (different messaging at different times). Toggle **Use Phases** in the Phase Schedule panel to enable multi-phase mode.

**Phase tab system**

When phases are enabled, the Campaign Settings panel shows a tab row — one tab per phase plus a **+ Add phase** button. Each phase tab has its own name, headline, subhead, and CTA fields. The phase name is admin-only (used as the tab label; not shown publicly).

**Phase advancement modes** (chosen in the Phase Schedule panel when phases are enabled):

| Mode | How it works |
|------|-------------|
| **Manual** | Phases advance only when you click the phase controls on the Campaigns list. Useful when you want intentional control over timing. |
| **Dated** | Each phase runs until its **Phase Ends On** date/time passes, then the next phase begins automatically — all computed client-side, no deploys needed. The last phase holds indefinitely once all end dates have passed. |
| **Rotator** | Phases cycle on a fixed schedule computed from the campaign start date. No end dates needed. Two sub-modes: **Show each phase for [N] [unit]** sets the per-phase duration; **Full cycle repeats every [N] [unit]** divides the total cycle duration equally across phases. |

**Dated mode notes:** If you set phase end dates out of order, they are automatically sorted on save and a notice appears. If you're editing a dated campaign where all end dates are already in the past, an informational note tells you the last phase is holding — this is a normal state for a campaign that has run its course.

**Manual phase advancement** (Campaigns list)

For active campaigns with manual phases, the Campaigns list shows the current phase indicator and controls: **‹** and **›** buttons to step back and forward one phase, plus clickable phase dots to jump directly to any phase. Changes commit to the repository and rebuild the site (~60 seconds).

### Campaign dates

**Campaign Start** and **Campaign End** are stored on the campaign but are informational only — they appear on the Campaigns list for context and are used as the origin point for rotator calculations. They do not automatically activate or deactivate a campaign.

### Adding a new campaign

1. Go to **Campaigns** → **New Campaign**
2. Enter a name — the slug is auto-generated (e.g., "KTEQ Live 2026" → `kteqlive-2026`)
3. Set campaign start/end dates if useful
4. If this campaign needs multiple messaging phases, toggle **Use Phases** and configure each tab
5. Set the countdown if one applies
6. Click **Create Campaign**
7. Back on the list, click **Set Active** when you're ready to go live

You can create and configure a future campaign in advance without activating it — useful for setting up a phase transition ahead of time.

### Activating a campaign

On the **Campaigns** list, click **Set Active** next to the campaign you want to make live. This saves `activeCampaign` in `settings.json` and triggers a rebuild. The site switches in ~60 seconds.

The previously active campaign is not deleted — it stays in the list and can be re-activated at any time.

### Deleting a campaign

Open the campaign via **Edit →**. A **Delete campaign** link appears at the bottom of the form. Deletion is blocked if the campaign is currently active — activate a different campaign first.

Deleted campaigns are gone from the file system. If you need to recover one, it can be restored from the repository's commit history.

---

# Reference

## 9. Formatting with Markdown

Several content fields support **Markdown** — a simple way to add formatting. This works in show descriptions, DJ bios, blog post bodies, and timeline descriptions.

| What you type | What it looks like |
|---------------|-------------------|
| `**bold text**` | **bold text** |
| `*italic text*` | *italic text* |
| `[link text](https://url.com)` | a clickable link |
| `# Big Heading` | A large heading |
| `## Smaller Heading` | A medium heading |

### Lists

```
- First item
- Second item
- Third item
```

### Line breaks in JSON

In JSON strings, use `\n` for line breaks:

```json
"description": "First paragraph.\n\nSecond paragraph."
```

Two `\n\n` = paragraph break. One `\n` = line break.

---

## 10. Troubleshooting

### The site didn't update after my edit

- Changes take ~60 seconds. Wait and refresh.
- Check the GitHub Actions tab in the repository. A red X means the build failed, usually due to a JSON syntax error.

### JSON syntax error

- GitHub's editor highlights errors with a red dot
- Paste your JSON into [jsonlint.com](https://jsonlint.com/) to find the exact line
- Most common: extra comma after the last item in a list, or an unclosed quote

### A show doesn't appear on the schedule

- Check the slug in `shows.json` exactly matches the `showSlug` in `schedule.json` (case-sensitive)
- Check that `"isActive": true` is set

### An image doesn't show up

- Path should start with `/images/`, not `public/images/`
- Filename must match exactly, including case and extension

### The player says "Stream unavailable"

- The stream or proxy is probably down — not a website issue
- Try the TuneIn link to verify
- Contact the station advisor if the stream itself is working

### Admin panel says "Invalid token"

- The token may have expired — ask the station advisor to regenerate it
- Make sure the token was generated with **Contents: Read and write** permission for the correct repository

### I need to undo a change

- In the repository, click **commits** near the top
- Find the bad commit → click it → **"..."** menu → **Revert changes**

### I need help

- **Station advisor** — website and technical questions
- **Programming director** — schedule and show content questions

---

## 11. Quick Reference

### Date format

```
2026-04-15T14:00:00-06:00
```

April 15, 2026 at 2:00 PM Mountain Time. The `-06:00` is the MDT timezone offset.

### Slug format

URL-safe identifiers: all lowercase, hyphens instead of spaces, no special characters.

Examples: `the-deep-cut`, `alex-r`, `spring-schedule-2026`, `1971-first-broadcast`

### Content file quick links

- [Settings](https://github.com/kteq/kteq-web55/blob/main/content/settings.json)
- [Campaigns](https://github.com/kteq/kteq-web55/tree/main/content/campaigns)
- [Schedule](https://github.com/kteq/kteq-web55/blob/main/content/schedule.json)
- [Shows](https://github.com/kteq/kteq-web55/blob/main/content/shows.json)
- [DJs](https://github.com/kteq/kteq-web55/blob/main/content/djs.json)
- [Timeline](https://github.com/kteq/kteq-web55/blob/main/content/timeline.json)
- [Blog posts](https://github.com/kteq/kteq-web55/tree/main/content/posts)
- [Images](https://github.com/kteq/kteq-web55/tree/main/public/images)
