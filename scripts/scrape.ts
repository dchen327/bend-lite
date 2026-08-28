import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { load } from "cheerio";

const BEND_URL = "https://bend.com";
const IMAGE_URL = "https://api.bend.com/static/exercise_images";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CACHE_DIR = join(ROOT, ".cache", "bend");
const EXERCISES_DIR = join(ROOT, "public", "exercises");
const DATA_DIR = join(ROOT, "src", "data");
const EXERCISE_ID_OVERRIDES: Record<string, string> = {
  // Bend gives these seated and standing variants the same display names.
  "image_00006.png": "seated-side-bend",
  "image_00146.png": "standing-side-bend",
  "image_00007.png": "seated-cactus-arms",
  "image_00147.png": "standing-cactus-arms",
  "image_00008a.png": "seated-shoulder-rolls",
  "image_00143a.png": "standing-shoulder-rolls",
  "image_00012.png": "seated-diver",
  "image_00145.png": "standing-diver",
  "image_00035.png": "seated-chest-opener",
  "image_00036.png": "standing-chest-opener",
  "image_00037.png": "seated-one-arm-hug",
  "image_00038.png": "standing-one-arm-hug",
  "image_00039.png": "seated-overhead-tricep",
  "image_00040.png": "standing-overhead-tricep",
};
const CONCURRENCY = 5;
const REQUEST_DELAY_MS = 250;

type Exercise = {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
};

type ParsedExercise = Omit<Exercise, "id" | "image"> & {
  imageFile: string;
};

type ParsedRoutine = {
  slug: string;
  name: string;
  description: string;
  totalMinutes: number;
  exerciseImageFiles: string[];
};

type BendRoutine = Omit<ParsedRoutine, "exerciseImageFiles"> & {
  exerciseIds: string[];
};

type Options = {
  limit?: number;
  preview: boolean;
  refresh: boolean;
  slugs: string[];
};

function parseOptions(argv: string[]): Options {
  const options: Options = { preview: false, refresh: false, slugs: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];

    if (argument === "--") {
      continue;
    }
    if (argument === "--limit" && value) {
      options.limit = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === "--slug" && value) {
      options.slugs.push(value);
      index += 1;
    } else if (argument === "--slugs" && value) {
      options.slugs.push(
        ...value
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean),
      );
      index += 1;
    } else if (argument === "--preview" || argument === "--dry-run") {
      options.preview = true;
    } else if (argument === "--refresh") {
      options.refresh = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (
    options.limit !== undefined &&
    (!Number.isInteger(options.limit) || options.limit < 1)
  ) {
    throw new Error("--limit must be followed by a positive integer.");
  }

  return options;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function createExerciseId(name: string): string {
  const id = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!id) {
    throw new Error(`Could not create an id for exercise "${name}".`);
  }
  return id;
}

async function readCache(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function createRequestGate() {
  let nextRequestAt = 0;

  return async () => {
    const now = Date.now();
    const startAt = Math.max(now, nextRequestAt);
    nextRequestAt = startAt + REQUEST_DELAY_MS;

    if (startAt > now) {
      await new Promise((resolve) => setTimeout(resolve, startAt - now));
    }
  };
}

function createHtmlFetcher(refresh: boolean) {
  const waitForRequest = createRequestGate();

  return async (url: string, cachePath: string): Promise<string> => {
    if (!refresh) {
      const cached = await readCache(cachePath);
      if (cached !== undefined) return cached;
    }

    await waitForRequest();
    const response = await fetch(url, {
      headers: { "user-agent": "bend-lite-personal-scraper/1.0" },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, html);
    return html;
  };
}

function parseRoutineSlugs(html: string): string[] {
  const $ = load(html);
  const slugs: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const pathname = new URL(href, BEND_URL).pathname;
    const slug = pathname.match(/^\/routines\/([a-z0-9-]+)\/?$/)?.[1];
    if (!slug || slug.startsWith("page-") || seen.has(slug)) return;

    seen.add(slug);
    slugs.push(slug);
  });

  if (slugs.length === 0) {
    throw new Error("No routine links found on the routines index.");
  }
  return slugs;
}

function parseImageFile(source: string): string {
  const sourceUrl = new URL(source, BEND_URL);
  const originalUrl = sourceUrl.searchParams.get("url");
  const pathname = originalUrl ? new URL(originalUrl).pathname : sourceUrl.pathname;
  const imageFile = pathname.match(
    /\/exercise_images\/(image_\d{5}[a-z]?\.png)$/,
  )?.[1];

  if (!imageFile) {
    throw new Error(`No recognized exercise image in "${source}".`);
  }
  return imageFile;
}

function parseRoutinePage(
  slug: string,
  html: string,
): { routine: ParsedRoutine; exercises: ParsedExercise[] } {
  const $ = load(html);
  const heading = $("h1").first();
  const header = heading.parent();
  const name = cleanText(heading.text());
  const description = cleanText(header.find("p").first().text());
  const totalMinutes = Number.parseInt(header.find("time").first().text(), 10);
  const exercises: ParsedExercise[] = [];

  $("article")
    .filter((_, element) => $(element).find("section").length > 0)
    .each((_, element) => {
      const article = $(element);
      const imageSource = article.find("figure img").first().attr("src");
      const exerciseName = cleanText(article.find("h3").first().text()).replace(
        /^\d+\.\s*/,
        "",
      );

      if (!imageSource || !exerciseName) {
        throw new Error(`Routine "${slug}" contains an incomplete exercise.`);
      }

      const findSection = (sectionName: string) =>
        article
          .find("section")
          .filter((_, sectionElement) => {
            const title = cleanText($(sectionElement).find("h4").first().text());
            return title.toLowerCase() === sectionName;
          })
          .first();
      const listValues = (sectionName: string) =>
        findSection(sectionName)
          .find("li")
          .map((_, item) => cleanText($(item).text()))
          .get()
          .filter(Boolean);
      const benefits = cleanText(findSection("benefits").find("p").first().text())
        .split(",")
        .map(cleanText)
        .filter(Boolean);
      const instructions = listValues("instructions");

      if (instructions.length === 0 || benefits.length === 0) {
        throw new Error(`Routine "${slug}" contains incomplete data for "${exerciseName}".`);
      }

      exercises.push({
        imageFile: parseImageFile(imageSource),
        name: exerciseName,
        instructions,
        tips: listValues("tips"),
        modifications: listValues("modifications"),
        benefits,
      });
    });

  if (!name || !description || !Number.isFinite(totalMinutes) || exercises.length === 0) {
    throw new Error(`Routine "${slug}" is missing required metadata or exercises.`);
  }

  return {
    routine: {
      slug,
      name,
      description,
      totalMinutes,
      exerciseImageFiles: exercises.map((exercise) => exercise.imageFile),
    },
    exercises,
  };
}

async function mapConcurrent<T, Result>(
  values: T[],
  mapper: (value: T) => Promise<Result>,
): Promise<Result[]> {
  const results = new Array<Result>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, values.length) }, () => worker()),
  );
  return results;
}

function buildLibrary(parsedPages: ReturnType<typeof parseRoutinePage>[]) {
  const byImage = new Map<string, ParsedExercise>();

  for (const page of parsedPages) {
    for (const exercise of page.exercises) {
      const existing = byImage.get(exercise.imageFile);
      if (existing && existing.name !== exercise.name) {
        throw new Error(
          `${exercise.imageFile} has conflicting names: "${existing.name}" and "${exercise.name}".`,
        );
      }
      byImage.set(exercise.imageFile, existing ?? exercise);
    }
  }

  const idToImage = new Map<string, string>();
  const imageToId = new Map<string, string>();
  const exercises: Record<string, Exercise> = {};
  const idCandidates = new Map<string, ParsedExercise[]>();

  for (const exercise of byImage.values()) {
    const id =
      EXERCISE_ID_OVERRIDES[exercise.imageFile] ?? createExerciseId(exercise.name);
    idCandidates.set(id, [...(idCandidates.get(id) ?? []), exercise]);
  }

  const collisions = [...idCandidates.entries()].filter(
    ([, candidates]) => candidates.length > 1,
  );
  if (collisions.length > 0) {
    const details = collisions
      .map(([id, candidates]) => {
        const variants = candidates
          .map(
            ({ imageFile, instructions }) =>
              `${imageFile} (${instructions[0] ?? "no instructions"})`,
          )
          .join("; ");
        return `"${id}": ${variants}`;
      })
      .join("\n");
    throw new Error(`Exercise id collisions:\n${details}`);
  }

  for (const [id, [exercise]] of idCandidates) {
    const existingImage = idToImage.get(id);
    if (existingImage && existingImage !== exercise.imageFile) {
      throw new Error(
        `Exercise id collision: "${id}" maps to ${existingImage} and ${exercise.imageFile}.`,
      );
    }

    idToImage.set(id, exercise.imageFile);
    imageToId.set(exercise.imageFile, id);
    exercises[id] = {
      id,
      name: exercise.name,
      image: `/exercises/${exercise.imageFile}`,
      instructions: exercise.instructions,
      tips: exercise.tips,
      modifications: exercise.modifications,
      benefits: exercise.benefits,
    };
  }

  const routines: BendRoutine[] = parsedPages.map(({ routine }) => ({
    slug: routine.slug,
    name: routine.name,
    description: routine.description,
    totalMinutes: routine.totalMinutes,
    exerciseIds: routine.exerciseImageFiles.map((imageFile) => {
      const id = imageToId.get(imageFile);
      if (!id) throw new Error(`No exercise id found for ${imageFile}.`);
      return id;
    }),
  }));

  return {
    exercises: Object.fromEntries(
      Object.entries(exercises).sort(([left], [right]) => left.localeCompare(right)),
    ),
    routines,
  };
}

async function downloadImages(exercises: Record<string, Exercise>) {
  await mkdir(EXERCISES_DIR, { recursive: true });
  const waitForRequest = createRequestGate();

  await mapConcurrent(Object.values(exercises), async (exercise) => {
    const imageFile = exercise.image.split("/").at(-1);
    if (!imageFile) throw new Error(`Invalid image path for "${exercise.name}".`);

    const destination = join(EXERCISES_DIR, imageFile);
    try {
      await access(destination);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    await waitForRequest();
    const response = await fetch(`${IMAGE_URL}/${imageFile}`, {
      headers: { "user-agent": "bend-lite-personal-scraper/1.0" },
    });
    if (!response.ok) {
      throw new Error(`Failed to download ${imageFile}: ${response.status}`);
    }
    await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  });
}

async function emitData(
  exercises: Record<string, Exercise>,
  routines: BendRoutine[],
) {
  await mkdir(DATA_DIR, { recursive: true });
  const notice = "// Generated by scripts/scrape.ts. Do not edit manually.\n\n";
  const exercisesSource = `${notice}export type Exercise = {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
};

export const exercises: Record<string, Exercise> = ${JSON.stringify(exercises, null, 2)};
`;
  const routinesSource = `${notice}export type BendRoutine = {
  slug: string;
  name: string;
  description: string;
  totalMinutes: number;
  exerciseIds: string[];
};

export const bendRoutines: BendRoutine[] = ${JSON.stringify(routines, null, 2)};
`;

  await Promise.all([
    writeFile(join(DATA_DIR, "exercises.ts"), exercisesSource),
    writeFile(join(DATA_DIR, "bendRoutines.ts"), routinesSource),
  ]);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const fetchHtml = createHtmlFetcher(options.refresh);
  const indexHtml = await fetchHtml(
    `${BEND_URL}/routines`,
    join(CACHE_DIR, "routines.html"),
  );
  const availableSlugs = parseRoutineSlugs(indexHtml);
  let slugs = availableSlugs;

  if (options.slugs.length > 0) {
    const knownSlugs = new Set(availableSlugs);
    for (const slug of options.slugs) {
      if (!knownSlugs.has(slug)) throw new Error(`Unknown routine slug: ${slug}`);
    }
    slugs = [...new Set(options.slugs)];
  }
  if (options.limit !== undefined) slugs = slugs.slice(0, options.limit);

  console.error(`Parsing ${slugs.length} of ${availableSlugs.length} routines...`);
  const parsedPages = await mapConcurrent(slugs, async (slug) => {
    const html = await fetchHtml(
      `${BEND_URL}/routines/${slug}`,
      join(CACHE_DIR, "routines", `${slug}.html`),
    );
    const parsed = parseRoutinePage(slug, html);
    console.error(`  ${slug}: ${parsed.exercises.length} exercises`);
    return parsed;
  });
  const library = buildLibrary(parsedPages);

  if (options.preview) {
    console.log(JSON.stringify(library, null, 2));
    return;
  }

  await downloadImages(library.exercises);
  await emitData(library.exercises, library.routines);
  console.error(
    `Wrote ${Object.keys(library.exercises).length} unique exercises and ${library.routines.length} routines.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
