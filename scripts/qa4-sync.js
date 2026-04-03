const https = require('https')
const fs    = require('fs')

// Suporta dois modos:
// 1. QA4_COMPANIES = JSON com múltiplos produtos: {"saucedemo":"key1","carhub":"key2"}
// 2. QA4_API_KEY   = chave única (projeto com um só produto)

const SYNC_URL = 'https://ivmdgybacqbkpyamtjrd.supabase.co/functions/v1/cypress-sync'

function fetchTitleMap(apiKey) {
  return new Promise((resolve, reject) => {
    https.get(`${SYNC_URL}?api_key=${apiKey}`, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (!parsed.titleMap) {
            reject(new Error('Resposta inválida: ' + data))
          } else {
            resolve(parsed.titleMap)
          }
        } catch (e) {
          reject(new Error('Erro ao parsear resposta: ' + e.message))
        }
      })
    }).on('error', reject)
  })
}

async function main() {
  const companiesEnv = process.env.QA4_COMPANIES
  const singleKey    = process.env.QA4_API_KEY

  if (!companiesEnv && !singleKey) {
    console.error('4QA: defina QA4_COMPANIES (multi-produto) ou QA4_API_KEY (produto único)')
    process.exit(1)
  }

  const combinedMap = {}

  if (companiesEnv) {
    // Modo multi-produto: {"saucedemo":"key1","carhub":"key2"}
    let companies
    try {
      companies = JSON.parse(companiesEnv)
    } catch (e) {
      console.error('4QA: QA4_COMPANIES não é um JSON válido — ex: {"saucedemo":"key1","carhub":"key2"}')
      process.exit(1)
    }

    for (const [folder, apiKey] of Object.entries(companies)) {
      console.log(`4QA: sincronizando produto "${folder}"...`)
      try {
        const titleMap = await fetchTitleMap(apiKey)
        for (const [title, scenarioId] of Object.entries(titleMap)) {
          // Chave = "pasta:título" — garante unicidade entre produtos
          combinedMap[`${folder}:${title}`] = { scenarioId, apiKey }
        }
        console.log(`4QA: "${folder}" — ${Object.keys(titleMap).length} cenários`)
      } catch (e) {
        console.error(`4QA: erro ao sincronizar "${folder}" —`, e.message)
        process.exit(1)
      }
    }
  } else {
    // Modo produto único: QA4_API_KEY
    console.log('4QA: sincronizando produto único...')
    try {
      const titleMap = await fetchTitleMap(singleKey)
      for (const [title, scenarioId] of Object.entries(titleMap)) {
        combinedMap[`default:${title}`] = { scenarioId, apiKey: singleKey }
      }
      console.log(`4QA: ${Object.keys(titleMap).length} cenários sincronizados`)
    } catch (e) {
      console.error('4QA: erro ao sincronizar —', e.message)
      process.exit(1)
    }
  }

  fs.writeFileSync('qa4-scenarios.json', JSON.stringify(combinedMap, null, 2), 'utf-8')
  console.log(`4QA: qa4-scenarios.json gerado com ${Object.keys(combinedMap).length} entradas`)
}

main()
