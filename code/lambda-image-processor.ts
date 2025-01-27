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

    console.log("Buffer created succesfully ...", inputBuffer)

    // Image processing
    const optimizedImage = await sharp(inputBuffer).resize(500).toBuffer()
    const thumbnail = await sharp(inputBuffer).resize(100).toBuffer()

    const fileName = record.Records[0].s3.object.key.split("/").pop()
    console.log("FILENAME: ", fileName)

    await new PutObjectCommand({
      Bucket: bucketName,
      Key: `${productionFolder}${fileName}-thumbnail.jpg`,
      Body: thumbnail,
      ContentType: "image/jpeg",
    })

    console.log("Thumbnail uploaded succesfully ...")

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
    console.log("Images uploaded succesfully ...")
  } catch (error) {
    console.error(error)
  }
}
