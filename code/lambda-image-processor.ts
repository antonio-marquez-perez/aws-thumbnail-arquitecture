import "@aws-sdk/crc64-nvme-crt"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"

import sharp from "sharp"
import { Readable } from "stream"
import { SQSRecord, S3Event } from "aws-lambda"

const s3 = new S3Client({})

/**
 * Convierte un stream en un buffer
 * @param readableStream - Stream de lectura
 * @returns Buffer
 */
const streamToBuffer = async (readableStream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = []
  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export const handler = async (event: {
  Records: SQSRecord[]
}): Promise<void> => {
  const bucketName = process.env.BUCKET_NAME!
  const productionFolder = process.env.PRODUCTION_FOLDER!

  const record: S3Event = JSON.parse(event.Records[0].body)

  console.log("Record: ", record.Records)
  console.log("Record S3: ", record.Records[0].s3)

  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: record.Records[0].s3.object.key,
    })

    console.log("GET COMMAND", getObjectCommand)

    const { Body } = await s3.send(getObjectCommand)

    if (!Body) {
      throw new Error("No Body found in S3 object.")
    }

    console.log("Image downloaded succesfully ...")

    const inputBuffer = await streamToBuffer(Readable.from(Body as Readable))

    console.log("Buffer ....", inputBuffer)

    // Image processing
    const optimizedImage = await sharp(inputBuffer).resize(500).toBuffer()
    const thumbnail = await sharp(inputBuffer).resize(100).toBuffer()

    const fileName = record.Records[0].s3.object.key.split("/").pop()

    // Subir imágenes procesadas
    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${productionFolder}${fileName}-optimized.jpg`,
          Body: optimizedImage,
          ContentType: "image/jpeg",
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${productionFolder}${fileName}-thumbnail.jpg`,
          Body: thumbnail,
          ContentType: "image/jpeg",
        })
      ),
    ])
  } catch (error) {
    console.error(error)
  }

  /* for (const s3Event of s3Events) {
    const key = decodeURIComponent(s3Event.s3.object.key.replace(/\+/g, " "))

    if (!key.startsWith(tmpFolder)) {
      console.log("Skipping non-tmp folder file.")
      continue
    }

    const outputFileName = key.replace(tmpFolder, productionFolder)

    try {
      // Obtener la imagen desde S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      const { Body } = await s3.send(getObjectCommand)
      if (!Body) {
        console.error("No Body found in S3 object.")
        continue
      }

      const inputBuffer = await streamToBuffer(Readable.from(Body as Readable))

      // Procesar imagen
      const optimizedImage = await sharp(inputBuffer).resize(1024).toBuffer()
      const thumbnail = await sharp(inputBuffer).resize(200).toBuffer()

      // Subir imágenes procesadas
      await Promise.all([
        s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: `${outputFileName}-optimized.jpg`,
            Body: optimizedImage,
            ContentType: "image/jpeg",
          })
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: `${outputFileName}-thumbnail.jpg`,
            Body: thumbnail,
            ContentType: "image/jpeg",
          })
        ),
      ])

      console.log(`Processed and uploaded: ${outputFileName}`)
    } catch (error) {
      console.error("Error processing image:", error)
    }
  } */
}
