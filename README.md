## TypeScript Files Analysis Script

This Node.js script allows you to analyze TypeScript files within a project directory. It provides various functionalities, including:

- **Duplicate Detection:** Identifies and displays duplicate TypeScript files in the project.
- **Cyclomatic Complexity Analysis:** Calculates and shows the cyclomatic complexity of TypeScript files.
- **Function Counting:** Counts and shows the number of functions in each TypeScript file.

You can choose to execute all functionalities at once or select specific ones using command-line options.

### Usage

```
node analysis.js [project_directory] [options]
```

### Options

- `--path, -p`: Specifies the path of the HTML report file (default: analysis_report.html).
- `--duplicates, -d`: Searches and shows duplicates in TypeScript files.
- `--complexity, -c`: Calculates and shows the cyclomatic complexity of TypeScript files.
- `--functions, -f`: Counts and shows the number of functions in TypeScript files.
- `--all, -a`: Executes all functionalities (duplicates, complexity, and functions).
- `--help, -h`: Shows the help message.

### Dependencies

- [minimist](https://www.npmjs.com/package/minimist): Used for parsing command-line arguments.
- [fs](https://nodejs.org/api/fs.html): Node.js built-in module for file system operations.
- [path](https://nodejs.org/api/path.html): Node.js built-in module for handling file paths.
- [child_process](https://nodejs.org/api/child_process.html): Node.js built-in module for spawning child processes.
- [cyclomatic-complexity](https://www.npmjs.com/package/cyclomatic-complexity): Used for calculating cyclomatic complexity of TypeScript files.

### Installation

1. Clone the repository to your local machine.
2. Install dependencies using `npm install`.

### License

This project is licensed under the [MIT License](LICENSE).

### Author

[Guillermo de Angel]
