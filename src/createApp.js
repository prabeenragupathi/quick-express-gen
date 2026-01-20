import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import ora from "ora";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp({ projectName, language, eslint, git }) {
  const spinner = ora("Creating your project...").start();

  const isTS = language === "ts";
  const projectPath = path.resolve(process.cwd(), projectName);
  const templateDir = path.resolve(
    __dirname,
    `../templates/${isTS ? "ts" : "js"}`
  );
  const utilsDir = path.resolve(__dirname, `../templates/utils`);
  const rootDir = path.resolve(
    import.meta.url.replace("file:///", ""),
    "../../"
  ); // root of the CLI repo
  const gitignoreSrc = path.join(rootDir, "gitignore");

  try {
    // ✅ Check if folder already exists
    try {
      await fs.stat(projectPath); // Check if the directory exists
      console.error(
        chalk.red(`\n ❌ A folder named "${projectName}" already exists.`)
      );
      process.exit(1);
    } catch {
      // Folder does not exist — proceed
    }

    // Create project folder
    await fs.mkdir(projectPath, { recursive: true });

    //? creating dirs
    await createFolders(projectPath, isTS);

    // Copy app file
    const appFile = `app.${isTS ? "ts" : "js"}`;
    const appContent = await fs.readFile(
      path.join(templateDir, appFile),
      "utf-8"
    );
    await fs.writeFile(path.join(projectPath, "src", appFile), appContent);

    // Copy server file
    const serverFile = `server.${isTS ? "ts" : "js"}`;
    const serverContent = await fs.readFile(
      path.join(templateDir, serverFile),
      "utf-8"
    );
    await fs.writeFile(path.join(projectPath, "src", serverFile), serverContent);

    // Create .env
    await fs.writeFile(
      path.join(projectPath, ".env"),
      `PORT=3000\nNODE_ENV="development"`
    );

    //? config env
    const envFilePath = path.join(projectPath, "src", "config", isTS ? "env.ts" : "env.js");
    const srcEnvPath = path.resolve(__dirname, `../templates/env.js`);
    await fs.copyFile(srcEnvPath, envFilePath);

    //?adding utils files
    const utilsProjectPath = path.join(projectPath, "src", "utils");
    const ext = isTS ? "ts" : "js";

    //? transaction doesn't needed for now
    // await fs.copyFile(
    //   path.join(utilsDir, `transaction.${ext}`),
    //   path.join(utilsProjectPath, `transaction.${ext}`)
    // );
    await fs.copyFile(
      path.join(utilsDir, `error.${ext}`),
      path.join(utilsProjectPath, `error.${ext}`)
    );
    await fs.copyFile(
      path.join(utilsDir, `asynHandler.${ext}`),
      path.join(utilsProjectPath, `asynHandler.${ext}`)
    );

    // Create package.json
    const packageJson = {
      name: projectName,
      version: "1.0.0",
      type: "module",
      main: `src/server.${isTS ? "ts" : "js"}`,
      scripts: {
        start: isTS ? `ts-node src/server.ts` : `node src/server.js`,
        dev: isTS ? `tsx watch src/server.ts` : `nodemon src/server.js`,
        release: "standard-version",
        "release:minor": "standard-version --release-as minor",
        "release:major": "standard-version --release-as major",
      },
      imports: {
        "#root/*": "./src/*",
        "#controllers/*": "./src/controllers/*",
        "#models/*": "./src/models/*",
        "#utils/*": "./src/utils/*",
        "#routes/*": "./src/routes/*",
        "#config/*": "./src/config/*",
        "#services/*": "./src/services/*",
        "#middlewares/*": "./src/middlewares/*",
      },
      dependencies: {},
      devDependencies: {},
    };

    await fs.writeFile(
      path.join(projectPath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Change to project directory
    process.chdir(projectPath);

    // Install dependencies
    spinner.text = "Installing dependencies...";
    const deps = ["express", "cors", "dotenv"];
    const devDeps = isTS
      ? [
          "typescript",
          "ts-node",
          "@types/node",
          "@types/express",
          "nodemon",
          "standard-version",
          "tsx"
        ]
      : ["nodemon", "standard-version"];

    execSync(`npm install ${deps.join(" ")}`, { stdio: "inherit" });
    spinner.text = "Installing Dev dependencies...";
    execSync(`npm install -D ${devDeps.join(" ")}`, { stdio: "inherit" });

    if (isTS) {
      spinner.text = "Installing TypeScript tools...";
      execSync(`npm install -D ${devDeps.join(" ")}`, { stdio: "inherit" });

      // Create tsconfig.json
      await fs.writeFile(
        path.join(projectPath, "tsconfig.json"),
        JSON.stringify(
          {
            compilerOptions: {
              target: "esnext",
              module: "esnext",
              moduleResolution: "node",
              strict: true,
              esModuleInterop: true,
              forceConsistentCasingInFileNames: true,
              skipLibCheck: true,
              paths: {
                "#root/*": ["./src/*"],
                "#controllers/*": ["./src/controllers/*"],
                "#models/*": ["./src/models/*"],
                "#utils/*": ["./src/utils/*"],
                "#routes/*": ["./src/routes/*"],
                "#config/*": ["./src/config/*"],
                "#services/*": ["./src/services/*"],
                "#middlewares/*": ["./src/middlewares/*"]
              }
            },
          },
          null,
          2
        )
      );
    }

    if (eslint) {
      spinner.text = "Installing ESLint...";
      execSync(`npm install -D eslint`, { stdio: "inherit" });
      execSync(`npx eslint --init`, { stdio: "inherit" });
    }

    if (git) {
      spinner.text = "Initializing Git...";
      execSync(`git init`, { stdio: "inherit" });
    }

    //? create .gitignore file
    await fs.copyFile(gitignoreSrc, path.join(projectPath, ".gitignore"));

    spinner.succeed();

    console.log(chalk.cyan(`\nNext steps:`));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  npm start or npm run dev`));
  } catch (err) {
    spinner.fail("Failed to create project.");
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      console.log("🧹 Cleaned up created files.");
    } catch (cleanupErr) {
      console.error("⚠️ Cleanup failed:", cleanupErr);
    }
    throw err;
  }
}

async function createFolders(projectPath, isTs) {
  const srcPath = path.join(projectPath, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  const folders = [
    "routes",
    "controllers",
    "models",
    "middlewares",
    "config",
    "services",
    "utils",
  ];

  if(isTs){
    folders.push("types");
  }

  for (const folder of folders) {
    const dirPath = path.join(srcPath, folder);
    await fs.mkdir(dirPath, { recursive: true });
  }
}
