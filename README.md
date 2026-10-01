# amineherch-robotics.github.io

Personal portfolio of **Mohamed Amine Herch**, industrial electronics engineer working on autonomous mobile robots, ROS 2 / Open-RMF fleets, embedded systems and digital twins.

Live site: https://amineherch-robotics.github.io/

## Structure

```
index.html        page content (all text lives here)
css/style.css     design tokens, layout, components, animations
js/main.js        menu, active links, pointer glow, counters, scroll reveals
js/robot.js       Three.js hero scene: procedural AMR, platform, particles, HUD labels
photo.jpg         profile photo (square, ~400 px)
img/              gallery photos (leadership and training)
```

No build step. Three.js (0.160) and GSAP (3.12) load from CDNs, so an internet connection is needed for the 3D scene. Without WebGL the hero shows a CSS fallback, and with "reduce motion" enabled the scene renders as a still frame.

## Preview locally

Open `index.html` in a browser, or run a small server from this folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000

## Publish

Commit and push to `main`. GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/root`) rebuilds the site in about a minute.

## Common edits

- **Text and projects:** edit `index.html`. Each section is marked with a comment like `<!-- ============ PROJECTS ============ -->`.
- **Profile photo:** replace `photo.jpg` with a square image of the same name.
- **Gallery photos:** add images to `img/` (resize to ~1200 px wide) and add a `<figure>` in the Leadership or Training section.
- **Colours:** change the variables at the top of `css/style.css` (`--violet`, `--cyan`, `--bg`).
- **3D labels around the robot:** edit the `LABELS` list in `js/robot.js`.
