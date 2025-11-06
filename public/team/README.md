# Team Member Images

This directory contains profile images for the team members displayed on the About Us page.

## Required Images

Add the following images to this directory:

- `brandon.jpg` - Brandon Cooley (Programmer)
- `mduduzi.jpg` - Mduduzi Zitha (Project Manager)
- `suzan.jpg` - Suzan Muradzikwa (Remote Sensing Analyst)
- `paige.jpg` - Paige Menezes (GIS Analyst)
- `ntsako.jpg` - Ntsako Hlaneke (Researcher)

## Image Specifications

- **Format**: JPG, PNG, or WebP
- **Recommended Size**: 400x400 pixels (square)
- **Aspect Ratio**: 1:1 (will be displayed as circular avatars)
- **Max File Size**: Keep under 500KB for optimal loading

## Fallback Behavior

If images are not provided, the About page will automatically display:
- Colored avatar circles with team member initials
- Each member has a unique color associated with their role

## Adding Images

1. Save your team member photos in this directory with the exact filenames listed above
2. Ensure images are optimized for web use
3. The page will automatically load the images once they're placed here
4. No code changes are needed - just add the image files

## Notes

- Images are served from the public directory, so they'll be accessible at `/team/filename.jpg`
- If an image fails to load, the fallback initials avatar will be displayed
- You can replace images at any time by overwriting the existing files
