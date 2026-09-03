# tscircuit for KiCad People

## Episode 1 — Install the CLI and Start a Project

Target runtime: 5 minutes

Format: 1920×1080, 16:9

Approach: manual first; AI is optional and not used in the main workflow

## 00:00 — A different way to begin a PCB

### Narration

If you come from KiCad, you probably expect to begin in a project manager, place symbols in a schematic editor, assign footprints, and eventually move into the PCB editor. tscircuit starts somewhere different: source code.

Components and connections are written in TypeScript and JSX. The toolchain evaluates that source into Circuit JSON, then uses the same circuit data to produce schematic, PCB, 3D, validation, and export views.

This is not “ask an AI for a PCB and trust the answer.” We are taking the manual path. In five minutes, we will install the command-line interface, understand the few command groups that matter at the start, create a project, inspect its files, and verify the setup. We will stop before editing the circuit.

The goal is not speed for its own sake. It is to leave you with a small workflow you can repeat and diagnose without guessing.

## 00:45 — Translate the workflow from KiCad

### Narration

For a KiCad user, the closest useful translation is this: the project is still a directory, but its center is usually an `index.circuit.tsx` source file. JSX elements describe components and traces. Ordinary files such as `package.json` and `tsconfig.json` describe the software environment around the circuit.

The generated Circuit JSON is a shared boundary between the source and the different views. You do not hand-author it today. Also, tscircuit is not simply “KiCad stored as text.” The architecture and workflow are different. The useful connection is that source changes can be reviewed with normal diffs, while electrical and physical results still need engineering checks.

## 01:25 — Install and verify the CLI

### Narration

The package is named `tscircuit`; the command it installs is `tsci`. This series uses Bun consistently. If `bun --version` already prints a version, do not reinstall it. Otherwise, use the current installer from Bun's official documentation, reopen the terminal, and verify Bun again.

Install the CLI:

```sh
bun install --global tscircuit
```

Then verify what the shell will run:

```sh
command -v tsci
tsci version
tsci doctor
tsci --help
```

`command -v` reveals the executable path. `version` proves the CLI starts. `doctor` diagnoses setup problems, and `--help` describes the commands supported by the version actually installed on your machine. If `doctor` reports a failed check, read that check before reinstalling everything. Never show authentication tokens in recordings or issue reports.

## 02:25 — The CLI map you actually need

### Narration

Do not memorize every command. Remember five jobs.

`tsci init` creates a project. `tsci dev` starts the interactive development loop, where later episodes will inspect schematic, PCB, and 3D views.

`tsci check` runs focused validation such as source, netlist, placement, routing difficulty, trace length, and short-circuit checks. `tsci build` evaluates the project and creates deterministic artifacts. `tsci snapshot` creates reference images that are useful in review and continuous integration.

`tsci export` writes formats such as Circuit JSON, SVG, Gerbers, KiCad output, and 3D models. Exporting a file does not by itself prove the circuit is electrically correct or manufacturable.

`tsci search`, `import`, `add`, `remove`, `install`, and `update` handle components and dependencies. Authentication, registry publishing, simulation, and the optional AI agent are later topics.

Whenever syntax is uncertain, ask the installed CLI:

```sh
tsci <command> --help
tsci <command> <subcommand> --help
```

## 03:25 — Initialize the project manually

### Narration

Move to the parent directory where you keep electronics projects and confirm it with `pwd`. Then create the starter project interactively:

```sh
tsci init kicad-people-demo --no-install
```

Read every prompt instead of accepting it blindly. Confirm the project name. When the CLI offers optional tscircuit AI skills, choose No for this manual track. The `--no-install` flag keeps file creation separate from dependency installation, which makes the two operations easier to understand.

Enter the project and restore its dependencies:

```sh
cd kicad-people-demo
bun install
```

For automation, `--yes` can accept defaults and skip prompts, but defaults can change. Use the interactive form when a choice matters.

## 04:20 — Inspect, verify, and stop

### Narration

List the project before running it:

```sh
ls -la
```

`index.circuit.tsx` is the authored circuit entry point. `package.json` records project scripts and development dependencies. `tsconfig.json` enables TypeScript and JSX checking. `tscircuit.config.json` stores project-specific tscircuit configuration. `.npmrc` identifies the package registry for the `@tsci` scope, and `.gitignore` excludes generated or machine-specific files. Bun may also create `bun.lock`; commit that lockfile, but do not hand-edit it. `node_modules` is installed dependency code, not authored circuit source.

Finally, run the generated type-check script:

```sh
bun run typecheck
```

We now have a working CLI, a map of the workflow, and a project whose files we understand. Nothing depended on AI. That foundation matters: every later schematic, PCB, and export begins from these same inspectable files and commands. In Episode 2, we will open `index.circuit.tsx`, explain the starter circuit line by line, and then run `tsci dev`. Stop here with a clean, reproducible starting point.

## Recording checklist

- Reconfirm commands with the installed `tsci --help` before recording.
- Use real VHS terminal captures; do not animate fake editor text.
- Never display `tsci auth print-token` or any registry credential.
- Keep the finished video at 1920×1080, 16:9.

## Primary references

- <https://docs.tscircuit.com/>
- <https://docs.tscircuit.com/intro/installation>
- <https://docs.tscircuit.com/intro/quickstart-cli>
- <https://bun.sh/docs/installation>
