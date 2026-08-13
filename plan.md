1.  **Phase 1: Update Global CSS / Design Tokens**
    *   Update `src/styles/minecraft-theme.css` with the complete CSS given in the prompt for `MinecraftButton`, `MinecraftPanel`, `MinecraftInput`, `MinecraftLoadingScreen` and variables.
    *   Also make sure there's CSS for crisp rendering.

2.  **Phase 2: Update `index.html`**
    *   Modify elements to map to the new primitives provided.
    *   Ensure buttons use the `MinecraftButton` class instead of `.btn-primary` or custom styling.
    *   Ensure the loading screen uses `.MinecraftLoadingScreen`.
    *   Ensure inputs in the menu use `.MinecraftInput` wrapped around the labels and sliders.
    *   Ensure overlays (menus, inventory, crafting) use `.MinecraftPanel`.

3.  **Phase 3: Update `game.js`**
    *   Ensure dynamically generated buttons like `btn-craft` are given the `.MinecraftButton` class in addition to/instead of `.btn-craft`.
    *   Verify the click sound hook works for `.MinecraftButton` (which is already configured via event delegation in `game.js`, per memory).

4.  **Phase 4: Run pre-commit tests and verify**
    *   Follow the pre-commit instructions to ensure no regressions.
