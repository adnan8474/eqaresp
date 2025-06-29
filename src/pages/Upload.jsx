import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function Upload() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [preview, setPreview] = useState([])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const reader = new FileReader()

    reader.onload = evt => {
      try {
        let data = []
        if (ext === 'csv') {
          const parsed = Papa.parse(evt.target.result, { header: true })
          data = parsed.data
        } else if (ext === 'xlsx' || ext === 'xls') {
          const wb = XLSX.read(evt.target.result, { type: 'binary' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          data = XLSX.utils.sheet_to_json(ws)
        } else {
          setError('Unsupported file type')
          return
        }
        setPreview(data.slice(0, 5))
        localStorage.setItem('rawData', JSON.stringify(data))
        navigate('/analysis')
      } catch (err) {
        setError('Failed to parse file')
      }
    }

    if (ext === 'csv') {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  return (
    <div className="p-4">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFile}
        className="mb-4"
      />
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {preview.length > 0 && (
        <table className="table-auto w-full text-sm">
          <thead>
            <tr>
              {Object.keys(preview[0]).map(key => (
                <th key={key} className="border px-2 py-1">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i} className="border px-2 py-1">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
