# Securing your AI Journey: Executive Point of View

An interactive, **simulated** walkthrough for a global port-operations audience. It covers the AI control plane, governance, policy enforcement, agent discovery, governed access, and risk and compliance. It is a point of view for discussion, not a product pitch.

- Static site: HTML, CSS and JavaScript only. No build step, no backend, no external requests.
- All data is illustrative. Replace it before any real decision (see below).

## Storyline (about 30 to 35 minutes)

| # | Scene | Executive message |
|---|-------|-------------------|
| 1 | Welcome | A point of view, not a product demo |
| 2 | The shift | AI moves from answering to acting, so trust becomes the question |
| 3 | The framework | Five questions: See, Identify, Decide, Monitor, Prove |
| 4 | See (discovery) | You cannot govern what you cannot see, including vendor-embedded AI |
| 5 | Identify (governed access) | Treat agents like staff: identity, owner, least privilege |
| 6 | Decide (policy) | Same request, different explainable outcomes. Some actions are never delegated |
| 7 | Monitor (control plane) | One live view across regions, with a safe stop and manual fall-back |
| 8 | Prove (risk and compliance) | One control framework across many regional rulebooks |
| 9 | Business value | Governance unlocks scale: value model with adjustable inputs |
| 10 | Roadmap and decisions | Three horizons and four decisions for the room |

## Presenting

- **Right / Left arrow**: next / previous scene
- **N**: presenter notes (talk track and timing for each scene)
- **F**: full screen
- Jump straight to a scene with a URL hash, for example `index.html#4`
- Browser print gives one page per scene

## Run locally

Open `index.html` in a browser, or run a local server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Executive AI governance walkthrough"
git branch -M main
git remote add origin https://github.com/<your-org-or-user>/<repo-name>.git
git push -u origin main
```

Then in GitHub: **Settings > Pages > Build and deployment > Source: Deploy from a branch > Branch: main, folder: / (root) > Save**.
The site will be at `https://<your-org-or-user>.github.io/<repo-name>/` after a minute or two.

If the audience should not see it publicly, use a **private repository** with GitHub Pages access control (available on GitHub Enterprise Cloud), or present from `localhost`.

## Before the meeting: things to check

1. **Simulated data**: `js/data.js` holds agents, events, regional status and the roadmap. Adjust names and regions to fit the Port Authority's context. Nothing in it is real Port Authority data.
2. **Regulatory wording**: the compliance grid is illustrative. Have Legal and Compliance confirm any statement about specific laws (for example EU AI Act, NIS2, GDPR, national data laws) before it is shown as fact.
3. **Value model**: the sliders use placeholder numbers. Do not present the outputs as a forecast. Offer to replace them with the Port Authority's own baselines in a follow-up workshop.
4. **Branding**: colours are set in `:root` at the top of `css/styles.css`. Add a logo only if you have permission to use it.
5. **Rehearse** the policy simulator (scene 6) and the control plane pause (scene 7). They are the two moments that land best with executives.

## Structure

```
index.html        page and scene layout
css/styles.css    styling
js/data.js        all simulated data and presenter notes
js/app.js         interactions
```
