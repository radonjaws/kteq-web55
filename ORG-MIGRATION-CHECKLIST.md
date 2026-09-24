# Moving kteq-web55 to the kteq Organization

One-time checklist for moving the website repository from `radonjaws/kteq-web55` to `kteq/kteq-web55`, with `kteq` converted from a user account into a GitHub organization. After this, each admin panel user signs in with their own approved token (see ADMIN-MANUAL.md, Sections 2 and 7).

Plan for about an hour. The public site stays up throughout; only admin panel saves pause between steps 3 and 5.

## 1. Prepare the kteq account

- [ ] Sign in to GitHub as **kteq**
- [ ] Download anything you want to keep from the account's own settings (SSH keys, email settings, notification setup). A converted account can't be signed into again.
- [ ] Leave every organization kteq belongs to, including the old **KTEQ-FM** organization if kteq is a member (profile picture → **Your organizations** → **Leave**). GitHub won't convert an account that is a member of an organization.
- [ ] Check the repositories it owns (kteq-status-report, kteq.github.io, and the older ones). They all move into the new organization unchanged.

## 2. Convert kteq to an organization

- [ ] Confirm **radonjaws** (or another personal account that will be an owner) is ready to sign in
- [ ] Signed in as kteq: **Settings** → **Organizations** → **Turn kteq into an organization**
- [ ] Choose **radonjaws** as the organization owner
- [ ] Choose the **Free** plan
- [ ] Sign out, sign in as radonjaws, and open [github.com/kteq](https://github.com/kteq) to confirm you're an owner
- [ ] Add a second Leadership owner (People → Invite member → Owner). The old KTEQ-FM organization was stranded when its only owner deleted their account; two owners prevents that.
- [ ] Make the second owner someone who stays past graduation, such as the station advisor or another staff member

## 3. Set the organization's token policy

kteq → **Settings** → **Personal access tokens**:

- [ ] Fine-grained tokens: **Allow access via fine-grained personal access tokens**
- [ ] Approval: **Require administrator approval**
- [ ] Maximum lifetime (fine-grained): 366 days or less
- [ ] Tokens (classic) tab: **Restrict access via personal access tokens (classic)**

## 4. Create the editors team

- [ ] kteq → **Teams** → **New team** → name it `web-editors`, visibility **Visible**
- [ ] Add current student editors to the team (invite them to the organization first)

## 5. Transfer the repository

- [ ] As radonjaws: kteq-web55 → **Settings** → **General** → **Danger Zone** → **Transfer** → new owner **kteq**
- [ ] kteq/kteq-web55 → **Settings** → **Collaborators and teams** → **Add teams** → `web-editors` with **Write** role
- [ ] Remove individual outside collaborators left over from the old setup

## 6. Update the code

- [ ] In `src/composables/useGitHub.ts`, change `OWNER` from `'radonjaws'` to `'kteq'`
- [ ] Update your local copy's remote: `git remote set-url origin https://github.com/kteq/kteq-web55.git`
- [ ] Remove the stale `KTEQ-ADMIN-MANUAL.md` copy so only `ADMIN-MANUAL.md` remains
- [ ] Commit and push. The deploy runs from the new location.

## 7. Reconnect GitHub Pages and the domain

- [ ] kteq/kteq-web55 → **Settings** → **Pages** → Source: **GitHub Actions**
- [ ] Custom domain: `kteq.org`, then turn on **Enforce HTTPS** once the certificate is ready
- [ ] In DNS, any `CNAME` record that points to `radonjaws.github.io` now points to `kteq.github.io`. A records pointing at GitHub's `185.199.108–111.153` addresses stay as they are.
- [ ] If kteq.github.io (the old site repository) has `kteq.org` set as its custom domain, clear it there so the two don't conflict
- [ ] Optional: verify kteq.org for the organization (kteq → **Settings** → **Pages** → **Add a domain**) so no one else can claim it

## 8. Test sign-in end to end

- [ ] As a test user on the `web-editors` team, create a token following ADMIN-MANUAL.md Section 2
- [ ] Sign in at kteq.org/#/admin before approving it. Sign-in succeeds; a save shows "GitHub refused the save… waiting for approval."
- [ ] Approve the token (Section 7), save again, and confirm the change appears on kteq.org within about a minute
- [ ] Sign in with a made-up token and confirm the "did not recognize this token" message
- [ ] Revoke the old shared station token at radonjaws → **Settings** → **Developer settings** → **Personal access tokens**
