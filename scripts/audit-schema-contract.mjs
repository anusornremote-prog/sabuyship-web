import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const sourceRoot = path.resolve("src")
const extensions = new Set([".ts", ".tsx"])
const usage = new Map()

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name)
    return entry.isDirectory()
      ? filesUnder(resolved)
      : extensions.has(path.extname(entry.name))
        ? [resolved]
        : []
  })
}

function stringValue(node) {
  return node && ts.isStringLiteralLike(node) ? node.text : null
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text
  return null
}

function tableFor(call) {
  let current = call
  while (current) {
    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      current.expression.name.text === "from"
    ) {
      return stringValue(current.arguments[0])
    }
    if (ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression)) {
      current = current.expression.expression
      continue
    }
    if (ts.isPropertyAccessExpression(current)) {
      current = current.expression
      continue
    }
    break
  }
  return null
}

function add(table, kind, column) {
  if (!table || !column) return
  if (!usage.has(table)) usage.set(table, { read: new Set(), write: new Set(), filter: new Set() })
  usage.get(table)[kind].add(column)
}

function addObjectColumns(table, node) {
  const objects = ts.isArrayLiteralExpression(node) ? node.elements : [node]
  for (const object of objects) {
    if (!ts.isObjectLiteralExpression(object)) continue
    for (const property of object.properties) {
      if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
        add(table, "write", propertyName(property.name))
      }
    }
  }
}

for (const filename of filesUnder(sourceRoot)) {
  const text = fs.readFileSync(filename, "utf8")
  const source = ts.createSourceFile(
    filename,
    text,
    ts.ScriptTarget.Latest,
    true,
    filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text
      const table = tableFor(node)
      if (table) {
        if (["insert", "update", "upsert"].includes(method) && node.arguments[0]) {
          addObjectColumns(table, node.arguments[0])
        }
        if (["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in", "order"].includes(method)) {
          add(table, "filter", stringValue(node.arguments[0]))
        }
        if (method === "select") {
          const selection = stringValue(node.arguments[0])
          if (selection && selection !== "*") {
            for (const match of selection.matchAll(/\b[a-z][a-z0-9_]*\b/g)) {
              add(table, "read", match[0])
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}

for (const [table, kinds] of [...usage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`\n[${table}]`)
  for (const kind of ["read", "write", "filter"]) {
    console.log(`${kind}: ${[...kinds[kind]].sort().join(", ")}`)
  }
}
