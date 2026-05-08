#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { createApp } from "../src/createApp.js";
import path, { dirname } from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgRaw = await fs.readFile(path.join(__dirname, '../package.json'), 'utf-8');
const pkg = JSON.parse(pkgRaw);


// --- store cleanup info
let projectPath = null;
export let clackSpinner = null;
let childProcess = null; // Optional: in case you use exec for npm install

async function cleanOnInterrupt() {
  if (clackSpinner) clackSpinner.stop("Project creation cancelled by user.");

  if (childProcess) {
    try {
      childProcess.kill(); // if using spawn/exec
    } catch (e) {
      console.warn("Couldn't kill npm process:", e.message);
    }
  }

  // Give time for system to release folder lock (especially on Windows)
  await new Promise((r) => setTimeout(r, 500));

  if (projectPath) {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      console.log(
        chalk.yellow("\nProject creation cancelled. Cleanup complete.")
      );
    } catch (e) {
      console.error(chalk.red("⚠️ Cleanup failed:"), e);
    }
  }

  process.exit(1);
}

//! 🛑 Ctrl+C / force quit
process.on("SIGINT", cleanOnInterrupt);
process.on("SIGTERM", cleanOnInterrupt); // Linux friendly

//? getting arguments values
const rawArgs = process.argv.slice(2);

//? flasg we have
const flags = {
  version: rawArgs.includes("--version") || rawArgs.includes("-v"),
  help: rawArgs.includes("--help") || rawArgs.includes("-h"),
  yes: rawArgs.includes("--yes") || rawArgs.includes("-y"),
  typescript: rawArgs.includes("--typescript"),
  noEslint: rawArgs.includes("--no-eslint"),
  noGit: rawArgs.includes("--no-git"),
};

const projectName = rawArgs.find(
  (arg) => !arg.startsWith("-") && !arg.startsWith("--")
);

if (flags.version) {
  console.log(`${chalk.green("create-xpress")} ${chalk.redBright("v"+pkg.version)}`);
  process.exit(0);
}

if (flags.help) {
  console.log(`
    ${chalk.bold.green('Usage:')}
      ${chalk.cyan('npx create-xpress')} ${chalk.yellow('[project-name]')} ${chalk.magenta('[options]')}
    
    ${chalk.bold.green('Options:')}
      ${chalk.yellow('--typescript')}       ${chalk.white('Use TypeScript')}
      ${chalk.yellow('--no-eslint')}         ${chalk.white('Skip ESLint config')}
      ${chalk.yellow('--no-git')}             ${chalk.white('Don’t initialize Git')}
      ${chalk.yellow('-y, --yes')}            ${chalk.white('Accept all defaults')}
      ${chalk.yellow('-v, --version')}        ${chalk.white('Show version')}
      ${chalk.yellow('-h, --help')}           ${chalk.white('Show help')}
    `);
  process.exit(0);
}

async function main() {
  //?handling defaults
  const defaults = {
    projectName: projectName || "server",
    language: flags.typescript ? "ts" : "js",
    eslint: flags.noEslint ? false : true,
    git: flags.noGit ? false : true,
  };

  let response = {};

  //? install with defaults
  if (
    flags.yes ||
    (projectName && (flags.typescript || flags.noEslint || flags.noGit))
  ) {
    response = {};
  }
  else {
    p.intro(chalk.bgCyan.black(" 🚀 Create Xpress "));
    
    response = await p.group(
      {
        projectName: () => {
          if (projectName) return Promise.resolve(projectName);
          return p.text({
            message: "Project name:",
            initialValue: "server",
          });
        },
        language: () =>
          p.select({
            message: "Choose language:",
            options: [
              { value: "ts", label: "TypeScript 🔵", hint: "recommended" },
              { value: "js", label: "JavaScript 🟨" },
            ],
            initialValue: flags.typescript ? "ts" : "js",
          }),
        eslint: () =>
          p.confirm({
            message: "Include ESLint? 🧹",
            initialValue: !flags.noEslint,
          }),
        git: () =>
          p.confirm({
            message: "Initialize Git? 🛠️",
            initialValue: !flags.noGit,
          }),
      },
      {
        onCancel: async () => {
          p.cancel("Operation cancelled.");
          await cleanOnInterrupt();
          process.exit(0);
        },
      }
    );
  }

  const finalAnswers = {
    projectName: projectName || response.projectName || defaults.projectName,
    language: response.language || defaults.language,
    eslint: typeof response.eslint === "boolean" ? response.eslint : defaults.eslint,
    git: typeof response.git === "boolean" ? response.git : defaults.git,
  };

  clackSpinner = p.spinner();
  clackSpinner.start("Scaffolding your Express app...");

  try {
    projectPath = path.resolve(process.cwd(), finalAnswers.projectName);
    await createApp(finalAnswers, clackSpinner);
    clackSpinner.stop(chalk.green("Project created successfully! 🎉"));
    
    let nextSteps = `cd ${finalAnswers.projectName}\nnpm run dev`;
    p.note(nextSteps, "Next steps:");
    p.outro(chalk.cyan("Happy coding!"));
  } catch (e) {
    clackSpinner.stop("Failed to create project.");
    console.error(e);
    await cleanOnInterrupt(); // do cleanup here too
  }
}

main();
