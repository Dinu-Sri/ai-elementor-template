process.env.NEB_TIMED_CATEGORY = "pedicure";

const { main } = require("./apply-manicure-revision-2026-08-27.cjs");

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
