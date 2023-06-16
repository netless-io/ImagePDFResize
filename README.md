# ImagePDFResize

Reduce the resolution of embedded images and output the PDF file containing images again.

## Prerequisite

- node >= 12.x
- graphicsmagick

## How to use

1. Install dependencies.

```
  npm install
```

2. Put your pdf files in `./convertList` folder.
3. Run
   ```
   node main.mjs
   ```
4. Now your converted pdf files will be in `./output` folder.

You can update preferImageWidth in main.mjs to update image width.
