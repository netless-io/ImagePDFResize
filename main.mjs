import { fromPath } from "pdf2pic";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import PDFParser from "pdf2json";

const tmpDir = "./tmp";
const listDir = "./convertList";
const outputDir = "./output";
const preferImageWidth = 1024;

function createNewDir(dir) {
  fs.existsSync(dir) && fs.rmSync(dir, { recursive: true }, (err) => {});
  fs.mkdirSync(dir, { recursive: true });
  console.log("create dir: " + dir);
}

async function pdf2img(pdfPath) {
  const pdfParser = new PDFParser();
  pdfParser.loadPDF(pdfPath);
  const pdfData = await new Promise((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (errData) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData) => resolve(pdfData));
  });
  const pages = pdfData.Pages.map((page) => {
    return {
      Width: page.Width,
      Height: page.Height
    };
  });

  // get file name withou extension.
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const dirName = path.join(tmpDir, baseName);
  createNewDir(dirName);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const width = preferImageWidth;
    const height = Math.round((width * page.Height) / page.Width);

    const options = {
      density: 100,
      saveFilename: baseName,
      savePath: dirName,
      format: "jpeg",
      quality: 80,
      compression: 'jpeg',
      width: width,
      height: height,
    };
    await fromPath(pdfPath, options)(i + 1)
  }
  return dirName;
}

async function img2pdf(imgDir) {
  // get all images in dir and sort it by filename.
  // filename is like 'xx.yy.jpg', the yy is number.
  const files = fs.readdirSync(imgDir).sort((a, b) => {
    const aNum = parseInt(a.split(".")[1]);
    const bNum = parseInt(b.split(".")[1]);
    return aNum - bNum;
  });
  const newFileName = path.basename(imgDir) + ".pdf";
  const pdfPath = path.join(outputDir, newFileName);
  fs.existsSync(pdfPath) &&
    fs.rmSync(pdfPath, { recursive: true }, (err) => {});
  let imgs = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imgPath = path.join(imgDir, file);
    const image = sharp(imgPath);
    const metadata = await image.metadata();
    imgs.push({ path: imgPath, metadata });
  }
  console.log({ imgs });
  let doc;
  imgs.forEach((img) => {
    if (!doc) {
      doc = new PDFDocument({ size: [img.metadata.width, img.metadata.height]});
      doc.pipe(fs.createWriteStream(pdfPath));
      doc.image(img.path, 0, 0, { width: img.metadata.width, height: img.metadata.height })
      return;
    }
    doc
    .addPage({ size: [img.metadata.width, img.metadata.height]})
    .image(img.path, 0, 0, { width: img.metadata.width, height: img.metadata.height })
  });
  doc.end();
}

createNewDir(tmpDir);
fs.readdir(listDir, (err, files) => {
  if (err) throw err;
  files.forEach(async (file) => {
    // only process pdf file.
    if (path.extname(file) !== ".pdf") return;
    const pdfPath = path.join(listDir, file);
    console.log(pdfPath + " start converting.");
    const dirName = await pdf2img(pdfPath);
    await img2pdf(dirName);
    console.log(pdfPath + " convert finished.");
  });
});
