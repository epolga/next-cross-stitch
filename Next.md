# Guide to Enable Next.js Application to Interact with DynamoDB and Remove Express Server

This document outlines the steps to transition a Next.js application to interact directly with AWS DynamoDB, eliminating the need for an Express server and MySQL database.

---

## Step 1: Verify No MySQL Dependencies
- **Next.js Application**:
  - Navigate to your Next.js project:
    ```bash
    cd D:\ann\Git\next-cross-stitch
    ```
  - Search for MySQL-related terms:
    ```bash
    grep -r -i "mysql" .
    grep -r -i "sequelize" .
    ```
  - Check `package.json` for MySQL dependencies (`mysql`, `mysql2`, `sequelize`).
- **Express Server**:
  - Navigate to your Express server project:
    ```bash
    cd D:\ann\Git\cross-stitch-api-node
    ```
  - Inspect `package.json`:
    ```bash
    cat package.json
    ```
  - Ensure no MySQL dependencies are present.
- **Elastic Beanstalk**:
  - Go to **Elastic Beanstalk > Environments > cross-stitch-api-node-env > Configuration > Database** in the AWS Console.
  - Confirm no RDS (MySQL) instance is configured.

---

## Step 2: Install AWS SDK in Next.js
- Navigate to your Next.js project:
  ```bash
  cd D:\ann\Git\next-cross-stitch
  ```
- Install required AWS SDK packages and `sharp` for image processing:
  ```bash
  npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/util-dynamodb sharp
  ```

---

## Step 3: Create Next.js API Routes
- **Create API Route Directories**:
  ```bash
  mkdir -p app/api/albums app/api/all-designs app/api/design/[designId]
  ```
- **Implement API Routes**:
  - **`/api/albums/route.ts`**:
    ```typescript
    import { NextResponse } from 'next/server';
    import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
    import { unmarshall } from '@aws-sdk/util-dynamodb';

    const client = new DynamoDBClient({ region: 'us-east-1' });
    const tableName = 'CrossStitchItems';

    export async function GET() {
      try {
        const command = new QueryCommand({
          TableName: tableName,
          IndexName: 'AlbumIndex',
          KeyConditionExpression: 'EntityType = :et',
          ExpressionAttributeValues: { ':et': { S: 'ALBUM' } }
        });

        const response = await client.send(command);
        const albums = response.Items?.map(item => {
          const data = unmarshall(item);
          return {
            albumId: parseInt(data.PK.split('#')[1]),
            caption: data.Caption
          };
        }) || [];

        return NextResponse.json(albums);
      } catch (err) {
        console.error('Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }
    ```
  - **`/api/all-designs/route.ts`**:
    ```typescript
    import { NextResponse } from 'next/server';
    import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
    import { unmarshall } from '@aws-sdk/util-dynamodb';

    const client = new DynamoDBClient({ region: 'us-east-1' });
    const tableName = 'CrossStitchItems';

    async function getItemWithMaxNGlobalPage() {
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'NGlobalPageIndex',
        KeyConditionExpression: 'EntityType = :et',
        ExpressionAttributeValues: { ':et': { S: 'DESIGN' } },
        ProjectionExpression: 'NGlobalPage',
        ScanIndexForward: false,
        Limit: 1
      });

      const result = await client.send(command);
      return result.Items?.length ? Number(unmarshall(result.Items[0]).NGlobalPage) : -1;
    }

    export async function GET(request: Request) {
      try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '0');
        const pageSize = parseInt(searchParams.get('pageSize') || '60');

        const total = await getItemWithMaxNGlobalPage();
        const endNGlobalPage = total - (page * pageSize);
        const startNGlobalPage = Math.max(0, endNGlobalPage - pageSize + 1);

        if (pageSize < 1 || page < 0) {
          return NextResponse.json({ error: 'Invalid page or pageSize' }, { status: 400 });
        }

        const command = new QueryCommand({
          TableName: tableName,
          IndexName: 'NGlobalPageIndex',
          KeyConditionExpression: 'EntityType = :et AND NGlobalPage BETWEEN :start AND :end',
          ExpressionAttributeValues: {
            ':et': { S: 'DESIGN' },
            ':start': { N: startNGlobalPage.toString() },
            ':end': { N: endNGlobalPage.toString() }
          },
          ScanIndexForward: false
        });

        const response = await client.send(command);
        const designs = response.Items?.map(item => {
          const data = unmarshall(item);
          return {
            designId: data.DesignID,
            albumId: parseInt(data.PK.split('#')[1]),
            caption: data.Caption,
            description: data.Description || null,
            nDownloaded: data.NDownloads || 0,
            notes: data.Notes || null,
            width: data.Width || null,
            height: data.Height || null,
            text: data.Text || null,
            nPage: data.NPage || null,
            nGlobalPage: data.NGlobalPage
          };
        }) || [];

        return NextResponse.json({
          designs,
          total,
          page,
          lastEvaluatedKey: response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : null
        });
      } catch (err) {
        console.error('Error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }
    }
    ```
  - **`/api/design/[designId]/route.ts`**:
    ```typescript
    import { NextResponse } from 'next/server';
    import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
    import { unmarshall } from '@aws-sdk/util-dynamodb';

    const client = new DynamoDBClient({ region: 'us-east-1' });
    const tableName = 'CrossStitchItems';

    export async function GET(request: Request, { params }: { params: { designId: string } }) {
      try {
        const designId = parseInt(params.designId);
        if (isNaN(designId) || designId <= 0) {
          return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
        }

        const command = new QueryCommand({
          TableName: tableName,
          IndexName: 'DesignIndex',
          KeyConditionExpression: 'EntityType = :et AND DesignID = :did',
          ExpressionAttributeValues: {
            ':et': { S: 'DESIGN' },
            ':did': { N: designId.toString() }
          }
        });

        const response = await client.send(command);
        if (!response.Items || response.Items.length === 0) {
          return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        const data = unmarshall(response.Items[0]);
        const design = {
          designId: parseInt(data.DesignID),
          albumId: parseInt(data.AlbumID),
          caption: data.Caption || '',
          description: data.Description || '',
          nDownloaded: parseInt(data.NDownloaded) || 0,
          notes: data.Notes || '',
          width: parseInt(data.Width) || 0,
          height: parseInt(data.Height) || 0,
          text: data.Text || '',
          nPage: parseInt(data.NPage) || 0
        };

        return NextResponse.json(design);
      } catch (err) {
        console.error('Error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }
    }
    ```

---

## Step 4: Configure IAM Permissions for Next.js
- **For Elastic Beanstalk**:
  - Use the existing IAM role (`aws-elasticbeanstalk-ec2-role`) with this policy:
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "dynamodb:Query",
            "dynamodb:GetItem",
            "dynamodb:Scan",
            "dynamodb:DescribeTable"
          ],
          "Resource": [
            "arn:aws:dynamodb:us-east-1:358174257684:table/CrossStitchItems",
            "arn:aws:dynamodb:us-east-1:358174257684:table/CrossStitchItems/index/*"
          ]
        },
        {
          "Effect": "Allow",
          "Action": ["s3:GetObject"],
          "Resource": "arn:aws:s3:::cross-stitch-designs-photos/*"
        }
      ]
    }
    ```
- **For Vercel**:
  - Create an IAM user with the above policy in the AWS Console.
  - Add these environment variables in Vercel:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `AWS_REGION=us-east-1`

---

## Step 5: Test Next.js with DynamoDB
- **Set Local AWS Credentials**:
  ```bash
  export AWS_ACCESS_KEY_ID=your-key
  export AWS_SECRET_ACCESS_KEY=your-secret
  export AWS_REGION=us-east-1
  ```
- **Run Next.js Locally**:
  ```bash
  npm run dev
  ```
- **Test API Routes**:
  ```bash
  curl http://localhost:3000/api/albums
  curl http://localhost:3000/api/all-designs?page=0&pageSize=60
  curl http://localhost:3000/api/design/5275
  ```

---

## Step 6: Deploy Next.js Application
- **For Vercel**:
  - Push your code to GitHub:
    ```bash
    git push origin main
    ```
  - Create a Vercel project, link it to your GitHub repository, set environment variables, and deploy.
  - Update your DNS records if needed.
- **For Elastic Beanstalk**:
  - Initialize and deploy:
    ```bash
    cd D:\ann\Git\next-cross-stitch
    eb init -p node.js cross-stitch-next --region us-east-1
    eb create cross-stitch-next-env
    eb deploy
    ```

---

## Step 7: Remove the Express Server
- **Back Up the Express Server**:
  ```bash
  cp -r D:\ann\Git\cross-stitch-api-node D:\ann\Git\cross-stitch-api-node-backup
  ```
- **Delete the Elastic Beanstalk Environment**:
  - **AWS Console**: Go to **Elastic Beanstalk > Environments > cross-stitch-api-node-env > Actions > Terminate Environment**.
  - **AWS CLI**:
    ```bash
    eb terminate cross-stitch-api-node-env
    ```

---

## Step 8: Remove MySQL Database
- **Delete RDS Instance**:
  -