# KTEQ Website Admin Manual

**For station staff managing content on kteq.org**

Welcome to the KTEQ website content management guide. This manual explains how to update the schedule, add shows, write blog posts, manage the 55th anniversary timeline, and handle images — all without needing to know how to code.

---

## Table of Contents

1. [How the Website Works](#1-how-the-website-works)
2. [Getting Access](#2-getting-access)
3. [Editing Content on GitHub](#3-editing-content-on-github)
4. [Managing the Schedule](#4-managing-the-schedule)
5. [Managing Shows](#5-managing-shows)
6. [Managing DJ Profiles](#6-managing-dj-profiles)
7. [Writing Blog Posts](#7-writing-blog-posts)
8. [Managing the Timeline](#8-managing-the-timeline)
9. [Site Settings](#9-site-settings)
10. [Adding Images](#10-adding-images)
11. [Formatting with Markdown](#11-formatting-with-markdown)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. How the Website Works

The KTEQ website doesn't use a traditional database or content management system. Instead, **all content lives as files in the GitHub repository**. When you edit a file and save it, GitHub automatically rebuilds the website. Your changes go live in about 60 seconds.

This means:

- Every change is tracked with version history (so nothing is ever permanently lost)
- You can see who changed what and when
- If something breaks, it can be rolled back to a previous version
- No separate login or CMS to manage — it's all in GitHub

### Where content lives

All editable content is in the `content/` folder:

| File | What it controls |
|------|-----------------|
| `content/settings.json` | Stream URL, campaign phase, banner, social links |
| `content/schedule.json` | The weekly programming grid |
| `content/shows.json` | Show names, descriptions, genres |
| `content/djs.json` | DJ profiles and bios |
| `content/timeline.json` | 55th anniversary timeline entries |
| `content/posts/*.json` | Blog posts (one file per post) |

Images go in `public/images/` and are organized in subfolders.

---

## 2. Getting Access

You need a GitHub account that has access to the `kteq/kteq-web55` repository. Ask the station advisor or programming director to add you as a collaborator.

Once you have access, there are two ways to make changes:

### Option A: GitHub's Web Editor (Recommended for most tasks)

1. Go to [github.com/kteq/kteq-web55](https://github.com/kteq/kteq-web55)
2. Navigate to the file you want to edit in the `content/` folder
3. Click the pencil icon (edit button) in the top right of the file view
4. Make your changes
5. Scroll down, type a brief description of what you changed, and click **Commit changes**

That's it. The site rebuilds automatically.

### Option B: The Admin Panel (at kteq.org/#/admin)

The website includes a built-in admin panel with forms for editing content. To use it:

1. Go to `kteq.org/#/admin`
2. Enter the station's GitHub Personal Access Token (get this from the station advisor)
3. Use the forms to edit content — saving commits directly to the repo

The admin panel is being built in phases. If a section shows "coming soon," use the GitHub web editor instead.

---

## 3. Editing Content on GitHub

All content files use **JSON format**. JSON is structured text with a specific syntax. Here are the rules:

### JSON Basics

```json
{
  "name": "The Deep Cut",
  "genre": "Indie / Eclectic",
  "isActive": true,
  "yearStarted": 2024
}
```

**Rules to follow:**

- Every piece of text must be wrapped in double quotes: `"like this"`
- Use `true` or `false` (no quotes) for yes/no values
- Use plain numbers (no quotes) for numeric values
- Separate items with commas, but **no comma after the last item** in a list
- Be careful with special characters in text. If you need a double quote inside text, use `\"`. If you need a line break, use `\n`

### Most common mistake

The number one thing that will break the site is a missing or extra comma:

```json
{
  "name": "Good",
  "genre": "Rock",     ← comma here is correct
  "isActive": true     ← NO comma on the last item
}
```

If the site doesn't rebuild after your edit, this is almost certainly the issue. GitHub's editor will show a red dot on lines with syntax errors.

---

## 4. Managing the Schedule

**File:** `content/schedule.json`

The schedule is organized by day of the week. Each day contains a list of time slots.

### Adding or changing a time slot

Find the day you want to edit and add or modify a slot. Each slot looks like this:

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

**Fields explained:**

| Field | What it means | Example |
|-------|--------------|---------|
| `id` | A unique identifier. Use the pattern `day-time` | `"mon-1000"`, `"fri-1400"` |
| `startTime` | When the slot starts (24-hour format) | `"14:00"` for 2 PM |
| `endTime` | When the slot ends (24-hour format) | `"16:00"` for 4 PM, `"00:00"` for midnight |
| `showSlug` | Links to a show in shows.json (see below) | `"the-deep-cut"` |
| `isAutomation` | Is this automated/voice-tracked? | `true` or `false` |
| `notes` | Optional text shown on the schedule | `"Special guest week"` |

**Important:**

- Times use 24-hour format: 1 PM = `"13:00"`, midnight = `"00:00"`
- Use `"00:00"` for midnight as an end time (not `"24:00"`)
- The `showSlug` must match a slug in `content/shows.json` exactly
- Time slots should cover the full 24 hours for each day with no gaps or overlaps
- Update the `lastUpdated` field at the top of the file with today's date
- Update `updatedBy` with your name

### Example: Adding a new show on Monday evenings

1. Open `content/schedule.json`
2. Find the `"monday"` section
3. Adjust existing slots so there's room (for example, shorten the automation slot that currently covers the evening)
4. Add your new slot in the right time position:

```json
{
  "id": "mon-1800",
  "startTime": "18:00",
  "endTime": "20:00",
  "showSlug": "noise-floor",
  "isAutomation": false,
  "notes": ""
}
```

5. Make sure the show `"noise-floor"` exists in `content/shows.json` (see next section)

---

## 5. Managing Shows

**File:** `content/shows.json`

Shows are listed in the `"shows"` array. Each show looks like this:

```json
{
  "slug": "the-deep-cut",
  "name": "The Deep Cut",
  "tagline": "Digging deeper than the algorithm ever will",
  "description": "A two-hour journey through overlooked albums, B-sides, and deep cuts from across genres.",
  "djSlugs": ["alex-r"],
  "image": "/images/shows/deep-cut.jpg",
  "genre": "Eclectic / Indie",
  "isActive": true,
  "isAutomation": false,
  "socialLinks": {
    "instagram": "",
    "playlist": ""
  }
}
```

**Fields explained:**

| Field | What it means | Notes |
|-------|--------------|-------|
| `slug` | URL-friendly ID, used in the schedule and in the web address | Lowercase, hyphens instead of spaces: `"the-deep-cut"` |
| `name` | Display name of the show | `"The Deep Cut"` |
| `tagline` | Short one-liner shown under the name | Keep it to one sentence |
| `description` | Longer description shown on the show's page | Can use Markdown (see Section 11) |
| `djSlugs` | List of DJs who host this show | Must match slugs in `djs.json`. Use `[]` if none listed yet |
| `image` | Path to the show's image | See Section 10 for how to add images |
| `genre` | Genre label shown on cards | `"Punk / Hardcore"`, `"Electronic"`, etc. |
| `isActive` | Is this show currently airing? | `false` hides it from the main listing but keeps it in the system |
| `isAutomation` | Is this the automation entry? | Only `true` for the main KTEQ Automation show |
| `socialLinks` | Optional links | Instagram, Spotify/Apple playlist, etc. |

### Adding a new show

1. Open `content/shows.json`
2. Add a new entry at the end of the `"shows"` array (before the closing `]`)
3. Remember to add a comma after the previous show's closing `}`
4. Choose a unique slug (check that no other show uses the same one)
5. Add the slug to a schedule slot in `content/schedule.json`

### Removing a show

Don't delete the show entry — instead, set `"isActive": false`. This keeps the show in the archive and prevents broken links. Then remove or update any schedule slots that reference it.

---

## 6. Managing DJ Profiles

**File:** `content/djs.json`

DJ profiles work the same way as shows. Each DJ looks like this:

```json
{
  "slug": "alex-r",
  "name": "Alex R.",
  "bio": "Junior in ME. Has been at KTEQ since freshman year. Plays a mix of indie rock, shoegaze, and post-punk.",
  "image": "/images/djs/alex-r.jpg",
  "showSlugs": ["the-deep-cut"],
  "yearJoined": 2024,
  "isActive": true,
  "socialLinks": {
    "instagram": ""
  }
}
```

**Key points:**

- The `slug` must be unique and match what's referenced in the show's `djSlugs` list
- `showSlugs` should list all shows this DJ hosts (must match slugs in `shows.json`)
- `yearJoined` is the year they started at KTEQ
- Set `"isActive": false` when a DJ graduates or leaves (don't delete them)
- `bio` can use Markdown formatting (see Section 11)

### Connecting shows and DJs

Shows and DJs cross-reference each other. When you add a new DJ to a show:

1. Add the DJ to `content/djs.json` with their slug
2. Add the DJ's slug to the show's `"djSlugs"` list in `content/shows.json`
3. Add the show's slug to the DJ's `"showSlugs"` list in `content/djs.json`

Both references need to be in place for the links to work on the website.

---

## 7. Writing Blog Posts

**Location:** `content/posts/` (one file per post)

Blog posts are individual JSON files. The filename should follow the pattern: `YYYY-MM-slug.json`

### Creating a new post

1. In GitHub, navigate to `content/posts/`
2. Click **Add file** → **Create new file**
3. Name it something like `2026-04-spring-schedule.json`
4. Paste this template and fill it in:

```json
{
  "slug": "spring-schedule",
  "title": "Spring 2026 Schedule Is Here",
  "body": "Your blog post content goes here.\n\nUse \\n for line breaks.\n\n## You can use Markdown headers\n\nAnd **bold text** and *italic text* and [links](https://example.com).",
  "excerpt": "A short summary shown in the blog listing.",
  "featuredImage": "",
  "author": "Your Name",
  "status": "published",
  "publishedAt": "2026-04-01T09:00:00-06:00",
  "tags": ["schedule", "spring-2026"],
  "createdAt": "2026-04-01T09:00:00-06:00",
  "updatedAt": "2026-04-01T09:00:00-06:00"
}
```

**Fields explained:**

| Field | What it means | Notes |
|-------|--------------|-------|
| `slug` | URL-friendly ID | Becomes the web address: `kteq.org/#/blog/spring-schedule` |
| `title` | Headline of the post | |
| `body` | Full content of the post | Uses Markdown (see Section 11). Use `\n` for line breaks in JSON |
| `excerpt` | Short summary for the blog listing page | 1-2 sentences |
| `featuredImage` | Path to an image | Optional. See Section 10 |
| `author` | Who wrote it | |
| `status` | `"published"` or `"draft"` | Drafts won't appear on the site |
| `publishedAt` | Publication date | Format: `"2026-04-01T09:00:00-06:00"` (the `-06:00` is Mountain Time) |
| `tags` | Category labels | Show up on the post page |

### Writing long-form content in the body field

Since blog post content lives inside a JSON string, line breaks need to be written as `\n` and double quotes as `\"`. Here's an example:

```json
"body": "# Welcome Back\n\nWe're excited to announce the spring schedule.\n\n## What's New\n\nWe have **three new shows** this semester:\n\n- Noise Floor (Monday evenings)\n- The Vinyl Countdown (Wednesday afternoons)\n- Late Night Frequencies (Friday 10 PM)\n\nTune in and let us know what you think."
```

This renders on the website as a properly formatted article with headers, bold text, and a bulleted list.

### Saving a post as a draft

Set `"status": "draft"` and it won't appear on the site. When it's ready, change it to `"published"` and update `publishedAt` to the current date.

---

## 8. Managing the Timeline

**File:** `content/timeline.json`

The 55th anniversary timeline is the centerpiece of the history section. Each entry represents a significant moment in KTEQ's history.

### Adding a timeline entry

Add a new entry to the `"entries"` array:

```json
{
  "id": "1993-green-day",
  "year": 1993,
  "month": 4,
  "title": "Green Day Plays the Rushmore Plaza",
  "description": "KTEQ co-sponsored a Green Day show at the Rushmore Plaza Civic Center, one of many live events the station helped bring to the Black Hills.",
  "image": "/images/timeline/1993-green-day.jpg",
  "mediaUrl": "",
  "category": "music",
  "sources": "Black Hills Monthly, April 1993"
}
```

**Fields explained:**

| Field | What it means | Notes |
|-------|--------------|-------|
| `id` | Unique identifier | Use the pattern `year-short-description` |
| `year` | The year this happened | Used for sorting and display |
| `month` | Optional month (1-12) | Helps sort within a year. Leave it out if unsure |
| `title` | Headline for the entry | Keep it concise |
| `description` | The story of what happened | Can be a few sentences. Can use Markdown |
| `image` | Path to a photo | Optional. See Section 10 |
| `mediaUrl` | Link to audio or video | Optional. Could be a YouTube or SoundCloud embed URL |
| `category` | Type of entry | Must be one of: `"milestone"`, `"music"`, `"people"`, `"technical"` |
| `sources` | Where the information came from | Optional. Good practice for historical accuracy |

**Categories:**

- **milestone** — Founding, license changes, reopenings, awards, major events
- **music** — Concerts, notable bands, genre moments, significant shows
- **people** — DJs, managers, advisors, community figures
- **technical** — Frequency changes, equipment upgrades, studio moves, transmitter work

### Tips for good timeline entries

- Write in past tense
- Include specific dates when possible (use the `month` field)
- Keep descriptions to 2-4 sentences
- Add images whenever available — they make the timeline much more engaging
- Include source attribution for historical claims
- Ask alumni for stories and photos!

---

## 9. Site Settings

**File:** `content/settings.json`

This file controls station-wide settings. **Be careful editing this file** — incorrect values can affect the entire site.

### Campaign phase

The `campaignPhase` setting changes the homepage hero section and messaging:

| Value | Phase | When to use |
|-------|-------|-------------|
| `"rediscover"` | (Re)Discover KTEQ | Initial reconnection phase |
| `"55years"` | 55 Years of KTEQ | Anniversary celebration |
| `"kteqlive"` | KTEQ Live | Grand reopening countdown |
| `"kteq2071"` | KTEQ 2071 | Post-reopening, new normal |

To change phases, edit the value and commit. The homepage updates automatically.

### Announcement banner

To show a banner across the top of every page:

```json
"bannerText": "KTEQ returns to FM on May 16!",
"bannerUrl": "https://kteq.org/#/blog/fm-return",
"bannerDismissible": true
```

To hide the banner, set `bannerText` to an empty string: `"bannerText": ""`

### Stream URL

```json
"streamUrl": "https://kteq-proxy.kteq.workers.dev"
```

Only change this if the stream source changes. If the stream goes down, the player will show an error message automatically — you don't need to change this setting.

### Other settings

| Setting | What it does |
|---------|-------------|
| `stationName` | Displayed in the header and footer |
| `stationTagline` | Shown under the station name |
| `requestLine` | Phone number displayed on the site |
| `email` | Contact email |
| `donateUrl` | Where the Donate button links to (CARA page) |
| `socialLinks` | Facebook, Instagram, TuneIn URLs |
| `reopeningDate` | Used by the countdown timer during the `kteqlive` phase |

---

## 10. Adding Images

Images live in the `public/images/` folder, organized by type:

| Folder | What goes here |
|--------|---------------|
| `public/images/shows/` | Show artwork and logos |
| `public/images/djs/` | DJ headshots or profile photos |
| `public/images/timeline/` | Historical photos for timeline entries |
| `public/images/posts/` | Images for blog posts |
| `public/images/brand/` | Station logos and branding assets |

### How to upload an image

1. Go to the repository on GitHub
2. Navigate to the appropriate folder (e.g., `public/images/timeline/`)
3. Click **Add file** → **Upload files**
4. Drag and drop your image(s) or click to browse
5. Write a commit message (e.g., "Add 1993 Green Day show photo")
6. Click **Commit changes**

### Naming conventions

Use lowercase filenames with hyphens, no spaces:

- `deep-cut-cover.jpg` (not `Deep Cut Cover.jpg`)
- `alex-r.jpg` (not `Alex R..jpg`)
- `1993-green-day.jpg` (not `1993 Green Day.JPG`)

### Image guidelines

- **Format:** JPG for photos, PNG for logos or graphics with transparency
- **Size:** Aim for under 500 KB per image. Resize large photos before uploading — 1200px wide is plenty for the website
- **Aspect ratio:** No strict requirement, but 16:9 or 3:2 works well for show/post images. Square works for DJ profile photos
- Free tools to resize: [Squoosh](https://squoosh.app/) (web-based, no install needed) or Preview on Mac

### Referencing images in content files

After uploading, reference the image by its path from the `public/` folder:

```json
"image": "/images/timeline/1993-green-day.jpg"
```

The path always starts with `/images/` (not `public/images/`).

### Images to avoid uploading

- Anything over 2 MB (will slow the site down and bloat the repo)
- Copyrighted press photos you don't have permission to use
- Raw camera files (.RAW, .CR2, .NEF) — convert to JPG first

---

## 11. Formatting with Markdown

Several content fields support **Markdown**, a simple formatting language. This includes show descriptions, DJ bios, blog post bodies, and timeline descriptions.

### Common formatting

| What you type | What it looks like |
|---------------|-------------------|
| `**bold text**` | **bold text** |
| `*italic text*` | *italic text* |
| `[link text](https://url.com)` | link text (as a clickable link) |
| `# Big Heading` | A large heading |
| `## Smaller Heading` | A medium heading |
| `### Even Smaller` | A small heading |

### Lists

```
- First item
- Second item
- Third item
```

### Line breaks in JSON

Since content is stored in JSON strings, you can't just press Enter for a new line. Instead, use `\n`:

```json
"description": "First paragraph goes here.\n\nSecond paragraph goes here."
```

Two `\n\n` creates a paragraph break. One `\n` creates a line break.

### Full example

```json
"body": "# Spring Schedule Announcement\n\nWe're thrilled to share the spring 2026 lineup.\n\n## New Shows\n\nThis semester brings **three new programs** to the KTEQ airwaves:\n\n- **Noise Floor** — ambient and experimental electronic\n- **The Vinyl Countdown** — classic rock deep cuts on actual vinyl\n- **Late Night Frequencies** — freeform after dark\n\n## Returning Favorites\n\nAll of last semester's shows are back in their usual slots.\n\nCheck the [full schedule](/schedule) for times and details."
```

---

## 12. Troubleshooting

### The site didn't update after my edit

- Changes take about 60 seconds to go live. Wait a minute and refresh.
- Check if the GitHub Actions build succeeded: go to the repository → **Actions** tab. If the latest run has a red X, the build failed.
- If the build failed, the most common cause is a JSON syntax error. Check for missing commas, extra commas, or unclosed quotes.

### I see a JSON syntax error but can't find it

- GitHub's web editor highlights syntax errors with a red dot in the margin
- Try pasting your JSON into [jsonlint.com](https://jsonlint.com/) — it will point to the exact line with the error
- Common culprits: comma after the last item in a list, missing closing bracket, or unescaped quote in text

### A show doesn't appear on the schedule

- Check that the show's `slug` in `shows.json` exactly matches the `showSlug` in `schedule.json`
- Check that `"isActive": true` is set on the show
- Slugs are case-sensitive: `"the-deep-cut"` and `"The-Deep-Cut"` are different

### An image doesn't show up

- Check the path starts with `/images/` (not `public/images/`)
- Check the filename matches exactly, including extension and case
- Make sure the image was committed to the correct folder

### The player says "Stream unavailable"

- This usually means the Icecast stream or the Cloudflare proxy is down — it's not a website issue
- Check if you can hear the stream directly: try the TuneIn link or the raw stream URL
- If the stream itself is working, the proxy URL may need attention — contact the station advisor

### I committed something bad and need to undo it

- Go to the repository → click on the **commits** link near the top
- Find the bad commit
- Click the commit to view it, then click the **"..."** menu → **Revert changes**
- This creates a new commit that undoes the change

### I need help

If you're stuck or something seems broken, reach out to:

- **Station advisor** (Jason) for website and technical questions
- **Programming director** for schedule and show content questions

---

## Quick Reference

### Date format

Dates in the content files use ISO 8601 format with Mountain Time:

```
2026-04-15T14:00:00-06:00
```

That's: April 15, 2026 at 2:00 PM Mountain Time (MDT is -06:00).

### Slug format

Slugs are URL-safe identifiers. Rules:

- All lowercase
- Hyphens instead of spaces
- No special characters
- Keep them short but descriptive

Examples: `the-deep-cut`, `alex-r`, `spring-schedule-2026`, `1971-first-broadcast`

### Content file quick links

Once the repo is set up, bookmark these for fast editing:

- [Schedule](https://github.com/kteq/kteq-web55/blob/main/content/schedule.json)
- [Shows](https://github.com/kteq/kteq-web55/blob/main/content/shows.json)
- [DJs](https://github.com/kteq/kteq-web55/blob/main/content/djs.json)
- [Timeline](https://github.com/kteq/kteq-web55/blob/main/content/timeline.json)
- [Settings](https://github.com/kteq/kteq-web55/blob/main/content/settings.json)
- [Blog posts folder](https://github.com/kteq/kteq-web55/tree/main/content/posts)
- [Images folder](https://github.com/kteq/kteq-web55/tree/main/public/images)
