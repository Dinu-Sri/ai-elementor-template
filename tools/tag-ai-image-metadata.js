const fs = require("fs");
const path = require("path");
const { exiftool } = require("exiftool-vendored");

const root = path.resolve(__dirname, "..");
const inputs = process.argv.slice(2);
const creator = process.env.NEB_IMAGE_CREATOR;
const credit = process.env.NEB_IMAGE_CREDIT || creator;
const rights = process.env.NEB_IMAGE_RIGHTS || (creator ? `Copyright ${new Date().getFullYear()} ${creator}` : "");

async function main() {
  if (!inputs.length) {
    throw new Error("Usage: node tools/tag-ai-image-metadata.js <image> [image ...]");
  }
  if (!creator) {
    throw new Error("NEB_IMAGE_CREATOR is required.");
  }

  const results = [];
  for (const input of inputs) {
    const file = path.resolve(root, input);
    if (!fs.existsSync(file)) throw new Error(`Image not found: ${file}`);

    await exiftool.write(file, {
      "XMP-iptcExt:DigitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
      "XMP-dc:Creator": creator,
      "XMP-photoshop:Credit": credit,
      "XMP-dc:Rights": rights
    }, ["-overwrite_original"]);

    const tags = await exiftool.read(file, ["-XMP-iptcExt:DigitalSourceType", "-XMP-dc:Creator", "-XMP-photoshop:Credit"]);
    results.push({
      file: path.relative(root, file),
      digital_source_type: tags.DigitalSourceType || "",
      creator: tags.Creator || "",
      credit: tags.Credit || ""
    });
  }

  console.log(JSON.stringify({ ok: true, images: results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => exiftool.end());
