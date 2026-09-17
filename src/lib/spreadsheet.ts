type SpreadsheetRecord = Record<string, unknown>

const normalizeCellValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return ""
  if (value instanceof Date || ["string", "number", "boolean"].includes(typeof value)) return value
  if (typeof value !== "object") return String(value)

  if ("result" in value && value.result !== undefined) return normalizeCellValue(value.result)
  if ("text" in value && typeof value.text === "string") return value.text
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((item) => item?.text || "").join("")
  }

  return String(value)
}

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      row.push(value)
      value = ""
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1
      row.push(value)
      rows.push(row)
      row = []
      value = ""
    } else {
      value += character
    }
  }

  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

const rowsToRecords = (rows: unknown[][]): SpreadsheetRecord[] => {
  const [headerRow, ...dataRows] = rows
  if (!headerRow) return []

  const headers = headerRow.map((value) => String(normalizeCellValue(value)).trim())
  return dataRows.flatMap((row) => {
    const record = Object.fromEntries(
      headers
        .map((header, index) => [header, normalizeCellValue(row[index])])
        .filter(([header]) => header),
    )
    return Object.values(record).some((value) => value !== "") ? [record] : []
  })
}

export async function readSpreadsheetRecords(file: File): Promise<SpreadsheetRecord[]> {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return rowsToRecords(parseCsv(await file.text()))
  }

  const { Workbook } = await import("exceljs")
  const workbook = new Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const rows: unknown[][] = []
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    rows.push(Array.isArray(row.values) ? row.values.slice(1) : [])
  })
  return rowsToRecords(rows)
}

export async function exportSpreadsheet(
  records: SpreadsheetRecord[],
  sheetName: string,
  fileName: string,
) {
  if (!records.length) return

  const { Workbook } = await import("exceljs")
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  const headers = Object.keys(records[0])
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(40, Math.max(12, header.length + 2)),
  }))
  records.forEach((record) => worksheet.addRow(record))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
