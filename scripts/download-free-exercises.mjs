import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const seedPath = path.join(projectRoot, "src", "data", "seedExerciseLibrary.ts");
const framesRoot = path.join(projectRoot, "public", "frames");
const manifestPath = path.join(
  projectRoot,
  "src",
  "data",
  "framesManifest.json",
);
const repositoryRoot =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db";

const seedTuplePattern =
  /\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?\s*,?\s*\]/gs;

function parseExercises(source) {
  const exercises = [];
  for (const match of source.matchAll(seedTuplePattern)) {
    const [, id, zh, , , , enDirName] = match;
    if (!enDirName?.trim()) continue;

    if (!/^[\w-]+$/.test(id) || !/^[\w-]+$/.test(enDirName)) {
      console.warn(`跳过不安全的动作映射：${zh}`);
      continue;
    }

    exercises.push({ id, zh, enDirName });
  }
  return exercises;
}

async function downloadFrame(enDirName, frameNumber) {
  const failures = [];

  for (const branch of ["main", "master"]) {
    const url = `${repositoryRoot}/${branch}/exercises/${enDirName}/${frameNumber}.jpg`;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        failures.push(`${branch} 返回 HTTP ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().startsWith("image/")) {
        failures.push(`${branch} 返回了非图片内容`);
        continue;
      }

      const image = Buffer.from(await response.arrayBuffer());
      if (image.length === 0) {
        failures.push(`${branch} 返回了空图片`);
        continue;
      }

      return image;
    } catch (error) {
      failures.push(
        `${branch} 请求失败：${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  throw new Error(failures.join("；"));
}

async function main() {
  const seedSource = await readFile(seedPath, "utf8");
  const exercises = parseExercises(seedSource);
  if (exercises.length === 0) {
    throw new Error("没有在种子文件中找到带 enDirName 的动作。");
  }

  await mkdir(framesRoot, { recursive: true });

  const manifest = [];
  let downloadedCount = 0;
  for (const exercise of exercises) {
    const exerciseDirectory = path.join(framesRoot, exercise.id);
    await mkdir(exerciseDirectory, { recursive: true });
    const frames = [];

    for (const frameNumber of [0, 1]) {
      try {
        const image = await downloadFrame(exercise.enDirName, frameNumber);
        await writeFile(
          path.join(exerciseDirectory, `${frameNumber}.jpg`),
          image,
        );
        frames.push(`/frames/${exercise.id}/${frameNumber}.jpg`);
        downloadedCount += 1;
        console.log(`已下载：${exercise.zh} 第 ${frameNumber + 1} 帧`);
      } catch (error) {
        console.warn(
          `下载失败，已跳过：${exercise.zh} 第 ${frameNumber + 1} 帧（${error instanceof Error ? error.message : "未知错误"}）`,
        );
      }
    }

    if (frames.length > 0) {
      manifest.push({ id: exercise.id, zh: exercise.zh, frames });
    }
  }

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `完成：从 ${exercises.length} 个动作映射下载 ${downloadedCount}/${exercises.length * 2} 张图片，清单包含 ${manifest.length} 个动作。`,
  );
}

main().catch((error) => {
  console.error(
    `脚本执行失败：${error instanceof Error ? error.message : "未知错误"}`,
  );
  process.exitCode = 1;
});
