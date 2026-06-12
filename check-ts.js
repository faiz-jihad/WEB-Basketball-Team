import ts from 'typescript';
import fs from 'fs';

const filePath = 'd:/BasketBall Team Website/premium-hoops/src/components/AdminPortal.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const sourceFile = ts.createSourceFile(
  'AdminPortal.tsx',
  content,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

const program = ts.createProgram([filePath], {
  jsx: ts.JsxEmit.React,
  esModuleInterop: true,
  strict: true,
  skipLibCheck: true
});

const diagnostics = ts.getPreEmitDiagnostics(program);

if (diagnostics.length > 0) {
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    }
  });
} else {
  console.log('No TypeScript errors found!');
}
