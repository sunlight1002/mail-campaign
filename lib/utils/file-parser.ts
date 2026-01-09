import * as XLSX from "xlsx"

export interface Prospect {
  firstName: string
  phoneNumber: string
  email: string
  propertyAddress: string
}

export async function parseProspectFile(file: File): Promise<Prospect[]> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase()

  if (fileExtension === "csv") {
    return parseCSV(file)
  } else if (fileExtension === "xlsx" || fileExtension === "xls") {
    return parseExcel(file)
  } else {
    throw new Error("Unsupported file format. Please upload a CSV or XLSX file.")
  }
}

async function parseCSV(file: File): Promise<Prospect[]> {
  const text = await file.text()
  const lines = text.split("\n").filter(line => line.trim() !== "")
  
  if (lines.length === 0) {
    throw new Error("CSV file is empty")
  }

  // Handle CSV with potential quoted values
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const data: Prospect[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    
    if (values.length === 0 || values.every(v => !v.trim())) {
      continue // Skip empty rows
    }

    const firstNameIdx = headers.findIndex(h => 
      h.includes("first") && !h.includes("last") || 
      (h.includes("name") && !h.includes("last") && !h.includes("full"))
    )
    const phoneIdx = headers.findIndex(h => 
      h.includes("phone") || h.includes("mobile") || h.includes("cell")
    )
    const emailIdx = headers.findIndex(h => 
      h.includes("email") || h.includes("e-mail")
    )
    const addressIdx = headers.findIndex(h => 
      h.includes("address") || 
      h.includes("property") || 
      h.includes("location")
    )

    if (firstNameIdx === -1 && phoneIdx === -1 && emailIdx === -1 && addressIdx === -1) {
      continue // Skip rows without any recognizable columns
    }

    data.push({
      firstName: values[firstNameIdx]?.trim() || "",
      phoneNumber: values[phoneIdx]?.trim() || "",
      email: values[emailIdx]?.trim() || "",
      propertyAddress: values[addressIdx]?.trim() || "",
    })
  }

  return data.filter(p => p.firstName || p.phoneNumber || p.email || p.propertyAddress)
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  
  values.push(current.trim()) // Add last value
  
  return values
}

async function parseExcel(file: File): Promise<Prospect[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  
  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error("Excel file has no sheets")
  }
  
  const worksheet = workbook.Sheets[firstSheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: "",
    raw: false
  }) as string[][]

  if (jsonData.length === 0) {
    throw new Error("Excel file is empty")
  }

  // First row is headers
  const headers = (jsonData[0] || []).map((h: any) => 
    String(h).trim().toLowerCase()
  )
  
  const data: Prospect[] = []

  // Process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] || []
    
    if (row.length === 0 || row.every(cell => !String(cell).trim())) {
      continue // Skip empty rows
    }

    const firstNameIdx = headers.findIndex(h => 
      String(h).includes("first") && !String(h).includes("last") || 
      (String(h).includes("name") && !String(h).includes("last") && !String(h).includes("full"))
    )
    const phoneIdx = headers.findIndex(h => 
      String(h).includes("phone") || 
      String(h).includes("mobile") || 
      String(h).includes("cell")
    )
    const emailIdx = headers.findIndex(h => 
      String(h).includes("email") || 
      String(h).includes("e-mail")
    )
    const addressIdx = headers.findIndex(h => 
      String(h).includes("address") || 
      String(h).includes("property") || 
      String(h).includes("location")
    )

    if (firstNameIdx === -1 && phoneIdx === -1 && emailIdx === -1 && addressIdx === -1) {
      continue // Skip rows without any recognizable columns
    }

    data.push({
      firstName: String(row[firstNameIdx] || "").trim(),
      phoneNumber: String(row[phoneIdx] || "").trim(),
      email: String(row[emailIdx] || "").trim(),
      propertyAddress: String(row[addressIdx] || "").trim(),
    })
  }

  return data.filter(p => p.firstName || p.phoneNumber || p.email || p.propertyAddress)
}

