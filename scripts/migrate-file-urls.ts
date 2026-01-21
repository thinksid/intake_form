import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateFileUrls() {
  console.log('Starting migration of file_url to file_urls...')

  try {
    // Find all responses with file_url but no file_urls
    const responses = await prisma.responses.findMany({
      where: {
        file_url: { not: null },
        OR: [
          { file_urls: null },
          { file_urls: '' }
        ]
      },
    })

    console.log(`Found ${responses.length} responses to migrate`)

    if (responses.length === 0) {
      console.log('No responses need migration')
      return
    }

    let migrated = 0
    let errors = 0

    for (const response of responses) {
      try {
        // Convert single URL to JSON array
        const fileUrlsArray = [response.file_url]
        const fileUrlsJson = JSON.stringify(fileUrlsArray)

        await prisma.responses.update({
          where: { id: response.id },
          data: { file_urls: fileUrlsJson },
        })

        migrated++
        if (migrated % 100 === 0) {
          console.log(`Migrated ${migrated}/${responses.length}...`)
        }
      } catch (error) {
        console.error(`Error migrating response ${response.id}:`, error)
        errors++
      }
    }

    console.log(`\nMigration complete!`)
    console.log(`Successfully migrated: ${migrated}`)
    console.log(`Errors: ${errors}`)

    if (errors === 0) {
      console.log(`\nAll responses migrated successfully!`)
      console.log(`You can now safely remove the file_url column from the schema.`)
    } else {
      console.log(`\nSome responses failed to migrate. Please review the errors above.`)
    }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateFileUrls()
  .then(() => {
    console.log('Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
