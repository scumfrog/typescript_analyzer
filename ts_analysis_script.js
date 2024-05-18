/**
 * TypeScript files analysis script.
 * 
 * Usage: node analysis.js [project_directory] [options]
 * 
 * Options:
 *   --path, -p          Specifies the path of the HTML report file (default: analysis_report.html)
 *   --duplicates, -d    Searches and shows duplicates in TypeScript files
 *   --complexity, -c    Calculates and shows the cyclomatic complexity of TypeScript files
 *   --functions, -f     Counts and shows the number of functions in TypeScript files
 *   --all, -a           Executes all functionalities (duplicates, complexity, and functions)
 *   --help, -h          Shows this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const minimist = require('minimist');

// Parse command line options
const args = minimist(process.argv.slice(2), {
    boolean: ['duplicates', 'complexity', 'functions', 'all', 'help'],
    string: ['path'],
    alias: { d: 'duplicates', c: 'complexity', f: 'functions', a: 'all', p: 'path', h: 'help' },
    default: { path: 'analysis_report.html' }
});

// Show help message if --help option is passed
if (args.help) {
    console.log(`
Usage: node analysis.js [project_directory] [options]

Options:
  --path, -p          Specifies the path of the HTML report file (default: analysis_report.html)
  --duplicates, -d    Searches and shows duplicates in TypeScript files
  --complexity, -c    Calculates and shows the cyclomatic complexity of TypeScript files
  --functions, -f     Counts and shows the number of functions in TypeScript files
  --all, -a           Executes all functionalities (duplicates, complexity, and functions)
  --help, -h          Shows this help message

Examples:
  Generate the report with all options:
    node analysis.js path/to/project --path complete_report.html --all

  Generate the report with only duplicates:
    node analysis.js path/to/project --path duplicates_report.html --duplicates

  Generate the report with only complexity:
    node analysis.js path/to/project --path complexity_report.html --complexity

  Generate the report with only functions:
    node analysis.js path/to/project --path functions_report.html --functions

  Show the help message:
    node analysis.js --help
`);
    process.exit(0);
}

// Enable all functionalities if --all option is passed
if (args.all) {
    args.duplicates = true;
    args.complexity = true;
    args.functions = true;
}

const projectDirectory = args._[0];
if (!projectDirectory) {
    console.error('Error: You must provide the project directory as an argument.');
    process.exit(1);
}

// Function to list .ts and .tsx files in a directory and its subdirectories recursively
function listTSFiles(directory) {
    let tsFiles = [];
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            tsFiles = tsFiles.concat(listTSFiles(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            tsFiles.push(filePath);
        }
    });
    return tsFiles;
}

// Function to count the number of lines of code in a file
function countLinesOfCode(file) {
    const content = fs.readFileSync(file, 'utf-8');
    return content.split('\n').length;
}

// Function to count the number of functions and components in a TypeScript file
function countFunctionsAndComponents(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const functions = content.match(/(?:function|class)\s+(\w+)/g) || [];
    return { functions: functions.length };
}

// Function to identify the dependencies of a file
function identifyDependencies(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
    const dependencies = new Set();
    imports.forEach(importStmt => {
        const match = importStmt.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
        if (match && match[1] !== 'react' && match[1] !== 'react-redux') {
            dependencies.add(match[1]);
        }
    });
    return Array.from(dependencies);
}

// Function to analyze the cyclomatic complexity of a TypeScript file
function analyzeCyclomaticComplexity(file) {
    const command = `npx cyclomatic-complexity ${file} --json`;
    try {
        const result = execSync(command, { encoding: 'utf-8' });
        const json = JSON.parse(result);
        if (json.length === 0) {
            return 0;
        }
        const functions = json[0].functionComplexities;
        const totalComplexity = functions.reduce((total, fn) => total + fn.complexity, 0);
        return totalComplexity;
    } catch (error) {
        return 0;
    }
}

// Function to read the content of a file
function readFileContent(file) {
    return fs.readFileSync(file, 'utf-8');
}

// Function to compare the content of two files
function compareFileContents(file1, file2) {
    const content1 = readFileContent(file1);
    const content2 = readFileContent(file2);
    return content1 === content2;
}

// Function to find duplicates in the list of files
function findDuplicates(files) {
    const duplicates = new Map();
    files.forEach(file => {
        const fileName = path.basename(file);
        if (!duplicates.has(fileName)) {
            duplicates.set(fileName, new Set());
        }
        duplicates.get(fileName).add(file);
    });
    // Filter duplicates
    return new Map([...duplicates.entries()].filter(([_, set]) => set.size > 1));
}

// List .ts and .tsx files in the project directory
const tsFiles = listTSFiles(projectDirectory);

// Variables to calculate the overall complexity of the project and the total lines of code
let totalComplexity = 0;
let totalLinesOfCode = 0;

// Create HTML report
let reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TypeScript Files Analysis Report</title>
<style>
body { font-family: Arial, sans-serif; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
th { background-color: #f2f2f2; cursor: pointer; }
/* Style for duplicate rows */
tr.duplicate {
    background-color: #ffe6e6; /* Highlight color */
}
</style>
<script>
function sortTable(column) {
    const table = document.getElementById('analysis-table');
    const rows = Array.from(table.rows).slice(1); // Exclude the header row
    const ascending = table.rows[0].cells[column].classList.toggle('ascending');
    table.rows[0].cells[column].classList.toggle('descending', !ascending);

    rows.sort((rowA, rowB) => {
        const valueA = rowA.cells[column].textContent.trim();
        const valueB = rowB.cells[column].textContent.trim();
        if (!isNaN(valueA) && !isNaN(valueB)) {
            return ascending ? Number(valueA) - Number(valueB) : Number(valueB) - Number(valueA);
        } else {
            return ascending ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
    });

    rows.forEach(row => table.appendChild(row));
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#analysis-table th').forEach((header, index) => {
        header.addEventListener('click', () => {
            sortTable(index);
        });
    });
});
</script>
</head>
<body>
<h1>TypeScript Files Analysis Report</h1>
<h2>Project Name: ${path.basename(projectDirectory)}</h2>
`;

// Calculate summary of lines of code and complexity
tsFiles.forEach((file, index) => {
    totalLinesOfCode += countLinesOfCode(file);
    if (args.complexity) {
        totalComplexity += analyzeCyclomaticComplexity(file);
    }
    // Display progress
    const progress = Math.floor((index + 1) / tsFiles.length * 100);
    process.stdout.write(`Analyzing files: ${progress}%\r`);
});

// Determine project complexity level
let complexityLevel = '';
if (args.complexity) {
    if (totalComplexity <= 1000) {
        complexityLevel = 'Low to Medium';
    } else if (totalComplexity > 1000 && totalComplexity <= 2000) {
        complexityLevel = 'Medium to High';
    } else {
        complexityLevel = 'High';
    }
}

// Add summary to the HTML report
reportHTML += `
<p>Total lines of code in the project: ${totalLinesOfCode}</p>
${args.complexity ? `<p>Overall project complexity: ${totalComplexity} (${complexityLevel})</p>` : ''}
`;

// Add duplicate information to the HTML report
let duplicates = new Map();
if (args.duplicates) {
    duplicates = findDuplicates(tsFiles);
    if (duplicates.size > 0) {
        reportHTML += '<h2>Duplicates:</h2>';
        duplicates.forEach(([file1, file2]) => {
            reportHTML += `<p>Duplicate: ${file1} is identical to ${file2}</p>`;
        });
    } else {
        reportHTML += '<p>No duplicates found.</p>';
    }
}

// Determine columns to show
const columns = [
    { name: 'File', active: true },
    { name: 'Lines of Code', active: true },
    { name: 'Functions', active: args.functions },
    { name: 'Dependencies', active: true },
    { name: 'Cyclomatic Complexity', active: args.complexity }
];

// Generate table header
reportHTML += '<table id="analysis-table"><thead><tr>';
columns.forEach((column, index) => {
    if (column.active) {
        reportHTML += `<th onclick="sortTable(${index})">${column.name}</th>`;
    }
});
reportHTML += '</tr></thead><tbody>';

// Generate table rows
tsFiles.forEach((file, index) => {
    const fileName = path.basename(file);
    const linesOfCode = countLinesOfCode(file);
    const { functions } = args.functions ? countFunctionsAndComponents(file) : { functions: '-' };
    const dependencies = identifyDependencies(file).join(', '); // Format dependencies
    const cyclomaticComplexity = args.complexity ? analyzeCyclomaticComplexity(file) : '-';
    
    reportHTML += `<tr ${duplicates.has(fileName) ? 'class="duplicate"' : ''}>`;
    columns.forEach(column => {
        if (column.active) {
            if (column.name === 'File') reportHTML += `<td>${fileName}</td>`;
            if (column.name === 'Lines of Code') reportHTML += `<td>${linesOfCode}</td>`;
            if (column.name === 'Functions') reportHTML += `<td>${functions}</td>`;
            if (column.name === 'Dependencies') reportHTML += `<td>${dependencies}</td>`;
            if (column.name === 'Cyclomatic Complexity') reportHTML += `<td>${cyclomaticComplexity}</td>`;
        }
    });
    reportHTML += '</tr>';
    // Display progress
    const progress = Math.floor((index + 1) / tsFiles.length * 100);
    process.stdout.write(`Generating report: ${progress}%\r`);
});

reportHTML += `
</tbody>
</table>
</body>
</html>
`;

// Write HTML report to a file
const reportPath = path.join(projectDirectory, args.path);
fs.writeFileSync(reportPath, reportHTML);

console.log(`\nHTML report generated: ${reportPath}`);
