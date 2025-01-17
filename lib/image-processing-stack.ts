import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Bucket, EventType } from "aws-cdk-lib/aws-s3"
import { SqsDestination } from "aws-cdk-lib/aws-s3-notifications"
import { Queue } from "aws-cdk-lib/aws-sqs"
import { Construct } from "constructs"

export class ImagenProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // 1. Create bucket

    const bucket = new Bucket(this, "ProcessorBucket", {
      bucketName: "processor-bucket-workshop",
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const tmpFolder = "tmp/"
    const productionFolder = "production/"

    // 2. Create SQS Queue
    const queue = new Queue(this, "ImageProcessorQueue", {
      queueName: "image-processor-queue",
      visibilityTimeout: Duration.seconds(60),
    })

    // 3. Event configuration
    bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new SqsDestination(queue),
      {
        prefix: tmpFolder,
      }
    )

    // 4. Lambda funtion
    const lambda = new NodejsFunction(this, "ImageProcessorLambda", {
      functionName: "image-processor-lambda",
      entry: `${process.cwd()}/code/lambda-image-processor.ts`,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        PRODUCTION_FOLDER: productionFolder,
      },
      runtime: Runtime.NODEJS_22_X,
      bundling: {
        minify: false,
        nodeModules: [
          "aws-lambda",
          "sharp",
          "@aws-sdk/client-s3",
          "@aws-sdk/crc64-nvme-crt",
        ],
      },
      awsSdkConnectionReuse: true,
    })

    // 5. permissions
    bucket.grantReadWrite(lambda)
    queue.grantConsumeMessages(lambda)

    // 6. Lambda Event Source
    lambda.addEventSource(new SqsEventSource(queue))
  }
}
