# Bundled fonts

Newsreader and IBM Plex Mono are bundled so production builds do not depend on
Google Fonts requests. `app/layout.tsx` loads these files through `next/font/local`.

Source: [google/fonts at 23e54b51ddffbc7713c583748e3bd86f62b1fa4a](https://github.com/google/fonts/tree/23e54b51ddffbc7713c583748e3bd86f62b1fa4a/ofl).
Each family includes its upstream SIL Open Font License in `OFL.txt`.

The upstream TTF files were converted to WOFF2 with FontTools 4.66.0 and Brotli
1.2.0, preserving all glyphs and variation axes. The conversion uses
`fontTools.ttLib.TTFont`, sets `font.flavor = "woff2"`, and saves the result with
the same filename and a `.woff2` extension. No font conversion tooling is needed
to build or deploy the site.
