import { useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Settings2, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileUploader,
  AnalysisReport,
  PeriodSelector,
  ImportOptions,
  ImportResult,
} from '@/features/import'
import { useAnalyzeImport, useExecuteImport } from '@/features/import'
import type {
  ImportSource,
  ImportOperationType,
  AnalyzeImportResponse,
  ExecuteImportResponse,
} from '@/lib/api/types'

type ImportState =
  | 'idle'
  | 'fileSelected'
  | 'analyzing'
  | 'analyzed'
  | 'importing'
  | 'imported'
  | 'error'

export default function ImportPage() {
  const navigate = useNavigate()

  // State
  const [importState, setImportState] = useState<ImportState>('idle')
  const [source] = useState<ImportSource>('coinkeeper')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvBase64, setCsvBase64] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImportResponse | null>(null)
  const [importResult, setImportResult] = useState<ExecuteImportResponse | null>(null)

  // Period selection
  const [periodMode, setPeriodMode] = useState<'full' | 'custom' | 'days'>('full')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  // Options
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [createTags, setCreateTags] = useState(false)
  const [dryRun, setDryRun] = useState(false)

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<ImportOperationType[]>(['expense', 'transfer', 'income'])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  // Mutations
  const analyzeImport = useAnalyzeImport()
  const executeImport = useExecuteImport()

  // File to Base64 conversion
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove prefix "data:text/csv;base64,"
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    try {
      const base64 = await fileToBase64(file)
      setCsvBase64(base64)
      setImportState('fileSelected')
    } catch {
      setImportState('error')
    }
  }, [])

  const handleAnalyze = async () => {
    if (!csvBase64 || !selectedFile) return

    setImportState('analyzing')

    try {
      const result = await analyzeImport.mutateAsync({
        source,
        csvData: csvBase64,
        fileName: selectedFile.name,
      })
      setAnalysisResult(result)
      setImportState('analyzed')

      // Set default dates from analysis
      if (result.fullPeriod) {
        setDateFrom(new Date(result.fullPeriod.from))
        setDateTo(new Date(result.fullPeriod.to))
      }
    } catch {
      setImportState('error')
    }
  }

  const handleExecuteImport = async () => {
    if (!csvBase64 || !selectedFile || !analysisResult) return

    setImportState('importing')

    // Determine date range
    let fromDate: string
    let toDate: string

    if (periodMode === 'full') {
      fromDate = analysisResult.fullPeriod.from.split('T')[0]
      toDate = analysisResult.fullPeriod.to.split('T')[0]
    } else if (periodMode === 'custom' && dateFrom && dateTo) {
      fromDate = dateFrom.toISOString().split('T')[0]
      toDate = dateTo.toISOString().split('T')[0]
    } else if (periodMode === 'days' && selectedDays.length > 0) {
      const sorted = [...selectedDays].sort()
      fromDate = sorted[0]
      toDate = sorted[sorted.length - 1]
    } else {
      fromDate = analysisResult.fullPeriod.from.split('T')[0]
      toDate = analysisResult.fullPeriod.to.split('T')[0]
    }

    try {
      const result = await executeImport.mutateAsync({
        source,
        csvData: csvBase64,
        fileName: selectedFile.name,
        dateFrom: fromDate,
        dateTo: toDate,
        skipDuplicates,
        createTags,
        dryRun,
        types: selectedTypes.length === 3 ? undefined : selectedTypes,
        accounts: selectedAccounts.length === 0 ? undefined : selectedAccounts,
      })
      setImportResult(result)
      setImportState('imported')
    } catch {
      setImportState('error')
    }
  }

  const handleReset = () => {
    setImportState('idle')
    setSelectedFile(null)
    setCsvBase64(null)
    setAnalysisResult(null)
    setImportResult(null)
    setPeriodMode('full')
    setDateFrom(undefined)
    setDateTo(undefined)
    setSelectedDays([])
    setSelectedTypes(['expense', 'transfer', 'income'])
    setSelectedAccounts([])
  }

  const handleNavigateToMappings = (type?: string) => {
    navigate(`/import/mappings${type ? `?tab=${type}` : ''}`)
  }

  // Helper to access fields that may come as snake_case or camelCase from backend
  const getRowField = (row: typeof analysisResult.rows[0], snakeCase: string, camelCase: string): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any
    return r[snakeCase] ?? r[camelCase] ?? ''
  }

  // Extract available accounts from analysis result
  const availableAccounts = useMemo(() => {
    if (!analysisResult) return []
    // First try to use accounts from API
    if (analysisResult.accounts && analysisResult.accounts.length > 0) {
      return [...analysisResult.accounts].sort()
    }
    // Fallback: extract unique accounts from rows
    const accounts = new Set<string>()
    analysisResult.rows.forEach((row) => {
      const fromAccount = getRowField(row, 'from_account', 'fromAccount')
      const toAccount = getRowField(row, 'to_account', 'toAccount')
      if (row.type === 'transfer') {
        if (fromAccount) accounts.add(fromAccount)
        if (toAccount) accounts.add(toAccount)
      } else if (row.type === 'expense' || row.type === 'income') {
        if (fromAccount) accounts.add(fromAccount)
      }
    })
    return Array.from(accounts).sort()
  }, [analysisResult])

  // Check if import is blocked
  const hasUnmappedAccountsOrCategories =
    analysisResult?.unmappedItems.some(
      (item) => item.type === 'account' || item.type === 'category'
    ) ?? false

  // Calculate ready to import count based on selected filters
  const readyToImportCount = useMemo(() => {
    if (!analysisResult) return 0

    // Filter rows based on selected types and accounts
    const filteredRows = analysisResult.rows.filter((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      const fromAccount = r.from_account ?? r.fromAccount ?? ''
      const isDuplicate = r.is_duplicate ?? r.isDuplicate ?? false
      const hasMapping = r.has_mapping ?? r.hasMapping ?? false

      // Skip corrections - they are never imported
      if (row.type === 'correction') return false

      // Check type filter
      if (!selectedTypes.includes(row.type as ImportOperationType)) return false

      // Check account filter (empty means all accounts)
      if (selectedAccounts.length > 0) {
        if (!selectedAccounts.includes(fromAccount)) return false
      }

      // Skip duplicates if option is enabled
      if (skipDuplicates && isDuplicate) return false

      // Must have mapping to be imported
      if (!hasMapping) return false

      return true
    })

    return filteredRows.length
  }, [analysisResult, selectedTypes, selectedAccounts, skipDuplicates])

  const canImport = !hasUnmappedAccountsOrCategories && readyToImportCount > 0

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Импорт данных</h1>
          <p className="text-muted-foreground text-sm">
            Загрузка операций из внешних источников
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/import/mappings">
            <Settings2 className="h-4 w-4 mr-2" />
            Настройка маппингов
          </Link>
        </Button>
      </div>

      {/* Import Result Screen */}
      {importState === 'imported' && importResult && (
        <ImportResult
          result={importResult}
          onNavigateToExpenses={() => navigate('/expenses')}
          onImportMore={handleReset}
        />
      )}

      {/* Main Flow */}
      {importState !== 'imported' && (
        <>
          {/* Source Selection & File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Источник данных</CardTitle>
              <CardDescription>Выберите формат файла и загрузите данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={source} disabled>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coinkeeper">CoinKeeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FileUploader
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                disabled={importState === 'analyzing' || importState === 'importing'}
              />

              {importState === 'fileSelected' && (
                <div className="flex justify-end">
                  <Button onClick={handleAnalyze} disabled={analyzeImport.isPending}>
                    {analyzeImport.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Анализ...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Анализировать
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {importState === 'analyzed' && analysisResult && (
            <>
              <AnalysisReport
                data={analysisResult}
                source={source}
                onNavigateToMappings={handleNavigateToMappings}
                onMappingCreated={handleAnalyze}
              />

              {/* Period Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Период импорта</CardTitle>
                  <CardDescription>Выберите какие данные импортировать</CardDescription>
                </CardHeader>
                <CardContent>
                  <PeriodSelector
                    fullPeriod={analysisResult.fullPeriod}
                    byDate={analysisResult.byDate}
                    selectedMode={periodMode}
                    onModeChange={setPeriodMode}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateChange={(from, to) => {
                      setDateFrom(from)
                      setDateTo(to)
                    }}
                    selectedDays={selectedDays}
                    onDaysChange={setSelectedDays}
                  />
                </CardContent>
              </Card>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Настройки импорта</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImportOptions
                    skipDuplicates={skipDuplicates}
                    onSkipDuplicatesChange={setSkipDuplicates}
                    createTags={createTags}
                    onCreateTagsChange={setCreateTags}
                    dryRun={dryRun}
                    onDryRunChange={setDryRun}
                    selectedTypes={selectedTypes}
                    onTypesChange={setSelectedTypes}
                    availableAccounts={availableAccounts}
                    selectedAccounts={selectedAccounts}
                    onAccountsChange={setSelectedAccounts}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleReset}>
                  Назад
                </Button>
                <Button
                  onClick={handleExecuteImport}
                  disabled={!canImport || executeImport.isPending}
                >
                  {executeImport.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Импорт...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Импортировать ({readyToImportCount} операций)
                    </>
                  )}
                </Button>
              </div>

              {hasUnmappedAccountsOrCategories && (
                <p className="text-sm text-amber-600 text-center">
                  Настройте маппинги для немапленных счетов и категорий перед импортом
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
